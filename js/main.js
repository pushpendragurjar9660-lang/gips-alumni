/* =====================================================================
   MAIN.JS — GIPS ALUMNI MEET 2026
   ---------------------------------------------------------------------
   This file reads everything from js/data.js and builds the page.
   You normally do NOT need to edit this file — to change content,
   edit js/data.js instead. This file is about *how* things are shown,
   not *what* is shown.
===================================================================== */

/* ------------------------------ helpers -------------------------------- */

function getInitials(name) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((w) => w[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

// A department's score is ALWAYS calculated live from its members'
// individual scores — never a fixed number. `scored: false` opts a
// whole department out of scoring (see js/data.js).
function departmentScore(dept) {
  if (dept.scored === false) return null;
  const scored = dept.members.filter((m) => typeof m.score === "number");
  if (scored.length === 0) return null;
  const total = scored.reduce((sum, m) => sum + m.score, 0);
  return Math.round((total / scored.length) * 10) / 10;
}

// A department's overall performance badge = the best performance level
// present among its members.
function departmentPerformance(dept) {
  const levels = dept.members.map((m) => m.performance);
  levels.sort((a, b) => LEVEL_ORDER.indexOf(a) - LEVEL_ORDER.indexOf(b));
  return levels[0];
}

function computeRankedDepartments() {
  const withScores = DEPARTMENTS.map((d) => ({
    ...d,
    score: departmentScore(d),
    performance: departmentPerformance(d),
    memberCount: d.members.length,
  }));
  // Ranking is driven entirely by member scores. Departments with no
  // score are never ranked against the others.
  const scored = withScores
    .filter((d) => d.score != null)
    .sort((a, b) => b.score - a.score)
    .map((d, i) => ({ ...d, rank: i + 1 }));
  const unscored = withScores.filter((d) => d.score == null).map((d) => ({ ...d, rank: null }));
  return [...scored, ...unscored];
}

// Every scored member across every department, ranked purely by their
// own score — this is the single source of truth for "Current
// Performance". Departments never appear here, only people.
function computeRankedMembers(rankedDepts) {
  const all = [];
  rankedDepts.forEach((dept) => {
    dept.members.forEach((m) => {
      if (typeof m.score === "number") {
        all.push({ ...m, department: dept.name, departmentId: dept.id });
      }
    });
  });
  all.sort((a, b) => b.score - a.score);
  return all.map((m, i) => ({ ...m, rank: i + 1 }));
}

function icon(name, size = 18, color = "currentColor", extraClass = "") {
  return `<i data-lucide="${name}" class="${extraClass}" style="width:${size}px;height:${size}px;color:${color}"></i>`;
}

function perfBadge(level, size = "md") {
  const c = PERFORMANCE_LEVELS[level] || PERFORMANCE_LEVELS["Good"];
  const starSize = size === "sm" ? 11 : 13;
  return `<span class="badge ${size === "sm" ? "badge-sm" : ""}" style="background:${c.bg};color:${c.text};border:1px solid ${c.ring}">
    <i data-lucide="star" style="width:${starSize}px;height:${starSize}px;fill:${c.text};stroke-width:0"></i>${level}
  </span>`;
}

function avatar(name, photo, size = 56) {
  if (photo) {
    return `<img class="avatar-photo" src="${photo}" alt="${name}" loading="lazy" decoding="async" width="${size}" height="${size}" style="width:${size}px;height:${size}px" />`;
  }
  return `<div class="avatar-initials" style="width:${size}px;height:${size}px;font-size:${size * 0.34}px">${getInitials(name)}</div>`;
}

function sealMedallion(size, tone, innerHtml) {
  return `<div class="seal-medallion" style="width:${size}px;height:${size}px;border:2px solid ${tone};color:${tone}">${innerHtml}</div>`;
}

/* ---------------------------- scroll reveal ----------------------------- */
const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("in-view");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.15 }
);

function observeReveals(root = document) {
  root.querySelectorAll(".reveal:not(.in-view)").forEach((el) => revealObserver.observe(el));
}

