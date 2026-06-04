import { state } from "./state.js"
import {
  getCharacter, saveCharacter,
  getLatestSession, createNewSession,
  getMessages, getMemoPins,
  getAllCorrections, getPinnedCorrections
} from "../firebase/firestore.js"

export async function initSession(uid) {
  state.currentUid = uid

  const character = await getCharacter(uid)
  if (character) state.character = character

  state.memoPins = await getMemoPins(uid)

  const latestSession = await getLatestSession(uid)
  if (latestSession) {
    state.currentSessionId = latestSession.id
  } else {
    state.currentSessionId = await createNewSession(uid)
  }

  state.conversationHistory = await getMessages(uid, state.currentSessionId)
  state.correctionHistory = await getAllCorrections(uid)
  state.pinnedCorrections = await getPinnedCorrections(uid)
}

export async function startNewSession() {
  const uid = state.currentUid
  if (!uid) return

  state.currentSessionId = await createNewSession(uid)
  state.conversationHistory = []
  state.pinnedMessages = []
}

export async function persistCharacter(characterData) {
  const uid = state.currentUid
  if (!uid) return

  state.character = characterData
  await saveCharacter(uid, characterData)
}

export function hasCharacter() {
  return !!state.character.name
}
