import { initializeApp } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-app.js"

// TODO: Firebase Console에서 새 프로젝트 생성 후 아래 값을 교체하세요.
// Console → 프로젝트 설정 → 내 앱 → 웹 앱 추가 → firebaseConfig 복사
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "YOUR_PROJECT_ID.firebaseapp.com",
  projectId: "YOUR_PROJECT_ID",
  storageBucket: "YOUR_PROJECT_ID.appspot.com",
  messagingSenderId: "YOUR_SENDER_ID",
  appId: "YOUR_APP_ID"
}

export const app = initializeApp(firebaseConfig)