/* -------------------------------- navbar -------------------------------- */
function initNavbar() {
  const brandShort = document.getElementById("brand-short");
  const brandEvent = document.getElementById("brand-event");
  if (brandShort) brandShort.textContent = SCHOOL.shortName;
  if (brandEvent) brandEvent.textContent = EVENT.name;

  const sideShort = document.getElementById("side-brand-short");
  const sideEvent = document.getElementById("side-brand-event");
  if (sideShort) sideShort.textContent = SCHOOL.shortName;
  if (sideEvent) sideEvent.textContent = EVENT.name;
  document.querySelectorAll(".gips-logo").forEach((img) => (img.src = LOGO_SRC));

  let navbar = document.getElementById("navbar");
  if (!navbar) {
    navbar = document.createElement("header");
    navbar.id = "navbar";
    navbar.className = "navbar";
    navbar.innerHTML = `
      <div class="nav-inner">
        <div class="mobile-header-left">
          <button id="mobile-toggle" class="mobile-toggle" type="button" aria-label="Open menu">${icon("menu", 26)}</button>
          <a class="brand" href="index.html" aria-label="Go to home">
            <img src="${LOGO_SRC}" alt="GIPS crest" />
            <div class="brand-text">
              <span class="brand-short">${SCHOOL.shortName}</span>
              <span class="brand-event">${EVENT.name}</span>
            </div>
          </a>
        </div>
        <a id="mobile-back-home" class="mobile-back-home" href="index.html" aria-label="Back to home">${icon("arrow-left", 20)} Home</a>
      </div>
      <nav id="mobile-panel" class="mobile-panel" aria-label="Mobile navigation"></nav>
    `;
    document.body.insertBefore(navbar, document.body.firstChild);
  }

  const mobilePanel = document.getElementById("mobile-panel");
  if (mobilePanel && !mobilePanel.querySelector("[data-nav]")) {
    const mobileLinks = [...document.querySelectorAll(".side-nav-link")].map((link) => {
      const clone = link.cloneNode(true);
      clone.removeAttribute("hidden");
      clone.classList.remove("active");
      clone.setAttribute("data-mobile-link", "true");
      return clone;
    });
    mobilePanel.append(...mobileLinks);
  }

  const sideNav = document.getElementById("side-nav");
  let collapseTimer;
  if (sideNav) {
    sideNav.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "touch") return;
      clearTimeout(collapseTimer);
      sideNav.classList.add("sidebar-expanded");
    });
    sideNav.addEventListener("pointerleave", (event) => {
      if (event.pointerType === "touch") return;
      collapseTimer = setTimeout(() => sideNav.classList.remove("sidebar-expanded"), 200);
    });
  }
  if (navbar) {
    window.addEventListener("scroll", () => {
      navbar.classList.toggle("scrolled", window.scrollY > 30);
    });
  }

  const mobileToggle = document.getElementById("mobile-toggle");
  if (mobileToggle && mobilePanel) {
    const syncMobileState = () => {
      const open = mobilePanel.classList.contains("open");
      mobileToggle.innerHTML = open ? icon("x", 26) : icon("menu", 26);
      lucide.createIcons();
    };
    mobileToggle.addEventListener("click", () => {
      mobilePanel.classList.toggle("open");
      syncMobileState();
    });
    mobilePanel.querySelectorAll("[data-nav]").forEach((link) => {
      link.addEventListener("click", () => {
        mobilePanel.classList.remove("open");
        syncMobileState();
      });
    });
    syncMobileState();
  }

  const currentPath = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll("[data-nav]").forEach((btn) => {
    const page = btn.getAttribute("data-page") || btn.getAttribute("href") || "";
    const id = btn.getAttribute("data-nav");
    if (page && currentPath === page.split("/").pop()) {
      btn.classList.add("active");
      document.querySelectorAll(".side-nav-link").forEach((link) => {
        const linkPage = link.getAttribute("data-page") || link.getAttribute("href") || "";
        link.classList.toggle("active", linkPage && currentPath === linkPage.split("/").pop());
      });
    }

    btn.addEventListener("click", (event) => {
      const href = btn.getAttribute("href");
      if (href && !href.startsWith("#")) return;
      const id = btn.getAttribute("data-nav");
      if (!id) return;
      if (mobilePanel && mobileToggle && id === "analytics") {
        mobilePanel.classList.remove("open");
        mobileToggle.innerHTML = icon("menu", 26);
        lucide.createIcons();
        return;
      }
      const target = document.getElementById(id);
      if (target) target.scrollIntoView({ behavior: "smooth", block: "start" });
      document.querySelectorAll(".side-nav-link").forEach((link) => link.classList.toggle("active", link.getAttribute("data-nav") === id));
      if (mobilePanel && mobileToggle) {
        mobilePanel.classList.remove("open");
        mobileToggle.innerHTML = icon("menu", 26);
        lucide.createIcons();
      }
    });
  });
}

