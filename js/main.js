// ── sendMessage ───────────────────────────────────────────────────────────────
async function sendMessage() {
  if (!getToken()) {
    addMessage("ai", "請先使用 Email 登入後再開始查詢。");
    return;
  }
  const input = document.getElementById("userInput");
  const sendBtn = document.getElementById("sendBtn");
  const text = input.value.trim();
  if (!text) return;
  hideWelcome();
  input.value = "";
  input.style.height = "auto";
  sendBtn.disabled = true;

  if (!currentSessionId) {
    const id = "sess_" + Date.now();
    sessions.push({
      id,
      title: text.length > 22 ? text.slice(0, 22) + "…" : text,
      messages: [],
      sources: {},
      ts: Date.now(),
    });
    currentSessionId = id;
    saveSessions();
    renderHistoryList();
  }

  const sess = getSession(currentSessionId);
  sess.messages.push({ role: "user", content: text });
  sess.ts = Date.now();
  saveSessions();
  addMessage("user", text);
  const typingEl = addMessage("ai", "", true);

  try {
    const res = await fetch(`${API_BASE}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${getToken()}`,
      },
      body: JSON.stringify({
        query: text,
        cand_topk: 50,
        max_src_tokens: 3500,
        max_each_tokens: 700,
      }),
    });
    const data = await res.json();
    typingEl.remove();
    if (!res.ok) {
      if (res.status === 403) {
        Swal.fire({
          icon: "warning",
          title: "試用次數已用完",
          html: `
        <div style="line-height:1.8">
          請升級 Pro 繼續使用<br>
          <strong>Pro 方案：NT$99 / 月</strong><br>
          <small>不限次數查詢 / 附條文來源 / 節省手動翻法規時間</small>
        </div>
      `,
          showCancelButton: true,
          confirmButtonText: "升級 Pro",
          cancelButtonText: "稍後再說",
          confirmButtonColor: "#d6522c",
          scrollbarPadding: false, // ⭐ 重點
        }).then((result) => {
          if (result.isConfirmed) {
            openUpgradeModal();
          }
        });
        return;
      }

      addMessage("ai", `⚠️ ${data.detail || "伺服器錯誤"}`);
      return;
    }

    const aiText = data.answer || "抱歉，無法取得回應。";
    const srcMap = {};
    (data.provided_sources || []).forEach((s) => {
      srcMap[s.sid] = s;
    });
    Object.assign(sess.sources, srcMap);
    lastSourceBySid = new Map(Object.entries(sess.sources));
    sess.messages.push({ role: "assistant", content: aiText });
    sess.ts = Date.now();
    saveSessions();
    addMessage("ai", aiText);
    renderHistoryList();
  } catch (err) {
    typingEl.remove();
    addMessage("ai", "⚠️ 連線錯誤，請確認伺服器是否已啟動。");
  } finally {
    sendBtn.disabled = false;
  }
}
window.addEventListener("resize", () => {
  if (!isMobile()) {
    overlay.classList.remove("visible");
    sidebar.classList.toggle("collapsed", sidebarCollapsed);
  } else {
    sidebar.classList.add("collapsed");
    overlay.classList.remove("visible");
  }
});

// ── Init ──────────────────────────────────────────────────────────────────────
applyInitialSidebarState();
loadSessions();
renderHistoryList();
renderAuthState();
