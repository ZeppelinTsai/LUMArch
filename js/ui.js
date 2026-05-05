// ── Sidebar toggle ────────────────────────────────────────────────────────────
const sidebar = document.getElementById("sidebar");
const overlay = document.getElementById("sidebarOverlay");
let sidebarCollapsed = localStorage.getItem(LS_SIDEBAR_KEY) === "collapsed";

function isMobile() {
  return window.innerWidth <= 640;
}

function applyInitialSidebarState() {
  if (isMobile()) {
    // On mobile, always start closed
    sidebar.classList.add("collapsed");
  } else {
    if (sidebarCollapsed) sidebar.classList.add("collapsed");
  }
}

function toggleSidebar() {
  if (isMobile()) {
    const isOpen = !sidebar.classList.contains("collapsed");
    if (isOpen) {
      sidebar.classList.add("collapsed");
      overlay.classList.remove("visible");
    } else {
      sidebar.classList.remove("collapsed");
      overlay.classList.add("visible");
    }
  } else {
    sidebarCollapsed = !sidebarCollapsed;
    sidebar.classList.toggle("collapsed", sidebarCollapsed);
    localStorage.setItem(
      LS_SIDEBAR_KEY,
      sidebarCollapsed ? "collapsed" : "open",
    );
  }
}

// ── Render history sidebar ────────────────────────────────────────────────────
function renderHistoryList() {
  const list = document.getElementById("historyList");
  list.innerHTML = "";
  const sorted = [...sessions].sort((a, b) => b.ts - a.ts);
  sorted.forEach((sess) => {
    const item = document.createElement("div");
    item.className =
      "history-item" + (sess.id === currentSessionId ? " active" : "");

    const textEl = document.createElement("span");
    textEl.className = "history-item-text";
    textEl.textContent = sess.title || "（無標題）";
    textEl.title = sess.title || "";
    textEl.onclick = () => {
      loadSessionUI(sess.id);
      if (isMobile()) {
        sidebar.classList.add("collapsed");
        overlay.classList.remove("visible");
      }
    };

    const delBtn = document.createElement("button");
    delBtn.className = "history-del";
    delBtn.innerHTML = "✕";
    delBtn.title = "刪除此對話";
    delBtn.onclick = (e) => {
      e.stopPropagation();
      showConfirm(`確定要刪除「${sess.title}」？`, () => {
        deleteSession(sess.id);
        if (currentSessionId === sess.id) {
          currentSessionId = null;
          lastSourceBySid = new Map();
          showWelcome();
        }
        renderHistoryList();
      });
    };

    item.appendChild(textEl);
    item.appendChild(delBtn);
    list.appendChild(item);
  });
}

// ── Load session into UI ──────────────────────────────────────────────────────
function loadSessionUI(id) {
  const sess = getSession(id);
  if (!sess) return;
  currentSessionId = id;
  lastSourceBySid = new Map(Object.entries(sess.sources || {}));
  const msgs = document.getElementById("messages");
  msgs.innerHTML = "";
  sess.messages.forEach((m) =>
    addMessage(m.role === "assistant" ? "ai" : m.role, m.content),
  );
  renderHistoryList();
}

// ── newChat / welcome ─────────────────────────────────────────────────────────
function newChat() {
  currentSessionId = null;
  lastSourceBySid = new Map();
  showWelcome();
  renderHistoryList();
}
function showWelcome() {
  document.getElementById("messages").innerHTML = `
  <div class="welcome" id="welcome">
    <div class="welcome-icon">🏗️</div>
    <h1>建築法規 AI 諮詢</h1>
    <p>您好！我能協助您查詢台灣建築法規相關問題，包括建造執照、使用執照、改建規範、消防安全、無障礙設施等。</p>
    <div class="suggestions">
      <div class="suggestion-card" onclick="askSuggestion(this)"><span class="suggestion-icon">🔨</span>改建需要申請哪些許可？</div>
      <div class="suggestion-card" onclick="askSuggestion(this)"><span class="suggestion-icon">🚒</span>消防安全設備審查流程？</div>
      <div class="suggestion-card" onclick="askSuggestion(this)"><span class="suggestion-icon">♿</span>無障礙設施的設置規定？</div>
      <div class="suggestion-card" onclick="askSuggestion(this)"><span class="suggestion-icon">📋</span>使用執照申請需要哪些文件？</div>
    </div>
  </div>`;
}
function hideWelcome() {
  const w = document.getElementById("welcome");
  if (w) w.remove();
}

// ── Confirm dialog ────────────────────────────────────────────────────────────
let _cb = null;
function showConfirm(msg, cb) {
  document.getElementById("confirmMsg").textContent = msg;
  _cb = cb;
  const modalEl = document.getElementById("confirmModal");
  bootstrap.Modal.getOrCreateInstance(modalEl).show();
}
function confirmOk() {
  const modalEl = document.getElementById("confirmModal");
  bootstrap.Modal.getInstance(modalEl)?.hide();
  _cb?.();
  _cb = null;
}
function confirmCancel() {
  _cb = null;
}

// ── addMessage ────────────────────────────────────────────────────────────────
function addMessage(role, content, isTyping = false) {
  const msgs = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = `message ${role}`;
  const av = document.createElement("div");
  av.className = `avatar ${role === "ai" ? "ai" : "user-av"}`;
  av.textContent = role === "ai" ? "法" : "您";
  const bbl = document.createElement("div");
  bbl.className = "bubble";
  if (isTyping) {
    bbl.innerHTML =
      '<div class="typing"><span></span><span></span><span></span></div>';
    div.id = "typing-indicator";
  } else {
    bbl.innerHTML = formatMessage(content);
  }
  div.appendChild(av);
  div.appendChild(bbl);
  msgs.appendChild(div);
  msgs.scrollTop = msgs.scrollHeight;
  return div;
}
// ── Helpers ───────────────────────────────────────────────────────────────────
function askSuggestion(el) {
  document.getElementById("userInput").value = el.innerText.trim();
  sendMessage();
}
function autoResize(el) {
  el.style.height = "auto";
  el.style.height = Math.min(el.scrollHeight, 120) + "px";
}
function handleKey(e) {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    sendMessage();
  }
}