/* --------------------------------- hero ---------------------------------- */
function renderHero(rankedDepts, rankedMembers) {
  const schoolLine = document.getElementById("hero-school-line");
  const eventName = document.getElementById("hero-event-name");
  const tagline = document.getElementById("hero-tagline");
  const dateText = document.getElementById("hero-date-text");
  const note = document.getElementById("hero-date-note");
  const dot = document.getElementById("hero-date-dot");
  if (!schoolLine || !eventName || !tagline || !dateText) return;
  schoolLine.textContent = `${SCHOOL.name} · ${SCHOOL.city}`;
  eventName.textContent = EVENT.name;
  tagline.textContent = EVENT.tagline;
  dateText.textContent = EVENT.dateRange;
  if (EVENT.dateConfirmed) {
    note.style.display = "none";
    dot.style.display = "none";
  } else {
    note.style.display = "";
    dot.style.display = "";
  }

  const stats = [
    { label: "Departments", value: rankedDepts.length },
    { label: "Student Members", value: `${rankedMembers.length + countUnscoredMembers(rankedDepts)}+` },
    { label: "Unified Team", value: "1" },
    { label: "Event Year", value: EVENT.year },
  ];
  document.getElementById("hero-stats").innerHTML = stats
    .map(
      (s) => `<div class="card stat-card reveal">
        <div class="serif stat-value">${s.value}</div>
        <div class="stat-label">${s.label}</div>
      </div>`
    )
    .join("");
}

function countUnscoredMembers(rankedDepts) {
  let n = 0;
  rankedDepts.forEach((d) => d.members.forEach((m) => { if (typeof m.score !== "number") n++; }));
  return n;
}

/* --------------------------------- about --------------------------------- */
function renderAbout() {
  const title = document.getElementById("about-title");
  const primary = document.getElementById("about-desc-1");
  const secondary = document.getElementById("about-desc-2");
  if (!title || !primary || !secondary) return;
  title.textContent = `About ${EVENT.name}`;
  primary.textContent = EVENT.description;
  secondary.textContent = EVENT.aboutSecondary;
}

/* ------------------------------ departments ------------------------------ */
function departmentCardHtml(dept) {
  const head = dept.members.find((m) => m.position === "Department Head");
  const co = dept.members.find((m) => m.position === "Co-Head");
  const rankBlock =
    dept.score != null
      ? `<div class="dept-rank-label">RANK #${dept.rank}</div>
         <div class="dept-score-value">${dept.score}<span>/100</span></div>`
      : `<div class="dept-rank-label muted">NOT SCORED</div>`;

  return `
    <div class="card dept-card reveal">
      <div class="dept-card-top">
        ${sealMedallion(52, "var(--royal)", icon(dept.icon, 22, "var(--royal)"))}
        <div class="dept-rank-block">${rankBlock}</div>
      </div>
      <div>
        <h3 class="serif dept-name">${dept.name}</h3>
        <p class="dept-desc">${dept.description}</p>
      </div>
      <div class="dept-meta-row">
        ${perfBadge(dept.performance, "sm")}
        <span class="dept-member-count">${dept.memberCount} members</span>
      </div>
      <div class="dept-leadership">
        <div class="dept-leadership-row">
          <span class="label">Head</span>
          <span class="value ${head ? "" : "tba"}">${head ? head.name : "To Be Assigned"}</span>
        </div>
        ${co ? `<div class="dept-leadership-row"><span class="label">Co-Head</span><span class="value">${co.name}</span></div>` : ""}
      </div>
      <button class="btn btn-primary btn-sm" data-open-dept="${dept.id}">View Team ${icon("chevron-right", 16)}</button>
    </div>`;
}

let ALL_RANKED_DEPTS = [];

function renderDepartments(rankedDepts, query = "", filter = "All") {
  const grid = document.getElementById("dept-grid");
  if (!grid) return;
  const filtered = rankedDepts.filter((d) => {
    const matchesQuery = d.name.toLowerCase().includes(query.toLowerCase());
    const matchesFilter = filter === "All" || d.performance === filter;
    return matchesQuery && matchesFilter;
  });

  grid.innerHTML = filtered.length
    ? filtered.map(departmentCardHtml).join("")
    : `<p class="no-results">No departments match your search yet.</p>`;

  lucide.createIcons();
  observeReveals(grid);

  grid.querySelectorAll("[data-open-dept]").forEach((btn) => {
    btn.addEventListener("click", () => openDepartmentModal(btn.getAttribute("data-open-dept")));
  });
}

function initDepartmentFilters(rankedDepts) {
  const filterSelect = document.getElementById("dept-filter");
  const searchInput = document.getElementById("dept-search");
  if (!filterSelect || !searchInput) return;
  filterSelect.innerHTML =
    `<option value="All">All performance levels</option>` +
    Object.keys(PERFORMANCE_LEVELS).map((f) => `<option value="${f}">${f}</option>`).join("");

  const rerender = () => renderDepartments(rankedDepts, searchInput.value, filterSelect.value);
  searchInput.addEventListener("input", rerender);
  filterSelect.addEventListener("change", rerender);

  renderDepartments(rankedDepts);
}

