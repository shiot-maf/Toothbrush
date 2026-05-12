import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js";
import {
  getAuth,
  GoogleAuthProvider,
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signOut as authSignOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js";
import {
  getFirestore,
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  Timestamp,
} from "https://www.gstatic.com/firebasejs/10.12.2/firebase-firestore.js";

// ── 앱 공통 상수 ──────────────────────────────────────────────────────────
export const APP_NAME = '끌어당김의 기록';

// 노트 타입 정의 — 이름·CSS 클래스를 한 곳에서 관리
export const NOTE_TYPES = {
  diary:     { id: 'diary',     label: '자기증명', badgeClass: 'badge-17', chipClass: 'chip-17', dotClass: 'on-17' },
  gratitude: { id: 'gratitude', label: '감사선행', badgeClass: 'badge-21', chipClass: 'chip-21', dotClass: 'on-21' },
  hard:      { id: 'hard',      label: 'HARD',    badgeClass: 'badge-28', chipClass: 'chip-28', dotClass: 'on-28' },
};

export const WEEKDAYS = ['월', '화', '수', '목', '금', '토', '일']; // 0=월(ISO)

// ── Firebase 설정 (직접 채워넣으세요) ─────────────────────────────────────
const firebaseConfig = {
  apiKey: "AIzaSyBU7fCZcVxAre8FGB4j-vX50Oczyse5koU",
  authDomain: "pulling-e5582.firebaseapp.com",
  projectId: "pulling-e5582",
  storageBucket: "pulling-e5582.firebasestorage.app",
  messagingSenderId: "438180348788",
  appId: "1:438180348788:web:c979e6423c943d8c58e221",
  measurementId: "G-2J2E7K615C"
};
// ─────────────────────────────────────────────────────────────────────────

const app      = initializeApp(firebaseConfig);
const auth     = getAuth(app);
const db       = getFirestore(app);
const provider = new GoogleAuthProvider();

// ── 인증 ──────────────────────────────────────────────────────────────────
// 팝업 실패 시 자동으로 리다이렉트 방식으로 폴백
export async function signInWithGoogle() {
  try {
    return await signInWithPopup(auth, provider);
  } catch (e) {
    if (e.code === 'auth/popup-blocked' || e.code === 'auth/popup-closed-by-user') {
      return signInWithRedirect(auth, provider);
    }
    throw e;
  }
}

// 리다이렉트 방식으로 돌아왔을 때 결과 처리
export function getGoogleRedirectResult() {
  return getRedirectResult(auth);
}

export function signOutUser() {
  return authSignOut(auth);
}

export function getCurrentUser() {
  return auth.currentUser;
}

export function onAuthChange(callback) {
  return onAuthStateChanged(auth, callback);
}

// Firebase가 localStorage에서 세션을 복구할 때까지 기다린 후 user 반환
export function waitForAuth() {
  return new Promise(resolve => {
    const unsubscribe = onAuthStateChanged(auth, user => {
      unsubscribe();
      resolve(user);
    });
  });
}

// ── 날짜 유틸 ─────────────────────────────────────────────────────────────
export function formatDate(date) {
  const d = new Date(date);
  return [
    d.getFullYear(),
    String(d.getMonth() + 1).padStart(2, "0"),
    String(d.getDate()).padStart(2, "0"),
  ].join("-");
}

export function getWeekKey(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  // ISO 주번호 계산
  d.setDate(d.getDate() + 3 - ((d.getDay() + 6) % 7));
  const week1 = new Date(d.getFullYear(), 0, 4);
  const weekNum =
    1 +
    Math.round(
      ((d - week1) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7
    );
  return `${d.getFullYear()}-${String(weekNum).padStart(2, "0")}`;
}

// 해당 ISO 주의 월요일 반환
export function getISOMonday(weekKey) {
  const [year, week] = weekKey.split("-").map(Number);
  const jan4 = new Date(year, 0, 4);
  const dayOfWeek = (jan4.getDay() + 6) % 7; // 0=Mon
  const monday = new Date(jan4);
  monday.setDate(jan4.getDate() - dayOfWeek + (week - 1) * 7);
  return monday;
}

// 이번 주 월~일 날짜 범위
export function getThisWeekRange() {
  const today = new Date();
  const dow = (today.getDay() + 6) % 7; // 0=월
  const monday = new Date(today);
  monday.setDate(today.getDate() - dow);
  monday.setHours(0, 0, 0, 0);
  const sunday = new Date(monday);
  sunday.setDate(monday.getDate() + 6);
  return { startDate: formatDate(monday), endDate: formatDate(sunday) };
}

// ── No.17 자기증명 일기 ────────────────────────────────────────────────────
export function saveIdentityDiary(uid, date, data) {
  const ref = doc(db, "users", uid, "identity_diary", date);
  return setDoc(ref, { ...data, createdAt: Timestamp.now() });
}

export async function getIdentityDiary(uid, date) {
  const snap = await getDoc(doc(db, "users", uid, "identity_diary", date));
  return snap.exists() ? snap.data() : null;
}

export async function getIdentityDiaryRange(uid, startDate, endDate) {
  const results = {};
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    const key = formatDate(cur);
    const data = await getIdentityDiary(uid, key);
    if (data) results[key] = data;
    cur.setDate(cur.getDate() + 1);
  }
  return results;
}

// ── No.21 감사 선행기법 ────────────────────────────────────────────────────
export function saveGratitudeAdvance(uid, date, data) {
  const ref = doc(db, "users", uid, "gratitude_advance", date);
  return setDoc(ref, { ...data, createdAt: Timestamp.now() });
}

export async function getGratitudeAdvance(uid, date) {
  const snap = await getDoc(doc(db, "users", uid, "gratitude_advance", date));
  return snap.exists() ? snap.data() : null;
}

export async function getGratitudeAdvanceRange(uid, startDate, endDate) {
  const results = {};
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    const key = formatDate(cur);
    const data = await getGratitudeAdvance(uid, key);
    if (data) results[key] = data;
    cur.setDate(cur.getDate() + 1);
  }
  return results;
}

