// magpie middleware: drop user messages with empty content (prevents 400 on strict channels)
export function onRequest(body, ctx) {
  const key = body.messages ? "messages" : body.input ? "input" : body.contents ? "contents" : null
  if (!key) return
  const msgs = body[key]
  if (!Array.isArray(msgs)) return
  const out = msgs.filter((m) => !isEmptyUser(m, ctx.protocol))
  if (out.length === msgs.length || out.length === 0) return
  body[key] = out
  return body
}

function isEmptyUser(m, protocol) {
  if (protocol === "responses") {
    if (m.type !== "message" || m.role !== "user") return false
  } else if (m.role !== "user") {
    return false
  }
  const c = protocol === "gemini" ? m.parts : m.content
  if (c === "" || c == null) return true
  if (!Array.isArray(c)) return false
  if (c.length === 0) return true
  // Anthropic tool results carry their output inside the block, not in b.text.
  if (protocol === "anthropic" && c.some((b) => b.type === "tool_result")) return false
  return c.every((b) => !b.text && !b.image_url && !b.inlineData && !b.functionCall && !b.source)
}