/* ---------------------------- department modal ---------------------------- */
function memberCardHtml(member) {
  const scoreHtml =
    typeof member.score === "number"
      ? `<span class="member-score">${member.score}<span> / 100</span></span>`
      : "";
  return `
    <div class="card member-card">
      ${avatar(member.name, member.photo, 58)}
      <div class="member-card-body">
        <div class="member-card-head">
          <h4 class="serif member-name">${member.name}</h4>
        </div>
        <p class="member-position">${member.position}</p>
        <p class="member-resp">${member.responsibility}</p>
        <div class="member-meta">${perfBadge(member.performance, "sm")}${scoreHtml}</div>
      </div>
    </div>`;
}

function openDepartmentModal(deptId) {
  const dept = ALL_RANKED_DEPTS.find((d) => d.id === deptId);
  if (!dept) return;
  const head = dept.members.find((m) => m.position === "Department Head");
  const co = dept.members.find((m) => m.position === "Co-Head");
  const rest = dept.members.filter((m) => m !== head && m !== co);

  const statsHtml =
    dept.score != null
      ? `<div><div class="modal-stat-label">DEPARTMENT RANK</div><div class="serif modal-stat-value">#${dept.rank}</div></div>
         <div><div class="modal-stat-label">SCORE</div><div class="serif modal-stat-value">${dept.score}/100</div></div>`
      : "";

  const overlay = document.getElementById("modal-root");
  overlay.innerHTML = `
    <div class="modal-overlay" id="modal-overlay">
      <div class="modal" id="modal-box">
        <button class="modal-close" id="modal-close" aria-label="Close">${icon("x", 18)}</button>
        <div class="modal-header">
          ${sealMedallion(56, "rgba(255,255,255,0.6)", icon(dept.icon, 24, "#fff"))}
          <h3 class="serif modal-title">${dept.name}</h3>
          <p class="modal-desc">${dept.description}</p>
          <div class="modal-stats">
            ${statsHtml}
            <div>
              <div class="modal-stat-label" style="margin-bottom:4px">PERFORMANCE</div>
              ${perfBadge(dept.performance, "sm")}
            </div>
          </div>
        </div>
        <div class="modal-body">
          ${
            head || co
              ? `<h4 class="modal-subhead">LEADERSHIP</h4>
                 <div class="leader-grid" style="grid-template-columns:${co ? "1fr 1fr" : "1fr"}">
                   ${head ? memberCardHtml(head) : ""}${co ? memberCardHtml(co) : ""}
                 </div>`
              : ""
          }
          ${
            rest.length
              ? `<h4 class="modal-subhead">TEAM MEMBERS</h4>
                 <div class="member-grid">${rest.map(memberCardHtml).join("")}</div>`
              : ""
          }
        </div>
      </div>
    </div>`;

  lucide.createIcons();
  document.body.style.overflow = "hidden";

  const close = () => {
    overlay.innerHTML = "";
    document.body.style.overflow = "";
  };
  document.getElementById("modal-close").addEventListener("click", close);
  document.getElementById("modal-overlay").addEventListener("click", (e) => {
    if (e.target.id === "modal-overlay") close();
  });
  document.addEventListener("keydown", function escHandler(e) {
    if (e.key === "Escape") {
      close();
      document.removeEventListener("keydown", escHandler);
    }
  });
}

/* ------------------------------ position section ------------------------------ */
function renderPositions() {
  const grid = document.getElementById("position-grid");
  if (!grid) return;
  grid.innerHTML = POSITION_INFO.map(
    (p) => `
    <div class="position-item reveal">
      ${sealMedallion(50, "var(--gold)", icon(p.icon, 20, "var(--royal)"))}
      <h4>${p.title}</h4>
      <p>${p.text}</p>
    </div>`
  ).join("");
  lucide.createIcons();
  observeReveals(grid);
}

/* ------------------------------- leaderboard ------------------------------- */
function podiumHtml(topMembers) {
  const medalTone = { 1: "var(--gold)", 2: "#9AA3B6", 3: "#B87A3D" };
  const heights = { 1: 168, 2: 128, 3: 108 };
  const byRank = {};
  topMembers.forEach((m) => (byRank[m.rank] = m));
  const order = [byRank[2], byRank[1], byRank[3]].filter(Boolean);

  return order
    .map(
      (m) => `
    <div class="podium-item">
      ${sealMedallion(54, medalTone[m.rank], `<span class="serif" style="font-weight:700;font-size:18px">${m.rank}</span>`)}
      <h4 class="serif podium-name">${m.name}</h4>
      <p class="podium-dept">${m.department}</p>
      <div class="serif podium-score">${m.score}<span>/100</span></div>
      <div class="card podium-plate" style="height:${heights[m.rank]}px">${perfBadge(m.performance, "sm")}</div>
    </div>`
    )
    .join("");
}

function leaderboardRowHtml(m) {
  return `
    <div class="lb-row ${m.rank <= 3 ? "top3" : ""}">
      <span class="serif lb-rank">${m.rank}</span>
      <span class="lb-name">${avatar(m.name, m.photo, 30)}${m.name}</span>
      <span class="lb-dept">${m.department}</span>
      <span class="lb-position">${m.position}</span>
      ${perfBadge(m.performance, "sm")}
      <span class="serif lb-score">${m.score}</span>
    </div>`;
}

