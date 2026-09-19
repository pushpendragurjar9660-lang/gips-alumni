let chatSocket;
let chatHeartbeat;
let chatMessages = [];

function escapeChatText(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

function chatTime(value) {
  return new Date(value).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
}

function renderChatMessages() {
  const container = document.getElementById("chat-messages");
  if (!chatMessages.length) {
    container.innerHTML = `<p class="chat-empty">No messages yet. Start the conversation.</p>`;
    return;
  }
  container.innerHTML = chatMessages.map((item) => {
    const own = item.sender_id === window.AUTH_USER.id;
    const sender = item.sender || { name: "Member", photo_url: "" };
    const avatar = sender.photo_url ? `<img src="${escapeChatText(sender.photo_url)}" alt="" loading="lazy" decoding="async" />` : `<span>${escapeChatText(sender.name).slice(0, 2).toUpperCase()}</span>`;
    const deleteButton = own || window.AUTH_PROFILE.role === "admin" ? `<button class="chat-delete" type="button" data-delete-message="${item.id}" aria-label="Delete message"><i data-lucide="trash-2"></i></button>` : "";
    return `<article class="chat-message ${own ? "own" : "other"}"><div class="chat-avatar">${avatar}</div><div class="chat-bubble"><div class="chat-message-meta"><strong>${escapeChatText(sender.name)}</strong><time>${chatTime(item.created_at)}</time>${deleteButton}</div><p>${escapeChatText(item.message).replace(/\n/g, "<br />")}</p></div></article>`;
  }).join("");
  container.scrollTop = container.scrollHeight;
  container.querySelectorAll("[data-delete-message]").forEach((button) => button.addEventListener("click", () => deleteMessage(button.dataset.deleteMessage)));
  lucide.createIcons();
}

async function loadChatHistory() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?select=id,sender_id,message,created_at&order=created_at.desc&limit=50`, { headers: authHeaders() });
  if (!response.ok) throw new Error("Chat history could not be loaded.");
  const messages = (await response.json()).reverse();
  const senderIds = [...new Set(messages.map((message) => message.sender_id).filter(Boolean))];
  const profileFilter = senderIds.length ? `&id=in.(${senderIds.map(encodeURIComponent).join(",")})` : "&id=eq.none";
  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,name,photo_url${profileFilter}`, { headers: authHeaders() });
  const profiles = profileResponse.ok ? await profileResponse.json() : [];
  const byId = Object.fromEntries(profiles.map((profile) => [profile.id, profile]));
  chatMessages = messages.map((message) => ({ ...message, sender: byId[message.sender_id] }));
  renderChatMessages();
}

async function sendMessage(message) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/messages`, { method: "POST", headers: { ...authHeaders(), "Content-Type": "application/json", Prefer: "return=representation" }, body: JSON.stringify({ sender_id: window.AUTH_USER.id, message }) });
  if (!response.ok) throw new Error("Message could not be sent.");
  const created = (await response.json())[0];
  created.sender = window.AUTH_PROFILE;
  chatMessages.push(created);
  renderChatMessages();
}

async function deleteMessage(id) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/messages?id=eq.${encodeURIComponent(id)}`, { method: "DELETE", headers: authHeaders() });
  if (!response.ok) return;
  chatMessages = chatMessages.filter((message) => String(message.id) !== String(id));
  renderChatMessages();
}

function connectChatRealtime() {
  const websocketUrl = `${SUPABASE_URL.replace("https://", "wss://")}/realtime/v1/websocket?apikey=${encodeURIComponent(SUPABASE_PUBLISHABLE_KEY)}&vsn=1.0.0`;
  chatSocket = new WebSocket(websocketUrl);
  chatSocket.addEventListener("open", () => {
    chatSocket.send(JSON.stringify({ topic: "realtime:messages", event: "phx_join", payload: { config: { broadcast: { ack: false, self: false }, presence: { key: "" }, postgres_changes: [{ event: "*", schema: "public", table: "messages" }] }, access_token: window.AUTH_SESSION.access_token }, ref: "1" }));
    chatHeartbeat = window.setInterval(() => { if (chatSocket.readyState === WebSocket.OPEN) chatSocket.send(JSON.stringify({ topic: "phoenix", event: "heartbeat", payload: {}, ref: String(Date.now()) })); }, 25000);
  });
  chatSocket.addEventListener("message", (event) => {
    const payload = JSON.parse(event.data);
    if (payload.event !== "postgres_changes") return;
    const record = payload.payload?.data?.record;
    if (!record) return;
    if (payload.payload.data.type === "DELETE") {
      chatMessages = chatMessages.filter((message) => message.id !== record.id);
    } else if (!chatMessages.some((message) => message.id === record.id)) {
      chatMessages.push({ ...record, sender: record.sender_id === window.AUTH_USER.id ? window.AUTH_PROFILE : { name: "Member", photo_url: "" } });
    }
    renderChatMessages();
    if (document.hidden && record.sender_id !== window.AUTH_USER.id) {
      const unread = Number(localStorage.getItem("gips-chat-unread") || 0) + 1;
      localStorage.setItem("gips-chat-unread", String(unread));
      document.title = `(${unread}) Group Chat · GIPS Alumni Meet 2026`;
    }
  });
}

async function initChatPage() {
  await window.AUTH_READY;
  if (!document.getElementById("chat-form") || !window.AUTH_USER) return;
  localStorage.removeItem("gips-chat-unread");
  document.title = "Group Chat · GIPS Alumni Meet 2026";
  const input = document.getElementById("chat-input");
  const status = document.getElementById("chat-status");
  try { await loadChatHistory(); connectChatRealtime(); } catch (error) { status.textContent = error.message; }
  document.getElementById("chat-form").addEventListener("submit", async (event) => {
    event.preventDefault();
    const message = input.value.trim();
    if (!message) return;
    input.disabled = true;
    try { await sendMessage(message); input.value = ""; status.textContent = ""; } catch (error) { status.textContent = error.message; } finally { input.disabled = false; input.focus(); }
  });
  input.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); document.getElementById("chat-form").requestSubmit(); }
  });
}

document.addEventListener("DOMContentLoaded", initChatPage);
window.addEventListener("beforeunload", () => { if (chatHeartbeat) clearInterval(chatHeartbeat); chatSocket?.close(); });
