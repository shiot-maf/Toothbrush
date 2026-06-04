import { onAuthChange, signInWithGoogle, signOutUser, auth } from "./firebase/auth.js"
import { initSession, startNewSession, persistCharacter, hasCharacter } from "./core/session.js"
import { state } from "./core/state.js"
import { showScreen, showGlobalSpinner, hideGlobalSpinner } from "./ui/screens.js"
import { showToast } from "./ui/toast.js"
import { initChat, renderAllMessages } from "./ui/chat.js"
import { initFeedback, renderAllCorrections, renderMemos } from "./ui/feedback.js"

// ── 초기화 ────────────────────────────────────────────────────

showGlobalSpinner()

let chatInitialized = false

onAuthChange(async (user) => {
  if (!user) {
    hideGlobalSpinner()
    showScreen("screen-login")
    return
  }

  try {
    await initSession(user.uid)
    hideGlobalSpinner()

    if (!hasCharacter()) {
      showScreen("screen-character")
    } else {
      enterMain()
    }
  } catch (err) {
    console.error("initSession failed:", err)
    if (err.code === "permission-denied" || err.status === 403) {
      await auth.signOut()
      hideGlobalSpinner()
      showScreen("screen-login")
      showToast("세션이 만료됐어요. 다시 로그인해주세요.")
    } else {
      hideGlobalSpinner()
      enterMain()
      showToast("데이터를 불러오지 못했어요. 새로고침해주세요.")
    }
  }
})

function enterMain() {
  if (!chatInitialized) {
    chatInitialized = true
    initChat()
    initFeedback()
  }
  updateHeaderCharacter()
  renderAllMessages()
  renderAllCorrections()
  renderMemos()
  showScreen("screen-main")
}

// ── 로그인 화면 ───────────────────────────────────────────────

document.getElementById("google-login-btn").addEventListener("click", async () => {
  try {
    await signInWithGoogle()
  } catch (err) {
    console.error(err)
    showToast("로그인에 실패했어요. 다시 시도해주세요.")
  }
})

// ── 캐릭터 설정 폼 (신규 설정 + 수정 모드 통합) ──────────────

document.getElementById("character-form").addEventListener("submit", async (e) => {
  e.preventDefault()

  const name = document.getElementById("char-name").value.trim()
  if (!name) {
    showToast("캐릭터 이름을 입력해주세요.")
    return
  }

  const characterData = {
    name,
    personality: document.getElementById("char-personality").value.trim() || "friendly and casual",
    speechStyle:  document.getElementById("char-speech").value.trim()    || "casual American English",
    situation:    document.getElementById("char-situation").value.trim() || "a friend having a conversation"
  }

  const isEditMode = document.getElementById("character-form").dataset.editMode === "true"

  try {
    if (isEditMode) {
      document.getElementById("character-form").dataset.editMode = ""
      const keepChat = confirm("현재 대화를 유지할까요?\n\n[확인] 대화 유지  /  [취소] 새로 시작")
      await persistCharacter(characterData)
      updateHeaderCharacter()

      if (!keepChat) {
        await startNewSession()
        document.getElementById("chat-messages").innerHTML = ""
        document.getElementById("corrections-list").innerHTML = ""
        document.getElementById("pins-list").innerHTML = ""
      }

      showToast("캐릭터 설정이 업데이트됐어요.")
      showScreen("screen-main")
    } else {
      await persistCharacter(characterData)
      showToast("캐릭터 설정이 저장됐어요.")
      enterMain()
    }
  } catch (err) {
    console.error(err)
    showToast("저장에 실패했어요. 다시 시도해주세요.")
  }
})

// ── API 키 토글 ───────────────────────────────────────────────

document.getElementById("api-key-btn").addEventListener("click", () => {
  const dropdown = document.getElementById("api-key-dropdown")
  dropdown.classList.toggle("open")
  if (dropdown.classList.contains("open")) {
    document.getElementById("api-key-input").focus()
  }
})

document.getElementById("api-key-save").addEventListener("click", () => {
  const key = document.getElementById("api-key-input").value.trim()
  if (!key) {
    showToast("API 키를 입력해주세요.")
    return
  }
  sessionStorage.setItem("claude_api_key", key)
  document.getElementById("api-key-btn").classList.add("has-key")
  document.getElementById("api-key-dropdown").classList.remove("open")
  document.getElementById("api-key-input").value = ""
  showToast("API 키가 저장됐어요.")
})

if (sessionStorage.getItem("claude_api_key")) {
  document.getElementById("api-key-btn").classList.add("has-key")
}

// ── 새 대화 ───────────────────────────────────────────────────

document.getElementById("new-chat-btn").addEventListener("click", async () => {
  try {
    await startNewSession()
    document.getElementById("chat-messages").innerHTML = ""
    showToast("새 대화를 시작했어요.")
  } catch (err) {
    console.error(err)
    showToast("새 대화 시작에 실패했어요.")
  }
})

// ── 캐릭터 수정 ───────────────────────────────────────────────

document.getElementById("edit-character-btn").addEventListener("click", () => {
  document.getElementById("char-name").value = state.character.name || ""
  document.getElementById("char-personality").value = state.character.personality || ""
  document.getElementById("char-speech").value = state.character.speechStyle || ""
  document.getElementById("char-situation").value = state.character.situation || ""
  document.getElementById("character-form").dataset.editMode = "true"
  showScreen("screen-character")
})

// ── 테마 토글 ─────────────────────────────────────────────────

document.getElementById("theme-btn").addEventListener("click", () => {
  const isLight = document.documentElement.getAttribute("data-theme") === "light"
  document.documentElement.setAttribute("data-theme", isLight ? "dark" : "light")
  document.getElementById("theme-btn").textContent = isLight ? "☀️" : "🌙"
})

// ── 로그아웃 ──────────────────────────────────────────────────

document.getElementById("logout-btn").addEventListener("click", async () => {
  try {
    await signOutUser()
  } catch (err) {
    console.error(err)
    showToast("로그아웃에 실패했어요.")
  }
})

// ── 헬퍼 ─────────────────────────────────────────────────────

function updateHeaderCharacter() {
  const { name, speechStyle, situation } = state.character
  document.getElementById("header-char-name").textContent = name || "캐릭터"
  const desc = [speechStyle, situation].filter(Boolean).join(" · ")
  document.getElementById("header-char-desc").textContent = desc.slice(0, 50)
}
