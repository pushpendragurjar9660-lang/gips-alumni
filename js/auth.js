const AUTH_STORAGE_KEY = "gips-auth-session";
const AUTH_PAGE = "login.html";
const PROTECTED_PAGES = new Set([
  "index.html",
  "analytics.html",
  "attendance.html",
  "daily-update.html",
  "register.html",
  "members.html",
  "chat.html",
  "profile.html",
  "admin.html",
]);

function currentPage() {
  return window.location.pathname.split("/").pop() || "index.html";
}

function authHeaders() {
  return {
    apikey: SUPABASE_PUBLISHABLE_KEY,
    Authorization: `Bearer ${window.AUTH_SESSION?.access_token || SUPABASE_PUBLISHABLE_KEY}`,
  };
}

function saveAuthSession(session) {
  window.AUTH_SESSION = session;
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function readAuthSession() {
  try {
    return JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY) || "null");
  } catch (error) {
    return null;
  }
}

function clearAuthSession() {
  window.AUTH_SESSION = null;
  window.AUTH_USER = null;
  window.AUTH_PROFILE = null;
  localStorage.removeItem(AUTH_STORAGE_KEY);
}

async function refreshAuthSession(session) {
  if (!session?.refresh_token) return null;
  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=refresh_token`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ refresh_token: session.refresh_token }),
  });
  if (!response.ok) return null;
  const nextSession = await response.json();
  saveAuthSession(nextSession);
  return nextSession;
}

async function loadAuthProfile(session) {
  const profileResponse = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,name,email,photo_url,role,created_at&id=eq.${encodeURIComponent(session.user.id)}`, { headers: authHeaders() });
  const profile = profileResponse.ok ? (await profileResponse.json())[0] : null;

  const adminResponse = await fetch(`${SUPABASE_URL}/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(session.user.id)}`, { headers: authHeaders() });
  const isAdminAllowed = adminResponse.ok && (await adminResponse.json()).length > 0;

  if (profile) {
    if (profile.role === "admin" || isAdminAllowed) {
      return { ...profile, role: "admin" };
    }
    return profile;
  }

  if (isAdminAllowed) {
    return { id: session.user.id, name: session.user.email?.split("@")[0] || "Admin", email: session.user.email, role: "admin", photo_url: "" };
  }
  return null;
}

function redirectToLogin() {
  const next = `${currentPage()}${window.location.hash}`;
  window.location.replace(`${AUTH_PAGE}?next=${encodeURIComponent(next)}`);
}

function addPortalLink(nav, { href, label, iconName, key, adminOnly = false }) {
  let link = nav.querySelector(`[data-portal-link="${key}"]`);
  if (!link) {
    link = document.createElement("a");
    link.className = "side-nav-link";
    link.dataset.portalLink = key;
    link.innerHTML = `<i data-lucide="${iconName}"></i><span>${label}</span>`;
    nav.appendChild(link);
  }
  link.href = href;
  link.dataset.page = href;
  link.dataset.nav = key;
  link.setAttribute("aria-label", label);
  link.title = label;
  link.hidden = adminOnly && window.AUTH_PROFILE?.role !== "admin";
  return link;
}

function initPortalSidebar() {
  const nav = document.querySelector(".side-nav-links");
  if (!nav) return;
  const brand = document.querySelector(".side-brand");
  if (brand?.tagName === "BUTTON") {
    const link = document.createElement("a");
    link.className = brand.className;
    link.href = "index.html";
    link.dataset.page = "index.html";
    link.setAttribute("aria-label", "Go to home");
    link.innerHTML = brand.innerHTML;
    brand.replaceWith(link);
  }
  addPortalLink(nav, { href: "chat.html", label: "Chat", iconName: "messages-square", key: "chat" });
  addPortalLink(nav, { href: "profile.html", label: "Profile", iconName: "circle-user-round", key: "profile" });
  addPortalLink(nav, { href: "admin.html", label: "Admin Dashboard", iconName: "shield-check", key: "admin", adminOnly: true });

  const page = currentPage();
  const chatLink = nav.querySelector('[data-portal-link="chat"]');
  if (chatLink) {
    let unread = chatLink.querySelector(".chat-unread");
    const unreadCount = Number(localStorage.getItem("gips-chat-unread") || 0);
    if (!unread) {
      unread = document.createElement("span");
      unread.className = "chat-unread";
      chatLink.appendChild(unread);
    }
    unread.textContent = unreadCount > 99 ? "99+" : String(unreadCount);
    unread.hidden = !unreadCount || page === "chat.html";
  }
  nav.querySelectorAll(".side-nav-link").forEach((link) => {
    const target = (link.dataset.page || link.getAttribute("href") || "").split("#")[0].split("/").pop();
    link.classList.toggle("active", target === page);
  });
  document.querySelectorAll("[data-admin-only]").forEach((element) => {
    element.hidden = window.AUTH_PROFILE?.role !== "admin";
  });
  if (window.lucide) lucide.createIcons();
}

