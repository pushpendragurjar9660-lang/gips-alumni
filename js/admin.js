function escapeAdminText(value) {
  return String(value || "").replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" }[character]));
}

async function initAdminPage() {
  await window.AUTH_READY;
  if (window.AUTH_PROFILE?.role !== "admin") return;
  document.getElementById("admin-user-label").textContent = `Signed in as ${window.AUTH_PROFILE.email || window.AUTH_USER.email}`;
  const rows = document.getElementById("admin-members-rows");
  const status = document.getElementById("admin-status");
  const response = await fetch(`${SUPABASE_URL}/rest/v1/profiles?select=id,name,email,role,created_at&order=created_at.asc`, { headers: authHeaders() });
  if (!response.ok) {
    rows.innerHTML = `<tr><td colspan="4">Approved profiles could not be loaded.</td></tr>`;
    status.textContent = "Check the profiles table and its RLS policy.";
    return;
  }
  const profiles = await response.json();
  rows.innerHTML = profiles.length ? profiles.map((profile) => `<tr><td><strong>${escapeAdminText(profile.name)}</strong></td><td>${escapeAdminText(profile.email)}</td><td>${escapeAdminText(profile.role)}</td><td>${new Date(profile.created_at).toLocaleDateString()}</td></tr>`).join("") : `<tr><td colspan="4">No approved profiles yet.</td></tr>`;
}

document.addEventListener("DOMContentLoaded", initAdminPage);
