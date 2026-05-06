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

    <h1>建築法規 AI 助理</h1>

    <p>
      快速查詢違建、改建、容積率、
      地下室開挖與室內裝修等建築法規問題。
    </p>

    <div class="welcome-section-title">
      🔥 大家最近都在查
    </div>

    <div class="suggestions">

      <div class="suggestion-card" onclick="askSuggestion(this)">
        <span class="suggestion-icon">⚠️</span>
        陽台外推算違建嗎？
      </div>

      <div class="suggestion-card" onclick="askSuggestion(this)">
        <span class="suggestion-icon">🏠</span>
        頂樓加蓋合法嗎？
      </div>

      <div class="suggestion-card" onclick="askSuggestion(this)">
        <span class="suggestion-icon">🔨</span>
        改建需要申請哪些許可？
      </div>

      <div class="suggestion-card" onclick="askSuggestion(this)">
        <span class="suggestion-icon">🚧</span>
        地下室開挖幾公尺需要審查？
      </div>

      <div class="suggestion-card" onclick="askSuggestion(this)">
        <span class="suggestion-icon">📐</span>
        容積率怎麼算？
      </div>

      <div class="suggestion-card" onclick="askSuggestion(this)">
        <span class="suggestion-icon">🚒</span>
        店面裝修需要消防審查嗎？
      </div>

    </div>

  </div>`;
}
function gotoBuildLaw() {
  loadPage("./building-law/index.html");
}
function gotoLawSearch() {
  const mainContent = document.getElementById("mainContent");
  mainContent.innerHTML = `
    <iframe
      src="https://lumarch-back.onrender.com/law/"
      style="width: 100%; height: 100%; border: none;"
    ></iframe>
  `;
}
async function loadPage(path) {
  const mainContent = document.getElementById("mainContent");

  try {
    const res = await fetch(path);

    if (!res.ok) {
      throw new Error(`HTTP ${res.status}`);
    }

    const html = await res.text();

    const parser = new DOMParser();
    const doc = parser.parseFromString(html, "text/html");
    const pageRoot = path.includes("/")
      ? path.slice(0, path.lastIndexOf("/") + 1)
      : "./";
    const scripts = [...doc.body.querySelectorAll("script")];

    scripts.forEach((script) => script.remove());

    mainContent.innerHTML = doc.body.innerHTML;

    const pageRootTarget = mainContent.querySelector(
      "[data-page-root], .blog-page",
    );
    if (pageRootTarget) {
      pageRootTarget.dataset.pageRoot = pageRoot;
    }

    scripts.forEach((script) => {
      const runnableScript = document.createElement("script");

      [...script.attributes].forEach((attr) => {
        if (attr.name === "src") {
          runnableScript.src = new URL(
            attr.value,
            new URL(pageRoot, window.location.href),
          ).toString();
        } else {
          runnableScript.setAttribute(attr.name, attr.value);
        }
      });

      runnableScript.textContent = script.textContent;
      mainContent.appendChild(runnableScript);
    });

    // 捲到頂部
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  } catch (err) {
    console.error(err);

    mainContent.innerHTML = `
      <div style="padding:40px;">
        <h2>頁面載入失敗</h2>
        <p>${err.message}</p>
      </div>
    `;
  }
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
function addMessage(role, content, isTyping = false, keyword = "") {
  const msgs = document.getElementById("messages");
  const div = document.createElement("div");
  div.className = `message ${role}`;

  const av = document.createElement("div");
  av.className = `avatar ${role === "ai" ? "ai" : "user-av"}`;
  if (role === "ai") {
    av.innerHTML = `<img src="./img/LUMArch_36.png" class="avatar-icon" />`;
  } else {
    av.textContent = "您";
  }

  const bbl = document.createElement("div");
  bbl.className = "bubble";

  if (isTyping) {
    bbl.innerHTML = `
    <div class="typing-wrap">
      <div class="typing">
        <span></span><span></span><span></span>
      </div>

      <div class="typing-text" id="typingText">
        正在搜尋建築法規資料庫...
      </div>
    </div>
  `;

    div.id = "typing-indicator";

    // 階段式文字
    setTimeout(() => {
      const el = document.getElementById("typingText");
      if (el) {
        el.textContent = "正在分析相關條文...";
      }
    }, 4000);

    setTimeout(() => {
      const el = document.getElementById("typingText");
      if (el) {
        el.textContent = "正在整理法規重點...";
      }
    }, 9000);

    setTimeout(() => {
      const el = document.getElementById("typingText");
      if (el) {
        el.textContent = "正在產生 AI 回答...";
      }
    }, 14000);
  } else {
    bbl.innerHTML = formatMessage(content, keyword, role);
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
