import { getAuth, GoogleAuthProvider, signInWithPopup, signOut, onAuthStateChanged } from "https://www.gstatic.com/firebasejs/10.12.2/firebase-auth.js"
import { app } from "./config.js"

export const auth = getAuth(app)
const provider = new GoogleAuthProvider()

export async function signInWithGoogle() {
  await signInWithPopup(auth, provider)
}

export async function signOutUser() {
  await signOut(auth)
}

export function onAuthChange(callback) {
  onAuthStateChanged(auth, callback)
}
