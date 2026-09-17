async function initProfilePage() {
  await window.AUTH_READY;
  const profile = window.AUTH_PROFILE;
  if (!profile) return;
  const avatar = document.getElementById("profile-avatar");
  avatar.innerHTML = profile.photo_url ? `<img class="avatar-photo" src="${profile.photo_url}" alt="${profile.name}" />` : `<div class="avatar-initials">${profile.name.split(" ").map((part) => part[0]).join("").slice(0, 3).toUpperCase()}</div>`;
  document.getElementById("profile-name").textContent = profile.name;
  document.getElementById("profile-email").textContent = profile.email || window.AUTH_USER.email;
  document.getElementById("profile-role").textContent = profile.role === "admin" ? "Administrator" : "Member";
}

document.addEventListener("DOMContentLoaded", initProfilePage);