function renderLeaderboard(rankedMembers) {
  const podium = document.getElementById("leaderboard-podium");
  const list = document.getElementById("leaderboard-list");
  if (!podium || !list) return;
  podium.innerHTML = podiumHtml(rankedMembers.slice(0, 3));
  list.innerHTML =
    `<div class="lb-row lb-head"><span>#</span><span>Name</span><span>Department</span><span>Position</span><span>Performance</span><span style="text-align:right">Score</span></div>` +
    rankedMembers.map(leaderboardRowHtml).join("");
  lucide.createIcons();
}

/* -------------------------------- progress -------------------------------- */
function progressCardHtml(dept, index) {
  const isScored = dept.score != null;
  const statusText =
    {
      "event-leads": "Leading the planning and execution.",
      "student-coordinators": "Keeping every department connected.",
      "webpage-developers": "Building the digital experience.",
    }[dept.id] || "Contributing to the celebration.";

  return `
    <div class="card progress-card reveal" data-progress-index="${index}" data-progress-value="${isScored ? dept.score : 0}">
      <div class="progress-head">
        ${sealMedallion(44, "var(--royal)", icon(dept.icon, 19, "var(--royal)"))}
        <div>
          <h4>${dept.name}</h4>
          ${isScored ? `<span class="serif progress-percent">${dept.score}%</span>` : perfBadge(dept.performance, "sm")}
        </div>
      </div>
      ${isScored ? `<div class="progress-track"><div class="progress-fill" id="progress-fill-${index}"></div></div>` : ""}
      <p class="progress-status">${statusText}</p>
    </div>`;
}

function renderProgress(rankedDepts) {
  const grid = document.getElementById("progress-grid");
  if (!grid) return;
  grid.innerHTML = rankedDepts.map((d, i) => progressCardHtml(d, i)).join("");
  lucide.createIcons();
  observeReveals(grid);

  rankedDepts.forEach((d, i) => {
    if (d.score == null) return;
    const fill = document.getElementById(`progress-fill-${i}`);
    if (!fill) return;
    setTimeout(() => { fill.style.width = `${d.score}%`; }, 300 + i * 100);
  });
}

/* --------------------------------- footer ---------------------------------- */
function renderFooter() {
  const school = document.getElementById("footer-school");
  const sub = document.getElementById("footer-sub");
  const tagline = document.getElementById("footer-tagline");
  if (!school || !sub || !tagline) return;
  school.textContent = SCHOOL.name;
  sub.textContent = `${SCHOOL.shortName} · ${EVENT.name}`;
  tagline.textContent = EVENT.tagline;
}

/* ---------------------------------- init ------------------------------------ */
let DAILY_RECORDS = [];
let ADMIN_SESSION = window.AUTH_SESSION || null;

function recordMemberKey(name) { return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""); }
function adminHeaders() { return { ...authHeaders(), Authorization: `Bearer ${ADMIN_SESSION?.access_token || window.AUTH_SESSION?.access_token || SUPABASE_PUBLISHABLE_KEY}` }; }
function scorePerformance(score) { return score >= 95 ? "Excellent" : score >= 88 ? "Very Good" : score >= 75 ? "Good" : score >= 60 ? "Improving" : "Needs Improvement"; }
function applyDailyRecords(records) {
  const grouped = {};
  DEPARTMENTS.forEach((dept) => dept.members.forEach((member) => {
    member.score = null;
    member.performance = "Needs Improvement";
  }));
  records.forEach((record) => { (grouped[record.member_key] ||= []).push(Number(record.daily_score)); });
  DEPARTMENTS.forEach((dept) => dept.members.forEach((member) => {
    const values = grouped[recordMemberKey(member.name)];
    if (!values?.length) return;
    member.score = Math.round((values.reduce((sum, value) => sum + value, 0) / values.length) * 10) / 10;
    member.performance = scorePerformance(member.score);
  }));
}

