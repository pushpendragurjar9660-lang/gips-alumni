let analyticsRecords = [];
let analyticsChart = null;
let chartLoadPromise;

function ensureChartLoaded() {
  if (window.Chart) return Promise.resolve();
  if (chartLoadPromise) return chartLoadPromise;
  chartLoadPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = "https://cdn.jsdelivr.net/npm/chart.js@4.4.4/dist/chart.umd.min.js";
    script.async = true;
    script.onload = resolve;
    script.onerror = () => reject(new Error("Performance chart could not be loaded."));
    document.head.appendChild(script);
  });
  return chartLoadPromise;
}

function analyticsKey(name) {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

function analyticsIcon(name, size = 18) {
  return `<i data-lucide="${name}" style="width:${size}px;height:${size}px"></i>`;
}

function analyticsAvatar(member) {
  if (member.photo) return `<img class="analytics-avatar" src="${member.photo}" alt="${member.name}" />`;
  return `<span class="analytics-initials">${member.name.split(" ").map((part) => part[0]).join("").slice(0, 3).toUpperCase()}</span>`;
}

function recordsForMember(member, from = "", to = "") {
  return analyticsRecords
    .filter((record) => record.member_key === analyticsKey(member.name))
    .filter((record) => (!from || record.performance_date >= from) && (!to || record.performance_date <= to))
    .sort((a, b) => a.performance_date.localeCompare(b.performance_date));
}

function renderAnalyticsDepartments() {
  const departments = document.getElementById("analytics-departments");
  const members = document.getElementById("analytics-members");
  const dashboard = document.getElementById("member-dashboard");
  departments.hidden = false;
  members.hidden = true;
  dashboard.hidden = true;
  departments.innerHTML = DEPARTMENTS.map((department) => `<button class="analytics-department card" type="button" data-analytics-department="${department.id}"><span class="analytics-dept-icon">${analyticsIcon(department.icon, 22)}</span><span><strong>${department.name}</strong><small>${department.members.length} members</small></span>${analyticsIcon("chevron-right", 18)}</button>`).join("");
  departments.querySelectorAll("[data-analytics-department]").forEach((button) => button.addEventListener("click", () => renderAnalyticsMembers(DEPARTMENTS.find((department) => department.id === button.dataset.analyticsDepartment))));
  lucide.createIcons();
}

function renderAnalyticsMembers(department, query = "") {
  const departments = document.getElementById("analytics-departments");
  const members = document.getElementById("analytics-members");
  const dashboard = document.getElementById("member-dashboard");
  departments.hidden = true;
  dashboard.hidden = true;
  members.hidden = false;
  const filtered = department.members.filter((member) => member.name.toLowerCase().includes(query.trim().toLowerCase()));
  members.innerHTML = `<button class="analytics-back" type="button">${analyticsIcon("arrow-left", 16)} All departments</button><h3 class="serif analytics-heading">${department.name}</h3><label class="analytics-member-search">${analyticsIcon("search", 17)}<input id="analytics-member-search-input" type="search" placeholder="Search members in ${department.name}" value="${query.replace(/"/g, "&quot;")}" /></label>${filtered.length ? filtered.map((member) => { const records = recordsForMember(member); const average = records.length ? (records.reduce((sum, record) => sum + Number(record.daily_score), 0) / records.length).toFixed(1) : "No saved score"; return `<button class="analytics-member card" type="button" data-analytics-member="${analyticsKey(member.name)}"><span>${analyticsAvatar(member)}</span><span><strong>${member.name}</strong><small>${records.length} saved days · Average ${records.length ? `${average}/100` : average}</small></span>${analyticsIcon("chevron-right", 18)}</button>`; }).join("") : `<p class="analytics-no-results">No members match this search.</p>`}`;
  members.querySelector(".analytics-back").addEventListener("click", renderAnalyticsDepartments);
  const search = document.getElementById("analytics-member-search-input");
  search?.addEventListener("input", () => { const value = search.value; renderAnalyticsMembers(department, value); const next = document.getElementById("analytics-member-search-input"); next.focus(); next.setSelectionRange(value.length, value.length); });
  members.querySelectorAll("[data-analytics-member]").forEach((button) => button.addEventListener("click", () => renderMemberDashboard(department.members.find((member) => analyticsKey(member.name) === button.dataset.analyticsMember), department)));
  lucide.createIcons();
}

async function renderMemberDashboard(member, department, range = "all", customFrom = "", customTo = "") {
  const departments = document.getElementById("analytics-departments");
  const members = document.getElementById("analytics-members");
  const dashboard = document.getElementById("member-dashboard");
  departments.hidden = true;
  members.hidden = true;
  dashboard.hidden = false;
  const today = new Date();
  const to = customTo || today.toISOString().slice(0, 10);
  const from = range === "7" ? new Date(today.getTime() - 6 * 86400000).toISOString().slice(0, 10) : range === "30" ? new Date(today.getTime() - 29 * 86400000).toISOString().slice(0, 10) : range === "custom" ? customFrom : "";
  const records = recordsForMember(member, from, range === "all" ? "" : to);
  const scores = records.map((record) => Number(record.daily_score));
  const average = scores.length ? (scores.reduce((sum, score) => sum + score, 0) / scores.length).toFixed(1) : "0";
  const attendance = records.length ? Math.round(records.filter((record) => record.attendance).length / records.length * 100) : 0;
  const trend = scores.length > 1 ? scores.at(-1) - scores[0] > 1 ? "Increasing" : scores[0] - scores.at(-1) > 1 ? "Decreasing" : "Consistent" : "Not enough data";
  dashboard.innerHTML = `<button class="analytics-back" type="button">${analyticsIcon("arrow-left", 16)} Back to ${department.name}</button><div class="dashboard-heading">${analyticsAvatar(member)}<div><h3 class="serif analytics-heading">${member.name}</h3><p>${department.name}</p></div></div><div class="dashboard-filters"><label>Range<select id="analytics-range"><option value="all" ${range === "all" ? "selected" : ""}>All time</option><option value="7" ${range === "7" ? "selected" : ""}>Last 7 days</option><option value="30" ${range === "30" ? "selected" : ""}>Last 30 days</option><option value="custom" ${range === "custom" ? "selected" : ""}>Custom</option></select></label><label>From<input id="analytics-from" type="date" value="${customFrom}" /></label><label>To<input id="analytics-to" type="date" value="${customTo}" /></label></div><div class="dashboard-stats"><div class="card"><strong>${average}</strong><span>Average</span></div><div class="card"><strong>${records.length}</strong><span>Days recorded</span></div><div class="card"><strong>${scores.length ? Math.max(...scores) : 0}</strong><span>Highest</span></div><div class="card"><strong>${scores.length ? Math.min(...scores) : 0}</strong><span>Lowest</span></div><div class="card"><strong>${attendance}%</strong><span>Attendance</span></div><div class="card"><strong>${trend}</strong><span>Trend</span></div></div><div class="performance-chart card"><canvas id="member-chart"></canvas></div>`;
  dashboard.querySelector(".analytics-back").addEventListener("click", () => renderAnalyticsMembers(department));
  const update = () => renderMemberDashboard(member, department, document.getElementById("analytics-range").value, document.getElementById("analytics-from").value, document.getElementById("analytics-to").value);
  document.getElementById("analytics-range").addEventListener("change", update);
  document.getElementById("analytics-from").addEventListener("change", update);
  document.getElementById("analytics-to").addEventListener("change", update);
  try {
    await ensureChartLoaded();
    analyticsChart?.destroy();
    analyticsChart = new Chart(document.getElementById("member-chart"), { type: "line", data: { labels: records.map((record) => record.performance_date), datasets: [{ label: "Saved daily score", data: scores, borderColor: "#1E3A8A", backgroundColor: "rgba(30,58,138,.12)", fill: true, tension: .3, pointRadius: 5 }] }, options: { responsive: true, maintainAspectRatio: false, scales: { y: { min: 0, max: 100, title: { display: true, text: "Score / 100" } }, x: { title: { display: true, text: "Saved date" } } }, plugins: { tooltip: { callbacks: { label: (context) => `Saved score: ${context.parsed.y}/100` } } } } });
  } catch (error) {
    const chart = document.getElementById("member-chart");
    if (chart) chart.replaceWith(Object.assign(document.createElement("p"), { textContent: error.message }));
  }
  lucide.createIcons();
}

async function initAnalyticsModal() {
  const modal = document.getElementById("analytics");
  if (!modal) return;
  if (window.AUTH_READY && !(await window.AUTH_READY)) return;

  const isStandalonePage = window.location.pathname.split("/").pop() === "analytics.html";
  const openAnalytics = async () => {
    modal.classList.add("analytics-modal-open");
    document.body.style.overflow = "";
    try {
      const response = await fetch(`${SUPABASE_URL}/rest/v1/daily_performance?select=member_key,performance_date,daily_score,attendance&order=performance_date.asc`, { headers: authHeaders() });
      analyticsRecords = response.ok ? await response.json() : [];
    } catch (error) {
      analyticsRecords = [];
    }
    renderAnalyticsDepartments();
  };

  if (isStandalonePage) {
    void openAnalytics();
    return;
  }

  document.querySelectorAll('[data-nav="analytics"]').forEach((button) => button.addEventListener("click", async () => {
    await openAnalytics();
  }));
  document.getElementById("analytics-modal-close")?.addEventListener("click", () => { modal.classList.remove("analytics-modal-open"); document.body.style.overflow = ""; analyticsChart?.destroy(); });
  modal.addEventListener("click", (event) => { if (event.target === modal) { modal.classList.remove("analytics-modal-open"); document.body.style.overflow = ""; analyticsChart?.destroy(); } });
}

document.addEventListener("DOMContentLoaded", initAnalyticsModal);