// ── No.28 HARD 노트 ───────────────────────────────────────────────────────
export function saveHardNote(uid, weekKey, data) {
  const ref = doc(db, "users", uid, "hard_note", weekKey);
  return setDoc(ref, { ...data, createdAt: Timestamp.now() });
}

export async function getHardNote(uid, weekKey) {
  const snap = await getDoc(doc(db, "users", uid, "hard_note", weekKey));
  return snap.exists() ? snap.data() : null;
}

// ── 리포트용 이번 주 전체 데이터 ─────────────────────────────────────────
export async function getThisWeekEntries(uid) {
  const { startDate, endDate } = getThisWeekRange();
  const weekKey = getWeekKey(new Date());
  const [diary, gratitude, hard] = await Promise.all([
    getIdentityDiaryRange(uid, startDate, endDate),
    getGratitudeAdvanceRange(uid, startDate, endDate),
    getHardNote(uid, weekKey),
  ]);
  return { diary, gratitude, hard, startDate, endDate };
}

// ── 기록 열람용 전체 데이터 ───────────────────────────────────────────────
export async function getAllEntries(uid) {
  const [diarySnap, gratSnap, hardSnap] = await Promise.all([
    getDocs(collection(db, "users", uid, "identity_diary")),
    getDocs(collection(db, "users", uid, "gratitude_advance")),
    getDocs(collection(db, "users", uid, "hard_note")),
  ]);

  const diary = {};
  diarySnap.forEach((d) => (diary[d.id] = d.data()));

  const gratitude = {};
  gratSnap.forEach((d) => (gratitude[d.id] = d.data()));

  const hard = {};
  hardSnap.forEach((d) => (hard[d.id] = d.data()));

  return { diary, gratitude, hard };
}
