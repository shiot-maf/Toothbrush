import {
  getFirestore, doc, getDoc, setDoc, addDoc, updateDoc,
  collection, query, orderBy, limit, getDocs, where
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js"
import { app } from "./config.js"

const db = getFirestore(app)

// ── 캐릭터 설정 ──────────────────────────────────────────────

export async function getCharacter(uid) {
  const snap = await getDoc(doc(db, "users", uid, "profile", "character"))
  return snap.exists() ? snap.data() : null
}

export async function saveCharacter(uid, data) {
  await setDoc(doc(db, "users", uid, "profile", "character"), data)
}

// ── 메모 핀 ──────────────────────────────────────────────────

export async function getMemoPins(uid) {
  const snap = await getDoc(doc(db, "users", uid, "profile", "memoPins"))
  return snap.exists() ? (snap.data().pins || []) : []
}

export async function saveMemoPins(uid, pins) {
  await setDoc(doc(db, "users", uid, "profile", "memoPins"), { pins })
}

// ── 세션 ─────────────────────────────────────────────────────

export async function getLatestSession(uid) {
  const q = query(
    collection(db, "users", uid, "conversations"),
    orderBy("updatedAt", "desc"),
    limit(1)
  )
  const snap = await getDocs(q)
  if (snap.empty) return null
  const d = snap.docs[0]
  return { id: d.id, ...d.data() }
}

export async function createNewSession(uid) {
  const ref = await addDoc(collection(db, "users", uid, "conversations"), {
    createdAt: Date.now(),
    updatedAt: Date.now(),
    pinnedMessageIds: []
  })
  return ref.id
}

export async function updateSessionMeta(uid, sessionId, data) {
  await updateDoc(doc(db, "users", uid, "conversations", sessionId), {
    ...data,
    updatedAt: Date.now()
  })
}

// ── 메시지 서브컬렉션 ─────────────────────────────────────────

export async function getMessages(uid, sessionId) {
  const q = query(
    collection(db, "users", uid, "conversations", sessionId, "messages"),
    orderBy("timestamp", "asc")
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}

export async function saveMessage(uid, sessionId, message) {
  await setDoc(
    doc(db, "users", uid, "conversations", sessionId, "messages", message.id),
    message
  )
}

// ── 교정 기록 ─────────────────────────────────────────────────

export async function saveCorrections(uid, corrections) {
  const promises = corrections.map(c =>
    setDoc(doc(db, "users", uid, "corrections", c.id), c)
  )
  await Promise.all(promises)
}

export async function getPinnedCorrections(uid) {
  const q = query(
    collection(db, "users", uid, "corrections"),
    where("pinned", "==", true)
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}

export async function getAllCorrections(uid) {
  const q = query(
    collection(db, "users", uid, "corrections"),
    orderBy("timestamp", "desc")
  )
  const snap = await getDocs(q)
  return snap.docs.map(d => d.data())
}

export async function updateCorrectionPin(uid, corrId, pinned) {
  await updateDoc(doc(db, "users", uid, "corrections", corrId), { pinned })
}
