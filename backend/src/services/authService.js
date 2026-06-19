'use strict';

const jwt = require('jsonwebtoken');
const https = require('https');

const JWT_SECRET = process.env.JWT_SECRET;
const JWT_REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;

function verifyGoogleToken(idToken) {
    return new Promise((resolve, reject) => {
        const url = `https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`;
        https.get(url, (res) => {
            let data = '';
            res.on('data', chunk => { data += chunk; });
            res.on('end', () => {
                try {
                    const parsed = JSON.parse(data);
                    if (parsed.aud !== GOOGLE_CLIENT_ID) {
                        return reject(new Error('Invalid audience'));
                    }
                    resolve(parsed);
                } catch (e) {
                    reject(e);
                }
            });
        }).on('error', reject);
    });
}

function generateTokens(userId, email) {
    const accessToken = jwt.sign(
        { userId, email },
        JWT_SECRET,
        { expiresIn: '1h', algorithm: 'HS256' }
    );
    const refreshToken = jwt.sign(
        { userId },
        JWT_REFRESH_SECRET,
        { expiresIn: '30d', algorithm: 'HS256' }
    );
    return { accessToken, refreshToken };
}

function verifyAccessToken(token) {
    return jwt.verify(token, JWT_SECRET);
}

function verifyRefreshToken(token) {
    return jwt.verify(token, JWT_REFRESH_SECRET);
}

module.exports = { verifyGoogleToken, generateTokens, verifyAccessToken, verifyRefreshToken };