async function fetchDailyRecords() {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_performance?select=member_key,daily_score,performance_date,attendance,remarks,member_name,department_id,department_name&order=performance_date.asc`, { headers: adminHeaders() });
  if (!response.ok) throw new Error("Daily performance records could not be loaded.");
  DAILY_RECORDS = await response.json();
  applyDailyRecords(DAILY_RECORDS);
}

async function initRegistration() {
  const form = document.getElementById("registration-form");
  if (!form) return;
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    const status = document.getElementById("registration-status");
    const photo = document.getElementById("registration-photo").files[0];
    if (!photo || photo.size > 5 * 1024 * 1024) { status.textContent = "Choose an image smaller than 5 MB."; return; }
    const headers = authHeaders();
    try {
      status.textContent = "Submitting...";
      const path = `${Date.now()}-${photo.name.toLowerCase().replace(/[^a-z0-9.]+/g, "-")}`;
      const upload = await fetch(`${SUPABASE_URL}/storage/v1/object/member-photos/${path}`, { method: "POST", headers: { ...headers, "Content-Type": photo.type }, body: photo });
      if (!upload.ok) throw new Error("Photo upload failed. Run the Supabase setup SQL.");
      const save = await fetch(`${SUPABASE_URL}/rest/v1/registrations`, { method: "POST", headers: { ...headers, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ name: document.getElementById("registration-name").value.trim(), phone: document.getElementById("registration-phone").value.trim(), email: document.getElementById("registration-email").value.trim(), photo_url: `${SUPABASE_URL}/storage/v1/object/public/member-photos/${path}` }) });
      if (!save.ok) throw new Error("Registration could not be saved.");
      form.reset(); status.textContent = "Registration submitted successfully."; loadRegisteredMembers();
    } catch (error) { status.textContent = error.message; }
  });
}

async function loadRegisteredMembers() {
  const grid = document.getElementById("registered-members-grid");
  if (!grid) return;
  try {
    const response = await fetch(`${SUPABASE_URL}/rest/v1/registered_members?select=id,name,photo_url&order=created_at.desc`, { headers: authHeaders() });
    const members = await response.json();
    grid.innerHTML = response.ok && members.length ? members.map((member) => `<article class="registered-member card">${avatar(member.name, member.photo_url, 76)}<div><h3 class="serif registered-member-name">${member.name}</h3><p class="registered-member-label">Registered alumni</p></div></article>`).join("") : `<p class="registered-members-message">No alumni registrations yet.</p>`;
  } catch (error) { grid.innerHTML = `<p class="registered-members-message">Registered members unavailable.</p>`; }
}

async function initAttendance() {
  const form = document.getElementById("admin-login-form");
  if (!form) return;
  const status = document.getElementById("admin-login-status");
  const content = document.getElementById("admin-only-content");
  const rows = document.getElementById("attendance-rows");
  const date = document.getElementById("performance-date");
  date.value = new Date().toISOString().slice(0, 10);
  try { await fetchDailyRecords(); } catch (error) { status.textContent = "Run supabase-setup.sql first."; }
  const team = () => DEPARTMENTS.flatMap((dept) => dept.members.map((member) => ({ ...member, departmentId: dept.id, departmentName: dept.name })));
  const renderRows = () => { const today = DAILY_RECORDS.filter((record) => record.performance_date === date.value); const byKey = Object.fromEntries(today.map((record) => [record.member_key, record])); rows.innerHTML = team().map((member) => { const key = recordMemberKey(member.name); const record = byKey[key]; return `<tr data-member-key="${key}"><td><strong>${member.name}</strong><small>${member.departmentName}</small></td><td><input class="member-attendance" type="checkbox" ${record?.attendance ? "checked" : ""} /></td><td><input class="member-daily-score" type="number" min="0" max="100" step="0.1" value="${record?.daily_score ?? member.score ?? 0}" /></td><td><input class="member-remarks" maxlength="240" value="${record?.remarks || ""}" placeholder="Optional" /></td></tr>`; }).join(""); };
  renderRows();
  form.addEventListener("submit", async (event) => { event.preventDefault(); status.textContent = "Signing in..."; try { const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email: document.getElementById("admin-email").value.trim(), password: document.getElementById("admin-password").value }) }); const data = await response.json(); if (!response.ok) throw new Error(data.error_description || "Invalid login."); const allowed = await fetch(`${SUPABASE_URL}/rest/v1/admin_users?select=user_id&user_id=eq.${data.user.id}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${data.access_token}` } }); if (!allowed.ok || !(await allowed.json()).length) throw new Error("This account is not an approved admin."); ADMIN_SESSION = { access_token: data.access_token, user: data.user }; form.hidden = true; content.hidden = false; document.getElementById("admin-session-label").textContent = data.user.email; } catch (error) { status.textContent = error.message; } });
  document.getElementById("admin-logout").addEventListener("click", () => { ADMIN_SESSION = null; form.hidden = false; content.hidden = true; form.reset(); });
  date.addEventListener("change", renderRows);
  document.getElementById("save-performance").addEventListener("click", async () => { const updates = [...rows.querySelectorAll("tr")].map((row) => { const member = team().find((item) => recordMemberKey(item.name) === row.dataset.memberKey); return { member_key: row.dataset.memberKey, member_id: row.dataset.memberKey, member_name: member.name, department_id: member.departmentId, department_name: member.departmentName, performance_date: date.value, attendance: row.querySelector(".member-attendance").checked, daily_score: Number(row.querySelector(".member-daily-score").value), remarks: row.querySelector(".member-remarks").value.trim() || null }; }); try { const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_performance?on_conflict=member_key,performance_date`, { method: "POST", headers: { ...adminHeaders(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(updates) }); if (!response.ok) throw new Error("Daily update could not be saved."); await fetchDailyRecords(); const ranked = computeRankedDepartments(); ALL_RANKED_DEPTS = ranked; renderDepartments(ranked); renderLeaderboard(computeRankedMembers(ranked)); renderProgress(ranked); document.getElementById("attendance-status").textContent = "Saved and current performance updated."; } catch (error) { document.getElementById("attendance-status").textContent = error.message; } });
}

