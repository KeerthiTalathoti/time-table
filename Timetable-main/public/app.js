// Single-page navigation and placeholders for Timetable Optimizer

const sections = ["welcome", "role-select", "admin-dashboard", "faculty-profile", "student-dashboard"]; 

function show(id) {
  sections.forEach(s => {
    const el = document.getElementById(s);
    if (!el) return;
    if (s === id) { el.classList.remove("hidden"); el.classList.add("active"); }
    else { el.classList.add("hidden"); el.classList.remove("active"); }
  });
}

// initial
document.addEventListener("DOMContentLoaded", () => {
  const getStarted = document.getElementById("btn-get-started");
  if (getStarted) getStarted.addEventListener("click", () => show("role-select"));

  const back = document.getElementById("back-to-welcome");
  if (back) back.addEventListener("click", () => show("welcome"));

  // role buttons
  const roleMap = {
    "role-admin": "admin-dashboard",
    "role-faculty": "faculty-profile",
    "role-student": "student-dashboard"
  };
  Object.entries(roleMap).forEach(([btnId, target]) => {
    const btn = document.getElementById(btnId);
    if (btn) btn.addEventListener("click", () => show(target));
  });

  // generic [data-nav] back buttons
  document.querySelectorAll("[data-nav]").forEach(btn => {
    btn.addEventListener("click", e => {
      const t = e.currentTarget.getAttribute("data-nav");
      show(t);
    });
  });
});


