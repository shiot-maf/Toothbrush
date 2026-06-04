import { state } from "./state.js"

export function buildSystemPrompt() {
  const { name, personality, speechStyle, situation } = state.character
  const charName = name || "Alex"
  const charPersonality = personality || "friendly and casual"
  const charSpeech = speechStyle || "casual American English"
  const charSituation = situation || "a friend having a conversation"

  let prompt = `You are ${charName}, a ${charPersonality} character who works as ${charSituation}.
You speak in ${charSpeech}.

Respond naturally IN CHARACTER to the user's message in English.
At the same time, use the submit_chat_and_corrections tool to report any English grammar or expression errors in the user's message.
If there are no errors, call submit_chat_and_corrections with an empty array for corrections.`

  if (state.memoPins.length > 0) {
    prompt += "\n\n## User notes:\n"
    prompt += state.memoPins.map(m => `- ${m}`).join("\n")
  }

  if (state.pinnedMessages.length > 0) {
    prompt += "\n\n## Important context from previous conversation:\n"
    prompt += state.pinnedMessages
      .map(m => `- [${m.role}]: ${m.content.slice(0, 100)}`)
      .join("\n")
  }

  return prompt
}

export function buildMessages() {
  const messages = []

  if (state.pinnedMessages.length > 0) {
    messages.push({
      role: "user",
      content: "--- [Pinned context from previous conversations. Please remember these.] ---"
    })
    messages.push({
      role: "assistant",
      content: "Understood. I'll keep this context in mind."
    })
    messages.push(...state.pinnedMessages)
    messages.push({
      role: "user",
      content: "--- [End of pinned context. Current conversation starts below.] ---"
    })
    messages.push({
      role: "assistant",
      content: "Got it. Let's continue!"
    })
  }

  messages.push(...state.conversationHistory.slice(-10).map(m => ({
    role: m.role,
    content: m.content
  })))

  return messages
}