function allDailyMembers() {
  return DEPARTMENTS.flatMap((department) => department.members.map((member) => ({
    ...member,
    memberKey: recordMemberKey(member.name),
    departmentId: department.id,
    departmentName: department.name,
  })));
}

function renderFreshDailyRows(records, date, loading = false) {
  const rows = document.getElementById("attendance-rows");
  if (loading) {
    rows.innerHTML = `<tr><td colspan="4">Checking saved records for ${date}...</td></tr>`;
    return;
  }
  const savedByMember = Object.fromEntries(records.map((record) => [record.member_key, record]));
  rows.innerHTML = allDailyMembers().map((member) => {
    const saved = savedByMember[member.memberKey];
    return `<tr data-member-key="${member.memberKey}">
      <td><strong>${member.name}</strong><small>${member.departmentName}</small></td>
      <td><input class="member-attendance" type="checkbox" ${saved?.attendance === true ? "checked" : ""} /></td>
      <td><input class="member-daily-score" type="number" min="0" max="100" step="0.1" value="${saved ? Number(saved.daily_score) : 0}" /></td>
      <td><input class="member-remarks" maxlength="240" value="${saved?.remarks || ""}" placeholder="Optional" /></td>
    </tr>`;
  }).join("");
}

async function fetchRecordsForDate(date) {
  const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_performance?select=member_key,attendance,daily_score,remarks&performance_date=eq.${encodeURIComponent(date)}&order=member_key.asc`, { headers: adminHeaders() });
  if (!response.ok) throw new Error("Could not check saved records for this date.");
  return response.json();
}

async function initDailyUpdate() {
  const form = document.getElementById("admin-login-form");
  if (!form) return;
  if (window.AUTH_PROFILE?.role !== "admin") return;
  const loginStatus = document.getElementById("admin-login-status");
  const content = document.getElementById("admin-only-content");
  const rows = document.getElementById("attendance-rows");
  const dateInput = document.getElementById("performance-date");
  const status = document.getElementById("attendance-status");
  dateInput.value = new Date().toISOString().slice(0, 10);
  form.hidden = true;
  content.hidden = false;
  document.getElementById("admin-session-label").textContent = window.AUTH_PROFILE.email || window.AUTH_USER.email;

  const loadSelectedDate = async () => {
    renderFreshDailyRows([], dateInput.value, true);
    status.textContent = "Checking saved records...";
    try {
      const records = await fetchRecordsForDate(dateInput.value);
      renderFreshDailyRows(records, dateInput.value);
      status.textContent = records.length ? "Saved entry loaded." : "New entry - not saved yet.";
      status.className = `attendance-status${records.length ? "" : " pending"}`;
    } catch (error) {
      renderFreshDailyRows([], dateInput.value);
      status.textContent = error.message;
      status.className = "attendance-status error";
    }
  };

  await loadSelectedDate();
  dateInput.addEventListener("change", loadSelectedDate);

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    loginStatus.textContent = "Signing in...";
    try {
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, { method: "POST", headers: { apikey: SUPABASE_PUBLISHABLE_KEY, "Content-Type": "application/json" }, body: JSON.stringify({ email: document.getElementById("admin-email").value.trim(), password: document.getElementById("admin-password").value }) });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(data.error_description || data.msg || "Invalid login.");
      const allowed = await fetch(`${SUPABASE_URL}/rest/v1/admin_users?select=user_id&user_id=eq.${encodeURIComponent(data.user.id)}`, { headers: { apikey: SUPABASE_PUBLISHABLE_KEY, Authorization: `Bearer ${data.access_token}` } });
      if (!allowed.ok || !(await allowed.json()).length) throw new Error("This account is not an approved admin.");
      ADMIN_SESSION = { access_token: data.access_token, user: data.user };
      form.hidden = true;
      content.hidden = false;
      document.getElementById("admin-session-label").textContent = data.user.email;
      await loadSelectedDate();
    } catch (error) {
      loginStatus.textContent = error.message;
      loginStatus.className = "attendance-status error";
    }
  });

  document.getElementById("admin-logout").addEventListener("click", () => {
    ADMIN_SESSION = null;
    form.hidden = false;
    content.hidden = true;
    form.reset();
  });

  document.getElementById("save-performance").addEventListener("click", async () => {
    const members = allDailyMembers();
    const updates = [...rows.querySelectorAll("tr[data-member-key]")].map((row) => {
      const member = members.find((item) => item.memberKey === row.dataset.memberKey);
      return { member_key: member.memberKey, member_id: member.memberKey, member_name: member.name, department_id: member.departmentId, department_name: member.departmentName, performance_date: dateInput.value, attendance: row.querySelector(".member-attendance").checked, daily_score: Number(row.querySelector(".member-daily-score").value) || 0, remarks: row.querySelector(".member-remarks").value.trim() || null };
    });
    try {
      status.textContent = "Saving daily update...";
      const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_performance?on_conflict=member_key,performance_date`, { method: "POST", headers: { ...adminHeaders(), "Content-Type": "application/json", Prefer: "resolution=merge-duplicates,return=minimal" }, body: JSON.stringify(updates) });
      if (!response.ok) { const error = await response.json().catch(() => ({})); throw new Error(error.message || "Daily update could not be saved."); }
      await fetchDailyRecords();
      const ranked = computeRankedDepartments();
      ALL_RANKED_DEPTS = ranked;
      renderDepartments(ranked);
      renderLeaderboard(computeRankedMembers(ranked));
      renderProgress(ranked);
      await loadSelectedDate();
      renderPublicAttendance();
      status.textContent = "Daily update saved successfully";
      status.className = "attendance-status success";
    } catch (error) {
      status.textContent = error.message;
      status.className = "attendance-status error";
    }
  });
}

