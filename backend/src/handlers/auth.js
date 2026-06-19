'use strict';

const crypto = require('crypto');
const { pool } = require('../db');
const { verifyGoogleToken, generateTokens, verifyRefreshToken } = require('../services/authService');

async function googleLogin(event) {
    const body = JSON.parse(event.body || '{}');
    const { idToken } = body;

    if (!idToken) {
        return respond(400, { error: 'idToken required' });
    }

    let googleUser;
    try {
        googleUser = await verifyGoogleToken(idToken);
    } catch {
        return respond(401, { error: 'Invalid Google token' });
    }

    const client = await pool.connect();
    try {
        const { rows } = await client.query(
            `INSERT INTO users (email, google_id, name)
             VALUES ($1, $2, $3)
             ON CONFLICT (google_id) DO UPDATE
             SET name = $3, updated_at = now()
             RETURNING id, email, name`,
            [googleUser.email, googleUser.sub, googleUser.name]
        );
        const user = rows[0];
        const tokens = generateTokens(user.id, user.email);
        const hash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');

        await client.query(
            `UPDATE users SET refresh_token_hash = $1 WHERE id = $2`,
            [hash, user.id]
        );

        return respond(200, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
            user: { id: user.id, email: user.email, name: user.name },
        });
    } finally {
        client.release();
    }
}

async function refreshToken(event) {
    const body = JSON.parse(event.body || '{}');
    const { refreshToken: token } = body;

    if (!token) return respond(400, { error: 'refreshToken required' });

    let payload;
    try {
        payload = verifyRefreshToken(token);
    } catch {
        return respond(401, { error: 'Invalid refresh token' });
    }

    const hash = crypto.createHash('sha256').update(token).digest('hex');
    const client = await pool.connect();
    try {
        const { rows } = await client.query(
            `SELECT id, email FROM users WHERE id = $1 AND refresh_token_hash = $2`,
            [payload.userId, hash]
        );
        if (!rows.length) return respond(401, { error: 'Token revoked' });

        const user = rows[0];
        const tokens = generateTokens(user.id, user.email);
        const newHash = crypto.createHash('sha256').update(tokens.refreshToken).digest('hex');

        await client.query(
            `UPDATE users SET refresh_token_hash = $1 WHERE id = $2`,
            [newHash, user.id]
        );

        return respond(200, {
            accessToken: tokens.accessToken,
            refreshToken: tokens.refreshToken,
        });
    } finally {
        client.release();
    }
}

function respond(statusCode, body) {
    return {
        statusCode,
        headers: { 'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*' },
        body: JSON.stringify(body),
    };
}

module.exports = { googleLogin, refreshToken };