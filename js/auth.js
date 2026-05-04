async function requestCode() {
  const email = document.getElementById("loginEmail").value.trim();

  if (!email) {
    Swal.fire("請輸入 Email");
    return;
  }

  const res = await fetch(`${API_BASE}/api/auth/request-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    Swal.fire("發送失敗", data.detail || "請稍後再試", "error");
    return;
  }

  document.getElementById("codeArea").style.display = "block";

  Swal.fire(
    "驗證碼已建立",
    data.dev_code ? `開發測試碼：${data.dev_code}` : "請查看信箱",
    "success",
  );
}

async function verifyCode() {
  const email = document.getElementById("loginEmail").value.trim();
  const code = document.getElementById("loginCode").value.trim();

  if (!email || !code) {
    Swal.fire("請輸入 Email 與驗證碼");
    return;
  }

  const res = await fetch(`${API_BASE}/api/auth/verify-code`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, code }),
  });

  const data = await res.json();

  if (!res.ok) {
    Swal.fire("登入失敗", data.detail || "驗證碼錯誤", "error");
    return;
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem("lumarch_user", JSON.stringify(data.user));

  renderAuthState();

  Swal.fire("登入成功", data.user.email, "success");

  const modalEl = document.getElementById("loginModal");
  bootstrap.Modal.getInstance(modalEl)?.hide();
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function getUser() {
  try {
    return JSON.parse(localStorage.getItem("lumarch_user") || "null");
  } catch {
    return null;
  }
}

function handleLogout() {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem("lumarch_user");
  renderAuthState();
}

function renderAuthState() {
  const user = getUser();
  // 你還沒做 topbar user 區也沒關係，先不爆
}
