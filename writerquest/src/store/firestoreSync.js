import {
  doc, getDoc, setDoc, collection,
  getDocs, addDoc, updateDoc, deleteDoc, writeBatch,
} from 'firebase/firestore';
import { db } from '../firebase';

// ── Firestore 구조 ──────────────────────────────────────────────────
// users/{uid}                     ← player, quests, memos
// users/{uid}/novels/{novelId}    ← novel + chapters 내장
// users/{uid}/sessions/{id}       ← WritingSession

const userRef = (uid) => doc(db, 'users', uid);
const novelsRef = (uid) => collection(db, 'users', uid, 'novels');
const novelRef = (uid, id) => doc(db, 'users', uid, 'novels', id);
const sessionsRef = (uid) => collection(db, 'users', uid, 'sessions');

export async function loadUserData(uid) {
  const [userSnap, novelsSnap] = await Promise.all([
    getDoc(userRef(uid)),
    getDocs(novelsRef(uid)),
  ]);

  const userData = userSnap.exists() ? userSnap.data() : null;
  const novels = novelsSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

  return { userData, novels };
}

export async function saveUserMeta(uid, { player, quests, memos }) {
  await setDoc(userRef(uid), { player, quests, memos }, { merge: true });
}

export async function saveNovel(uid, novel) {
  await setDoc(novelRef(uid, novel.id), novel);
}

export async function deleteNovel(uid, novelId) {
  await deleteDoc(novelRef(uid, novelId));
}

export async function saveSession(uid, session) {
  await setDoc(doc(sessionsRef(uid), session.id), session);
}
