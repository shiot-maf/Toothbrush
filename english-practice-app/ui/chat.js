import { state } from "../core/state.js"
import { callClaudeAPI } from "../api/claude.js"
import { saveMessage, saveCorrections, updateSessionMeta } from "../firebase/firestore.js"
import { renderCorrections } from "./feedback.js"
import { toggleMessagePin } from "./pin.js"
import { showToast } from "./toast.js"

const chatMessages = () => document.getElementById("chat-messages")
const inputArea = () => document.getElementById("chat-input")
const sendBtn = () => document.getElementById("send-btn")
const typingIndicator = () => document.getElementById("typing-indicator")

export function initChat() {
  const input = inputArea()
  const btn = sendBtn()

  input.addEventListener("keydown", e => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  })

  input.addEventListener("input", () => {
    input.style.height = "auto"
    input.style.height = Math.min(input.scrollHeight, 120) + "px"
  })

  btn.addEventListener("click", handleSend)
}

export function renderAllMessages() {
  chatMessages().innerHTML = ""
  for (const msg of state.conversationHistory) {
    appendMessageBubble(msg)
  }
  scrollToBottom(true)
}

export function appendMessageBubble(msg) {
  const container = chatMessages()
  const isPinned = state.pinnedMessages.some(p => p.id === msg.id)

  const group = document.createElement("div")
  group.className = `msg-group ${msg.role === "user" ? "user-group" : "char-group"}${isPinned ? " pinned" : ""}`
  group.dataset.msgId = msg.id

  if (msg.role === "assistant") {
    const avatar = document.createElement("div")
    avatar.className = "avatar"
    avatar.textContent = (state.character.name || "A")[0].toUpperCase()
    group.appendChild(avatar)
  }

  const bubble = document.createElement("div")
  bubble.className = `bubble ${msg.role === "user" ? "user-bubble" : "char-bubble"}`
  bubble.textContent = msg.content

  const actions = document.createElement("div")
  actions.className = "bubble-actions"
  const pinBtn = document.createElement("button")
  pinBtn.className = "pin-msg-btn"
  pinBtn.title = isPinned ? "핀 해제" : "핀 추가"
  pinBtn.textContent = isPinned ? "📌" : "📍"
  pinBtn.addEventListener("click", () => toggleMessagePin(msg.id))
  actions.appendChild(pinBtn)

  group.appendChild(bubble)
  group.appendChild(actions)

  const time = document.createElement("span")
  time.className = "msg-time"
  time.textContent = formatTime(msg.timestamp)
  group.appendChild(time)

  container.appendChild(group)
  return group
}

export async function handleSend() {
  const input = inputArea()
  const text = input.value.trim()

  if (!text) return
  if (state.isLoading) return

  const apiKey = sessionStorage.getItem("claude_api_key")
  if (!apiKey) {
    showInlineError({ type: "no_key", message: "API 키를 먼저 입력해주세요." })
    return
  }

  // 동기적으로 즉시 비활성화
  input.disabled = true
  sendBtn().disabled = true
  state.isLoading = true
  input.value = ""
  input.style.height = "auto"

  const userMsgId = crypto.randomUUID()
  const userMessage = {
    id: userMsgId,
    role: "user",
    content: text,
    timestamp: Date.now()
  }

  state.conversationHistory.push(userMessage)
  state.lastUserMessage = text
  appendMessageBubble(userMessage)
  scrollToBottom()
  showTyping(true)

  try {
    saveMessage(state.currentUid, state.currentSessionId, userMessage).catch(err => {
      console.error(err)
      showToast("메시지 저장에 실패했어요.")
    })

    const aiResponse = await callClaudeAPI()

    showTyping(false)

    const aiMsgId = crypto.randomUUID()
    const aiMessage = {
      id: aiMsgId,
      role: "assistant",
      content: aiResponse.reply,
      timestamp: Date.now()
    }
    state.conversationHistory.push(aiMessage)
    appendMessageBubble(aiMessage)
    scrollToBottom()

    const corrections = aiResponse.corrections.map(c => ({
      id: "corr_" + crypto.randomUUID(),
      sessionId: state.currentSessionId,
      messageId: userMsgId,
      timestamp: Date.now(),
      original: c.original,
      corrected: c.corrected,
      explanation: c.explanation,
      pinned: false,
      reviewCount: 0,
      tags: []
    }))

    state.correctionHistory.push(...corrections)
    renderCorrections(corrections)

    saveMessage(state.currentUid, state.currentSessionId, aiMessage).catch(err => console.error(err))
    if (corrections.length > 0) {
      saveCorrections(state.currentUid, corrections).catch(err => console.error(err))
    }
    updateSessionMeta(state.currentUid, state.currentSessionId, {}).catch(err => console.error(err))

  } catch (err) {
    console.error(err)
    showTyping(false)
    showInlineError(err)
  } finally {
    input.disabled = false
    sendBtn().disabled = false
    state.isLoading = false
    input.focus()
  }
}

export function retryLastMessage() {
  if (!state.lastUserMessage) return
  const text = state.lastUserMessage
  state.lastUserMessage = null
  const errorCard = chatMessages().querySelector(".inline-error-card")
  if (errorCard) errorCard.remove()
  inputArea().value = text
  handleSend()
}

function showInlineError(err) {
  const container = chatMessages()
  const card = document.createElement("div")
  card.className = "inline-error-card"

  let msg = err.message || "알 수 없는 오류가 발생했어요."
  let showRetry = true
  let countdown = 0

  if (err.type === "rate_limit") {
    countdown = err.retryAfter || 30
    showRetry = false
  } else if (err.type === "no_key") {
    showRetry = false
  }

  card.innerHTML = `<span class="error-icon">⚠️</span> <span class="error-msg">${msg}</span>`

  if (showRetry) {
    const btn = document.createElement("button")
    btn.className = "retry-btn"
    btn.textContent = "다시 시도"
    btn.addEventListener("click", retryLastMessage)
    card.appendChild(btn)
  }

  if (countdown > 0) {
    const timer = document.createElement("span")
    timer.className = "countdown"
    card.appendChild(timer)

    const btn = document.createElement("button")
    btn.className = "retry-btn"
    btn.textContent = "지금 재시도"
    btn.addEventListener("click", () => {
      clearInterval(interval)
      card.remove()
      retryLastMessage()
    })
    card.appendChild(btn)

    let remaining = countdown
    timer.textContent = ` (${remaining}초)`
    const interval = setInterval(() => {
      remaining--
      timer.textContent = ` (${remaining}초)`
      if (remaining <= 0) {
        clearInterval(interval)
        card.remove()
        retryLastMessage()
      }
    }, 1000)
  }

  container.appendChild(card)
  scrollToBottom()
}

function showTyping(visible) {
  typingIndicator().style.display = visible ? "flex" : "none"
  if (visible) scrollToBottom()
}

function scrollToBottom(force = false) {
  const container = chatMessages()
  const lastCard = container.lastElementChild
  const CARD_HEIGHT = lastCard ? lastCard.offsetHeight : 80
  const isNearBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - CARD_HEIGHT

  if (force || isNearBottom) {
    container.scrollTop = container.scrollHeight
  }
}

function formatTime(ts) {
  if (!ts) return ""
  const d = new Date(ts)
  return d.getHours().toString().padStart(2, "0") + ":" + d.getMinutes().toString().padStart(2, "0")
}
