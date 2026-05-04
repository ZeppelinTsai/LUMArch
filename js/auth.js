async function login(email) {
  const res = await fetch(`${API_BASE}/api/auth/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert("登入失敗");
    return;
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  return data.user;
}

function getToken() {
  return localStorage.getItem(TOKEN_KEY);
}

function logout() {
  localStorage.removeItem(TOKEN_KEY);
  location.reload();
}

async function handleEmailLogin() {
  const input = document.getElementById("emailInput");
  const email = input.value.trim();

  if (!email) {
    alert("請輸入 Email");
    return;
  }

  const res = await fetch(`${API_BASE}/api/auth/email`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });

  const data = await res.json();

  if (!res.ok) {
    alert(data.detail || "登入失敗");
    return;
  }

  localStorage.setItem(TOKEN_KEY, data.token);
  localStorage.setItem("lumarch_user", JSON.stringify(data.user));

  renderAuthState();
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
  const guestEl = document.getElementById("authGuest");
  const userEl = document.getElementById("authUser");
  const emailEl = document.getElementById("userEmail");
  const planEl = document.getElementById("userPlan");

  if (!guestEl || !userEl) return;

  if (user) {
    guestEl.style.display = "none";
    userEl.style.display = "flex";
    emailEl.textContent = user.email;
    planEl.textContent = user.plan || "free";
  } else {
    guestEl.style.display = "flex";
    userEl.style.display = "none";
  }
}