async function loginWithPassword(email, password) {
  clearAuthSession();

  const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
    method: "POST",
    headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error_description || data.msg || "Invalid email or password.");

  const previousSession = readAuthSession();
  if (previousSession?.user?.id && previousSession.user.id !== data.user?.id) {
    clearAuthSession();
  }

  saveAuthSession(data);
  const profile = await loadAuthProfile(data);
  if (!profile) {
    await logoutUser();
    throw new Error("Your account is not approved for this portal yet.");
  }
  window.AUTH_USER = data.user;
  window.AUTH_PROFILE = profile;
  return profile;
}

async function logoutUser() {
  const session = window.AUTH_SESSION || readAuthSession();
  if (session?.access_token) {
    await fetch(`${SUPABASE_URL}/auth/v1/logout`, { method: "POST", headers: authHeaders() }).catch(() => {});
  }
  clearAuthSession();
  window.location.replace(AUTH_PAGE);
}

async function resolveAuth() {
  let session = readAuthSession();
  if (!session) return null;

  const userResponse = await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: authHeaders() });
  if (!userResponse.ok) {
    session = await refreshAuthSession(session);
    if (!session) {
      clearAuthSession();
      return null;
    }
  }

  const user = session.user || await (await fetch(`${SUPABASE_URL}/auth/v1/user`, { headers: authHeaders() })).json();
  if (!user?.id) {
    clearAuthSession();
    return null;
  }

  window.AUTH_USER = user;
  const profile = await loadAuthProfile(session);
  if (!profile) {
    clearAuthSession();
    return null;
  }

  window.AUTH_PROFILE = profile;
  saveAuthSession(session);
  return session;
}

async function protectCurrentPage() {
  const page = currentPage();
  if (page === AUTH_PAGE) {
    const session = await resolveAuth();
    if (session) window.location.replace("index.html");
    return null;
  }
  if (!PROTECTED_PAGES.has(page)) return null;
  const session = await resolveAuth();
  if (!session) {
    redirectToLogin();
    return null;
  }
  if ((page === "admin.html" || page === "daily-update.html") && window.AUTH_PROFILE.role !== "admin") {
    window.location.replace("access-denied.html");
    return null;
  }
  initPortalSidebar();
  return session;
}

async function initLoginPage() {
  const form = document.getElementById("login-form");
  if (!form) return;
  const status = document.getElementById("login-status");
  const submit = document.getElementById("login-submit");
  const password = document.getElementById("login-password");
  document.getElementById("toggle-password")?.addEventListener("click", () => {
    password.type = password.type === "password" ? "text" : "password";
  });
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    submit.disabled = true;
    submit.textContent = "Signing in...";
    status.textContent = "";
    try {
      await loginWithPassword(document.getElementById("login-email").value.trim(), password.value);
      const destination = new URLSearchParams(window.location.search).get("next") || "index.html";
      window.location.replace(destination);
    } catch (error) {
      status.textContent = error.message;
      submit.disabled = false;
      submit.textContent = "Sign in";
    }
  });
}

window.AUTH_READY = protectCurrentPage();

document.addEventListener("DOMContentLoaded", async () => {
  await window.AUTH_READY;
  initLoginPage();
  document.querySelectorAll("[data-logout]").forEach((button) => button.addEventListener("click", logoutUser));
  if (currentPage() !== AUTH_PAGE) initPortalSidebar();
});
