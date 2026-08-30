import { initializeApp, getApps, type FirebaseApp } from "firebase/app"
import { getAuth, type Auth } from "firebase/auth"
import { getFirestore, type Firestore } from "firebase/firestore"

/**
 * 환경변수가 없으면 이 리포지터리에 이미 커밋돼 있는 Firebase 프로젝트로
 * 폴백한다. 덕분에 클론 직후 `npm run dev`가 바로 뜬다.
 * 본인 프로젝트를 쓰려면 .env.local에 NEXT_PUBLIC_FIREBASE_* 를 채우면 된다.
 * (웹 Firebase 설정값은 비밀이 아니다 — 보안은 Firestore 규칙으로 건다.)
 */
const firebaseConfig = {
  apiKey:
    process.env.NEXT_PUBLIC_FIREBASE_API_KEY ??
    "AIzaSyBw5a7fA5mP5SvYVxbzUFS7qyU03z7sXSY",
  authDomain:
    process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN ?? "price-talk-3920f.firebaseapp.com",
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID ?? "price-talk-3920f",
  storageBucket:
    process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET ??
    "price-talk-3920f.firebasestorage.app",
  messagingSenderId:
    process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID ?? "19898547701",
  appId:
    process.env.NEXT_PUBLIC_FIREBASE_APP_ID ??
    "1:19898547701:web:d19241dd0365d6fed734bc",
}

export const app: FirebaseApp = getApps()[0] ?? initializeApp(firebaseConfig)
export const auth: Auth = getAuth(app)
export const db: Firestore = getFirestore(app)
