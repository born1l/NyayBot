const DEMO_RESPONSES = {
  "What are my rights if the police refuse to register my FIR?":
    "Under Section 154 of the CrPC, the police are legally required to register your FIR — they cannot refuse. If they do, you can send your complaint in writing to the Superintendent of Police, or directly approach a Magistrate under Section 156(3). You also have the right to file a complaint online via your state police portal.\n\nYou're not helpless here — the law is clearly on your side. Take that next step with confidence.",

  "I bought a defective product and the seller is refusing a refund. What are my consumer rights?":
    "Under the Consumer Protection Act 2019, you have the right to a refund, replacement, or compensation for any defective product. The seller cannot legally refuse if the product is genuinely defective. You can file a complaint at the National Consumer Helpline (1800-11-4000) or online at consumerhelpline.gov.in — it's free.\n\nKeep your bill and any photos of the defect as evidence. You've got this.",

  "My employer is not paying my salary on time. What are my labour rights?":
    "Under the Payment of Wages Act, your employer is legally required to pay your salary on time — delays are a violation. You can file a complaint with the Labour Commissioner in your state. If your PF is also being withheld, EPFO has a separate grievance portal at epfigms.gov.in.\n\nDocument everything — salary slips, messages, bank records. That paper trail will protect you.",

  "I am facing domestic violence. What are my rights as a woman in India?":
    "Under the Protection of Women from Domestic Violence Act 2005, you have the right to protection, residence, and compensation. You can call the Women Helpline at 1091 anytime — it's free and confidential. You can also approach the National Commission for Women or your nearest police station.\n\nYou don't have to face this alone. Help is available and the law strongly protects you.",

  "My landlord is threatening to evict me illegally. What are my rights as a tenant?":
    "A landlord cannot evict you without proper legal notice and due process — illegal eviction is a punishable offence. If you have a rent agreement, you are protected under state Rent Control laws. You can approach the Rent Control Court or file a complaint at your local police station if there's harassment.\n\nDon't vacate under pressure. Know that the law requires proper procedure before any eviction.",

  "A government office is not processing my application. What can I do?":
    "You can file a grievance on the Central Government's CPGRAMS portal at pgportal.gov.in — it's free and tracked. Under the Right to Service Act (in most states), government offices are bound by a time limit to process your application. You can also approach the local ombudsman or your elected representative.\n\nYour application matters. Push back through official channels — it works.",

  "A hospital is refusing to treat me without advance payment. What are my rights?":
    "Under MCI guidelines and the Clinical Establishments Act, no hospital can refuse emergency treatment due to inability to pay. If you're covered under Ayushman Bharat (PM-JAY), treatment must be cashless at empanelled hospitals. You can complain to the National Medical Commission or call the NHA helpline at 14555.\n\nIn a medical emergency, demand treatment first — payment cannot legally be a barrier.",

  "I was scammed online and lost money via UPI. What should I do?":
    "Report it immediately at cybercrime.gov.in or call the National Cyber Crime Helpline at 1930. The faster you report, the higher the chance of freezing the fraudster's account. Also inform your bank right away to flag the transaction. For UPI fraud, RBI's ombudsman at 14448 can help recover funds.\n\nTime is critical here — report within the first few hours for the best chance of recovery.",

  // Starter prompts
  "The police are refusing to file my FIR. What can I do?":
    "The police are legally bound to register your FIR under Section 154 CrPC — refusal is itself an offence. If they refuse, write your complaint and send it by post to the Superintendent of Police. You can also directly approach a Magistrate under Section 156(3) or file online via your state police portal.\n\nDon't back down — the law is firmly on your side.",

  "My landlord is not returning my security deposit after I vacated.":
    "Your landlord is legally required to return the security deposit after deducting only legitimate damages — they cannot withhold it without reason. Send a formal written notice first. If they still refuse, you can approach the Rent Control Court or file a consumer complaint. Keep all receipts, messages, and your rental agreement handy.\n\nA written notice alone often does the trick. Start there.",

  "I was scammed online and lost money. How do I report it?":
    "Report it immediately on cybercrime.gov.in or call 1930 — the National Cyber Crime Helpline. At the same time, call your bank to flag and freeze the transaction. The sooner you act, the better your chances of recovery. Take screenshots of all communication with the scammer as evidence.\n\nEvery minute counts — report now, details later.",

  "My employer has not paid my salary for 2 months. What should I do?":
    "Withholding salary is a violation of the Payment of Wages Act. First send a written demand to your employer via email or letter — this creates a paper trail. If no response, file a complaint with your state's Labour Commissioner. You can also approach the Labour Court for recovery of dues.\n\nYou have every right to your earned wages. Don't let this slide.",
};

