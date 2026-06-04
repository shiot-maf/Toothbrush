import { state } from "../core/state.js"
import { toggleCorrectionPin } from "./pin.js"
import { saveMemoPins } from "../firebase/firestore.js"
import { showToast } from "./toast.js"

export function initFeedback() {
  document.getElementById("tab-corrections").addEventListener("click", () => switchTab("corrections"))
  document.getElementById("tab-pins").addEventListener("click", () => switchTab("pins"))
  document.getElementById("memo-add-btn").addEventListener("click", addMemo)
  document.getElementById("memo-input").addEventListener("keydown", e => {
    if (e.key === "Enter") {
      e.preventDefault()
      addMemo()
    }
  })
}

export function renderCorrections(corrections) {
  if (corrections.length === 0) {
    appendPerfectCard()
  } else {
    for (const c of corrections) {
      appendCorrectionCard(c)
    }
  }
  if (document.getElementById("tab-pins").classList.contains("active")) {
    renderPinsTab()
  }
}

export function renderAllCorrections() {
  const list = document.getElementById("corrections-list")
  list.innerHTML = ""
  if (state.correctionHistory.length === 0) return
  for (const c of state.correctionHistory) {
    appendCorrectionCard(c)
  }
}

export function renderPinsTab() {
  const list = document.getElementById("pins-list")
  list.innerHTML = ""
  if (state.pinnedCorrections.length === 0) {
    list.innerHTML = '<p class="empty-msg">핀된 교정 항목이 없어요.</p>'
    return
  }
  for (const c of state.pinnedCorrections) {
    list.appendChild(buildCorrectionCard(c))
  }
}

function appendPerfectCard() {
  const list = document.getElementById("corrections-list")
  const card = document.createElement("div")
  card.className = "perfect-card"
  card.innerHTML = `<span class="perfect-icon">✦</span> 완벽한 문장이에요!`
  list.appendChild(card)
  list.scrollTop = list.scrollHeight
}

function appendCorrectionCard(c) {
  const list = document.getElementById("corrections-list")
  const card = buildCorrectionCard(c)
  list.appendChild(card)
  list.scrollTop = list.scrollHeight
}

function buildCorrectionCard(c) {
  const card = document.createElement("div")
  card.className = `correction-card${c.pinned ? " pinned" : ""}`
  card.dataset.corrId = c.id

  const time = formatTime(c.timestamp)
  const isPinned = c.pinned

  card.innerHTML = `
    <div class="corr-header">
      <span class="corr-time">${time}</span>
      <button class="corr-pin-btn" title="${isPinned ? "핀 해제" : "핀 추가"}">${isPinned ? "📌" : "📍"}</button>
    </div>
    <div class="corr-original"><del>${escapeHtml(c.original)}</del></div>
    <div class="corr-corrected">${escapeHtml(c.corrected)}</div>
    <div class="corr-explanation">${escapeHtml(c.explanation)}</div>
  `

  card.querySelector(".corr-pin-btn").addEventListener("click", () => toggleCorrectionPin(c.id))

  return card
}

function switchTab(tab) {
  document.getElementById("tab-corrections").classList.toggle("active", tab === "corrections")
  document.getElementById("tab-pins").classList.toggle("active", tab === "pins")
  document.getElementById("corrections-panel").style.display = tab === "corrections" ? "" : "none"
  document.getElementById("pins-panel").style.display = tab === "pins" ? "" : "none"

  if (tab === "pins") renderPinsTab()
}

function addMemo() {
  const input = document.getElementById("memo-input")
  const text = input.value.trim()
  if (!text) return

  if (state.memoPins.length >= 5) {
    showToast("메모 핀은 최대 5개까지 추가할 수 있어요.")
    return
  }

  state.memoPins.push(text)
  input.value = ""
  renderMemos()

  saveMemoPins(state.currentUid, state.memoPins).catch(err => {
    console.error(err)
    showToast("메모 저장에 실패했어요.")
  })
}

export function renderMemos() {
  const list = document.getElementById("memo-list")
  list.innerHTML = ""
  state.memoPins.forEach((memo, i) => {
    const item = document.createElement("div")
    item.className = "memo-item"
    item.innerHTML = `
      <span class="memo-text">${escapeHtml(memo)}</span>
      <button class="memo-del-btn" title="삭제">✕</button>
    `
    item.querySelector(".memo-del-btn").addEventListener("click", () => removeMemo(i))
    list.appendChild(item)
  })
}

function removeMemo(index) {
  state.memoPins.splice(index, 1)
  renderMemos()

  saveMemoPins(state.currentUid, state.memoPins).catch(err => {
    console.error(err)
    showToast("메모 저장에 실패했어요.")
  })
}

function formatTime(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0")
}

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}
