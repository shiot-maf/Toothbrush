import { state } from "../core/state.js"
import { buildSystemPrompt, buildMessages } from "../core/prompt.js"

export async function callClaudeAPI() {
  const apiKey = sessionStorage.getItem("claude_api_key")
  if (!apiKey) {
    const err = new Error("API 키가 없습니다.")
    err.type = "no_key"
    throw err
  }
  if (!state.currentSessionId) {
    throw new Error("세션이 초기화되지 않았습니다.")
  }

  const payload = {
    model: "claude-sonnet-4-20250514",
    max_tokens: 1000,
    system: buildSystemPrompt(),
    messages: buildMessages(),
    tools: [
      {
        name: "submit_chat_and_corrections",
        description: "Submit the character's reply and grammar corrections for the user's message.",
        input_schema: {
          type: "object",
          properties: {
            reply: {
              type: "string",
              description: "In-character response in English"
            },
            corrections: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  original:    { type: "string", description: "The exact wrong phrase from the user's message" },
                  corrected:   { type: "string", description: "The corrected version" },
                  explanation: { type: "string", description: "설명 (한국어로)" }
                },
                required: ["original", "corrected", "explanation"]
              }
            }
          },
          required: ["reply", "corrections"]
        }
      }
    ],
    tool_choice: { type: "tool", name: "submit_chat_and_corrections" }
  }

  let response
  try {
    response = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "anthropic-dangerous-direct-browser-access": "true"
      },
      body: JSON.stringify(payload)
    })
  } catch {
    const err = new Error("인터넷 연결을 확인해주세요.")
    err.type = "network"
    throw err
  }

  if (!response.ok) {
    const err = new Error()
    err.status = response.status
    const retryAfter = response.headers.get("retry-after")
    if (retryAfter) err.retryAfter = parseInt(retryAfter)

    switch (response.status) {
      case 401:
        err.type = "auth"
        err.message = "API 키가 올바르지 않아요."
        break
      case 429:
        err.type = "rate_limit"
        err.message = `요청이 너무 많아요. ${err.retryAfter || 30}초 후 다시 시도해주세요.`
        break
      case 500:
      case 529:
        err.type = "server"
        err.message = "Claude 서버에 일시적인 문제가 있어요. 잠시 후 다시 시도해주세요."
        break
      default:
        err.type = "unknown"
        err.message = `오류가 발생했어요. (${response.status})`
    }
    throw err
  }

  const data = await response.json()
  return parseResponse(data.content)
}

function parseResponse(contentBlocks) {
  let reply = ""
  let corrections = []

  for (const block of contentBlocks) {
    if (block.type === "tool_use" && block.name === "submit_chat_and_corrections") {
      reply = block.input.reply || ""
      corrections = block.input.corrections || []
    }
  }

  if (!reply) reply = "응답을 받지 못했어요."
  return { reply, corrections }
}