const FALLBACK_RESPONSE =
  "This is a demo version of NyayBot. For this demonstration, responses are available for the 8 categories in the sidebar and the 4 starter prompts on the welcome screen. In the full version, you can type any grievance and get an AI-powered response.\n\nTry clicking one of the categories on the left or the starter prompts!";

// ─── Theme Toggle ─────────────────────────────────────
const themes = [
  { key: "dark", emoji: "🌿", label: "Warm" },
  { key: "warm", emoji: "🌑", label: "Dark" },
];
let currentThemeIndex = 0;

function toggleTheme() {
  currentThemeIndex = (currentThemeIndex + 1) % themes.length;
  const current = themes[currentThemeIndex];

  if (current.key === "dark") {
    document.documentElement.removeAttribute("data-theme");
  } else {
    document.documentElement.setAttribute("data-theme", current.key);
  }

  const btn = document.getElementById("themeToggleBtn");
  const label = document.getElementById("themeLabel");
  if (btn) btn.textContent = current.emoji;
  if (label) label.textContent = themes[(currentThemeIndex + 1) % themes.length].label;

  try { localStorage.setItem("nyaybot-theme", current.key); } catch(e) {}
}

(function initTheme() {
  try {
    const saved = localStorage.getItem("nyaybot-theme");
    if (saved && saved !== "dark") {
      const idx = themes.findIndex(t => t.key === saved);
      if (idx !== -1) {
        currentThemeIndex = idx;
        document.documentElement.setAttribute("data-theme", saved);
        const btn = document.getElementById("themeToggleBtn");
        const label = document.getElementById("themeLabel");
        if (btn) btn.textContent = themes[idx].emoji;
        if (label) label.textContent = themes[(idx + 1) % themes.length].label;
      }
    }
  } catch(e) {}
})();

// ─── State ────────────────────────────────────────────
let authorities = [];
let isLoading = false;
let chatStarted = false;

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
    if (hits.length > 0) matched.push({ ...cat, score: hits.length });
  }
  matched.sort((a, b) => b.score - a.score);
  return matched.slice(0, 2);
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

// ─── Show chat ─────────────────────────────────────────
function startChat() {
  if (!chatStarted) {
    chatStarted = true;
    welcomeScreen.style.display = "none";
    chatArea.style.display = "flex";
    chatArea.classList.add("active");
  }
}

// ─── Add message ───────────────────────────────────────
function addMessage(role, content, authorityCards = "") {
  startChat();
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
  startChat();
  const div = document.createElement("div");
  div.className = "message bot";
  div.id = "typingIndicator";
  div.innerHTML = `
    <div class="avatar bot">⚖️</div>
    <div class="bubble">
      <div class="typing"><span></span><span></span><span></span></div>
    </div>`;
  chatArea.appendChild(div);
  chatArea.scrollTop = chatArea.scrollHeight;
}

function removeTyping() {
  const el = document.getElementById("typingIndicator");
  if (el) el.remove();
}

// ─── Get demo response ─────────────────────────────────
function getDemoResponse(message) {
  // exact match first
  if (DEMO_RESPONSES[message]) return DEMO_RESPONSES[message];

  // fuzzy match — check if any key is substantially contained
  const lower = message.toLowerCase();
  for (const [key, val] of Object.entries(DEMO_RESPONSES)) {
    const keyWords = key.toLowerCase().split(" ").filter(w => w.length > 4);
    const hits = keyWords.filter(w => lower.includes(w));
    if (hits.length >= 3) return val;
  }

  return FALLBACK_RESPONSE;
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

  // fake delay — feels natural
  await new Promise(r => setTimeout(r, 1200 + Math.random() * 800));

  removeTyping();
  const reply = getDemoResponse(message);
  const matches = matchAuthorities(message);
  const cards = renderAuthorityCards(matches);
  addMessage("bot", reply, cards);

  isLoading = false;
  sendBtn.disabled = false;
  userInput.focus();
}

// ─── Category sidebar click ────────────────────────────
function handleCategoryClick(btn) {
  document.querySelectorAll(".category-btn").forEach(b => b.classList.remove("active"));
  btn.classList.add("active");
  sendMessage(btn.dataset.query);
}

// ─── Starter prompts ───────────────────────────────────
function handleStarter(text) {
  sendMessage(text);
}

// ─── Input resize + enter to send ─────────────────────
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
