/* =========================================================
   CONVERSATION.JS
   ---------------------------------------------------------
   Turkish Conversation Chat using Claude API.
   AI responds in Turkish only and gently corrects mistakes.
   ========================================================= */

document.addEventListener("DOMContentLoaded", function () {
  initializeConversation();
});

let chatHistory = [];
let chatTopic = "";

function initializeConversation() {
  document.getElementById("chat-start-btn").addEventListener("click", startChat);
  document.getElementById("chat-send-btn").addEventListener("click", sendMessage);
  document.getElementById("chat-reset-btn").addEventListener("click", resetChat);
  document.getElementById("chat-input").addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  });
}

/* =========================================================
   START CHAT
   ========================================================= */

async function startChat() {
  const topicInput = document.getElementById("chat-topic");
  chatTopic = topicInput.value.trim() || "general conversation";

  document.getElementById("chat-setup-section").hidden = true;
  document.getElementById("chat-section").removeAttribute("hidden");
  document.getElementById("chat-topic-display").textContent = chatTopic;

  chatHistory = [];
  document.getElementById("chat-messages").innerHTML = "";

  /* AI sends the first message */
  await sendToAI("(Start the conversation naturally about: " + chatTopic + ")");
}

/* =========================================================
   SEND MESSAGE
   ========================================================= */

async function sendMessage() {
  const input = document.getElementById("chat-input");
  const text = input.value.trim();
  if (!text) return;

  input.value = "";
  addMessageBubble(text, "user");
  chatHistory.push({ role: "user", content: text });

  await sendToAI(text);
}

async function sendToAI(userText) {
  const sendBtn = document.getElementById("chat-send-btn");
  if (sendBtn) { sendBtn.disabled = true; sendBtn.textContent = "..."; }

  try {
    const reply = await callChatAPI();
    addMessageBubble(reply, "ai");
    chatHistory.push({ role: "assistant", content: reply });
  } catch (err) {
    addMessageBubble("⚠ Could not connect: " + err.message, "error");
  } finally {
    if (sendBtn) { sendBtn.disabled = false; sendBtn.textContent = "Send"; }
  }
}

async function callChatAPI() {
  const WORKER_URL = "https://holy-wind-9442.doeppg.workers.dev";

  const systemPrompt = `You are a friendly Turkish language conversation partner helping a beginner practice Turkish.

Rules:
- ALWAYS respond in Turkish
- Keep sentences simple and appropriate for a beginner (A1-A2 level)
- If the user writes something incorrect in Turkish, gently include the correction naturally in your response (e.g. use the correct form yourself)
- If the user writes in English, respond in Turkish but acknowledge what they said
- Keep responses short — 2-4 sentences maximum
- Stay on topic: ${chatTopic}
- Be encouraging and warm`;

  const response = await fetch(WORKER_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      model: "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: chatHistory.length > 0 ? chatHistory : [{ role: "user", content: "Merhaba!" }]
    })
  });

  if (!response.ok) throw new Error("Worker HTTP " + response.status);
  const data = await response.json();
  if (data.error) throw new Error("API error: " + JSON.stringify(data.error));
  if (!data.content || !data.content[0]) throw new Error("Unexpected response: " + JSON.stringify(data));
  return data.content[0].text.trim();
}

/* =========================================================
   UI
   ========================================================= */

function addMessageBubble(text, sender) {
  const messages = document.getElementById("chat-messages");
  const bubble = document.createElement("div");

  const isUser = sender === "user";
  const isError = sender === "error";

  bubble.style.cssText = `
    max-width:85%;padding:10px 12px;border-radius:${isUser ? "16px 16px 4px 16px" : "16px 16px 16px 4px"};
    font-size:14px;line-height:1.5;align-self:${isUser ? "flex-end" : "flex-start"};
    background:${isUser ? "#b0977a" : isError ? "#f5e0e0" : "#f3eadf"};
    color:${isUser ? "white" : "#3a2e28"};
  `;

  bubble.textContent = text;
  messages.appendChild(bubble);
  messages.scrollTop = messages.scrollHeight;
}

function resetChat() {
  chatHistory = [];
  chatTopic = "";
  document.getElementById("chat-messages").innerHTML = "";
  document.getElementById("chat-section").hidden = true;
  document.getElementById("chat-setup-section").removeAttribute("hidden");
  document.getElementById("chat-topic").value = "";
}
