import { state } from "../core/state.js"
import { updateCorrectionPin, updateSessionMeta } from "../firebase/firestore.js"
import { showToast } from "./toast.js"

export async function toggleMessagePin(msgId) {
  const idx = state.pinnedMessages.findIndex(p => p.id === msgId)

  if (idx >= 0) {
    state.pinnedMessages.splice(idx, 1)
    showToast("핀을 해제했어요.")
  } else {
    if (state.pinnedMessages.length >= 20) {
      showToast("핀은 최대 20개까지 추가할 수 있어요. 오래된 핀을 먼저 해제해주세요.")
      return
    }
    const msg = state.conversationHistory.find(m => m.id === msgId)
    if (!msg) return
    state.pinnedMessages.push(msg)
    showToast("핀에 추가했어요.")
  }

  updatePinButtonUI(msgId, state.pinnedMessages.some(p => p.id === msgId))

  const pinnedMessageIds = state.pinnedMessages.map(p => p.id)
  updateSessionMeta(state.currentUid, state.currentSessionId, { pinnedMessageIds }).catch(err => {
    console.error(err)
    showToast("핀 저장에 실패했어요.")
  })
}

export async function toggleCorrectionPin(corrId) {
  const correction = state.correctionHistory.find(c => c.id === corrId)
    || state.pinnedCorrections.find(c => c.id === corrId)
  if (!correction) return

  const wasPinned = correction.pinned
  correction.pinned = !wasPinned

  if (!wasPinned) {
    if (state.pinnedCorrections.length >= 10) {
      correction.pinned = false
      showToast("핀된 교정은 최대 10개까지예요. 오래된 핀을 먼저 해제해주세요.")
      return
    }
    state.pinnedCorrections.push(correction)
    showToast("교정 항목을 핀에 추가했어요.")
  } else {
    const idx = state.pinnedCorrections.findIndex(c => c.id === corrId)
    if (idx >= 0) state.pinnedCorrections.splice(idx, 1)
    showToast("교정 핀을 해제했어요.")
  }

  updateCorrectionCardUI(corrId, correction.pinned)

  updateCorrectionPin(state.currentUid, corrId, correction.pinned).catch(err => {
    console.error(err)
    showToast("핀 저장에 실패했어요.")
  })
}

function updatePinButtonUI(msgId, isPinned) {
  const group = document.querySelector(`.msg-group[data-msg-id="${msgId}"]`)
  if (!group) return
  group.classList.toggle("pinned", isPinned)
  const btn = group.querySelector(".pin-msg-btn")
  if (btn) {
    btn.textContent = isPinned ? "📌" : "📍"
    btn.title = isPinned ? "핀 해제" : "핀 추가"
  }
}

function updateCorrectionCardUI(corrId, isPinned) {
  document.querySelectorAll(`.correction-card[data-corr-id="${corrId}"]`).forEach(card => {
    card.classList.toggle("pinned", isPinned)
    const btn = card.querySelector(".corr-pin-btn")
    if (btn) {
      btn.textContent = isPinned ? "📌" : "📍"
      btn.title = isPinned ? "핀 해제" : "핀 추가"
    }
  })
}
