// ─── Config ───────────────────────────────────────────
const API_URL = "https://api.anthropic.com/v1/messages";
const MODEL = "claude-sonnet-4-20250514";

const SYSTEM_PROMPT = `You are NyayBot, a civic rights assistant for Indian citizens. You help people understand their legal rights and grievance options in simple, plain language — no legal jargon.

When a user describes their problem:
1. Briefly explain what rights they have in 2-3 sentences max. Be direct and empathetic.
2. Tell them what they can do next — what kind of authority or process applies.
3. Keep it conversational. Avoid bullet points for the explanation part. Use them only if listing steps.
4. End with a short line of encouragement.

Important:
- Always clarify you are not a lawyer and this is general information.
- If the problem is unclear, ask ONE clarifying question.
- Keep responses concise — under 200 words.
- Respond in English by default, but if the user writes in Hindi, respond in Hindi.`;

// ─── State ────────────────────────────────────────────
let conversationHistory = [];
let authorities = [];
let isLoading = false;

// ─── DOM Refs ─────────────────────────────────────────
const chatArea = document.getElementById("chatArea");
const welcomeScreen = document.getElementById("welcomeScreen");
const userInput = document.getElementById("userInput");
const sendBtn = document.getElementById("sendBtn");

// ─── Load Authorities ─────────────────────────────────
async function loadAuthorities() {
  try {
    const res = await fetch("data/authorities.json");
    authorities = await res.json();
  } catch (e) {
    console.warn("Could not load authorities.json", e);
  }
}

// ─── Match authorities by keywords ────────────────────
function matchAuthorities(text) {
  const lower = text.toLowerCase();
  const matched = [];
  for (const cat of authorities) {
    const hits = cat.keywords.filter(k => lower.includes(k));
    if (hits.length > 0) {
      matched.push({ ...cat, score: hits.length });
    }
  }
  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, 2); // top 2 categories
}

// ─── Render authority cards ────────────────────────────
function renderAuthorityCards(matches) {
  if (!matches.length) return "";
  let html = `<div class="authority-cards">`;
  for (const cat of matches) {
    for (const auth of cat.authorities) {
      html += `
        <div class="authority-card">
          <div class="authority-card-name">🏛 ${auth.name}</div>
          <div class="authority-card-role">${auth.role}</div>
          <div class="authority-card-meta">
            <span class="authority-card-contact">📞 ${auth.contact}</span>
            <a href="${auth.link}" target="_blank" rel="noopener">🔗 Visit Portal</a>
          </div>
        </div>`;
    }
  }
  html += `</div>`;
  return html;
}

// ─── Add message to chat ───────────────────────────────
function addMessage(role, content, authorityCards = "") {
  if (welcomeScreen.style.display !== "none") {
    welcomeScreen.style.display = "none";
    chatArea.classList.add("active");
  }

  const div = document.createElement("div");
  div.className = `message ${role}`;

  const avatarEmoji = role === "bot" ? "⚖️" : "👤";
  div.innerHTML = `
    <div class="avatar ${role}">${avatarEmoji}</div>
    <div class="bubble">
      <p>${content.replace(/\n/g, "<br>")}</p>
      ${authorityCards}
    </div>`;

  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

// ─── Typing indicator ─────────────────────────────────
function showTyping() {
  const div = document.createElement("div");
  div.className = "message bot";
  div.id = "typingIndicator";
  div.innerHTML = `
    <div class="avatar bot">⚖️</div>
    <div class="bubble">
      <div class="typing">
        <span></span><span></span><span></span>
      </div>
    </div>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function removeTyping() {
  const indicator = document.getElementById("typingIndicator");
  if (indicator) indicator.remove();
}

// ─── Call Claude API ───────────────────────────────────
async function callClaude(userMessage) {
  conversationHistory.push({ role: "user", content: userMessage });

  const response = await fetch(API_URL, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      model: MODEL,
      max_tokens: 1000,
      system: SYSTEM_PROMPT,
      messages: conversationHistory,
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err?.error?.message || "API error");
  }

  const data = await response.json();
  const reply = data.content?.[0]?.text || "Sorry, I couldn't get a response.";
  conversationHistory.push({ role: "assistant", content: reply });
  return reply;
}

// ─── Send message ──────────────────────────────────────
async function sendMessage(text) {
  const message = (text || userInput.value).trim();
  if (!message || isLoading) return;

  userInput.value = "";
  userInput.style.height = "auto";
  isLoading = true;
  sendBtn.disabled = true;

  addMessage("user", message);
  showTyping();

  try {
    const reply = await callClaude(message);
    removeTyping();

    const matches = matchAuthorities(message);
    const cards = renderAuthorityCards(matches);
    addMessage("bot", reply, cards);
  } catch (err) {
    removeTyping();
    addMessage("bot", `Something went wrong: ${err.message}. Please check your API key or try again.`);
  } finally {
    isLoading = false;
    sendBtn.disabled = false;
    userInput.focus();
  }
}

// ─── Category sidebar click ────────────────────────────
function handleCategoryClick(btn) {
  document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  const query = btn.dataset.query;
  sendMessage(query);
}

// ─── Starter prompts ───────────────────────────────────
function handleStarter(text) {
  sendMessage(text);
}

// ─── Input auto-resize + enter to send ────────────────
userInput.addEventListener("input", () => {
  userInput.style.height = "auto";
  userInput.style.height = Math.min(userInput.scrollHeight, 120) + "px";
});

userInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
});

sendBtn.addEventListener("click", () => sendMessage());

// ─── Init ──────────────────────────────────────────────
loadAuthorities();