function renderPublicAttendance() {
  const select = document.getElementById("public-attendance-date");
  const content = document.getElementById("public-attendance-content");
  if (!select || !content) return;
  const dates = [...new Set(DAILY_RECORDS.map((record) => record.performance_date))].sort().reverse();
  const selected = select.value || dates[0] || "";
  select.value = selected;
  const department = document.getElementById("public-attendance-department").value;
  const query = document.getElementById("public-attendance-search").value.trim().toLowerCase();
  const records = DAILY_RECORDS.filter((record) => record.performance_date === selected && (department === "all" || record.department_id === department) && record.member_name.toLowerCase().includes(query));
  const summary = document.getElementById("attendance-summary");
  if (!selected || !DAILY_RECORDS.some((record) => record.performance_date === selected)) {
    summary.innerHTML = "";
    content.innerHTML = `<p class="attendance-empty">No attendance record available for the selected date.</p>`;
    return;
  }
  const allDateRecords = DAILY_RECORDS.filter((record) => record.performance_date === selected);
  const present = allDateRecords.filter((record) => record.attendance).length;
  summary.innerHTML = `<span>Present <strong>${present}</strong></span><span>Absent <strong>${allDateRecords.length - present}</strong></span><span>Total <strong>${allDateRecords.length}</strong></span>`;
  content.innerHTML = records.length ? `<div class="public-attendance-list">${records.map((record) => `<div class="public-attendance-row"><span>${record.member_name}<small>${record.department_name}</small></span><strong class="attendance-status-pill ${record.attendance ? "present" : "absent"}">${record.attendance ? "Present" : "Absent"}</strong></div>`).join("")}</div>` : `<p class="attendance-empty">No members match your filters.</p>`;
}

function initPublicAttendance() {
  const department = document.getElementById("public-attendance-department");
  if (!department) return;
  department.innerHTML = `<option value="all">All departments</option>${DEPARTMENTS.map((item) => `<option value="${item.id}">${item.name}</option>`).join("")}`;
  document.getElementById("public-attendance-date").addEventListener("change", renderPublicAttendance);
  document.getElementById("public-attendance-search").addEventListener("input", renderPublicAttendance);
  department.addEventListener("change", renderPublicAttendance);
  renderPublicAttendance();
}

async function init() {
  if (window.AUTH_READY && !(await window.AUTH_READY)) return;
  const needsDailyRecords = document.getElementById("dept-grid") || document.getElementById("public-attendance-date");
  if (needsDailyRecords) {
    try { await fetchDailyRecords(); } catch (error) { DAILY_RECORDS = []; }
  }
  const rankedDepts = computeRankedDepartments();
  ALL_RANKED_DEPTS = rankedDepts;
  const rankedMembers = computeRankedMembers(rankedDepts);

  initNavbar();
  renderHero(rankedDepts, rankedMembers);
  renderAbout();
  initDepartmentFilters(rankedDepts);
  renderPositions();
  renderLeaderboard(rankedMembers);
  renderProgress(rankedDepts);
  renderFooter();
  initRegistration();
  loadRegisteredMembers();
  initDailyUpdate();
  initPublicAttendance();

  lucide.createIcons();
  observeReveals(document);
}

document.addEventListener("DOMContentLoaded", init);
