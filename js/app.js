let items = [];
let pairs = [];
let pairIndex = 0;
let currentPresetName = null;

const THEME_KEY = "hmd-theme";

/* ---------- THEME ---------- */

function applyTheme(theme) {
  document.body.classList.remove("theme-light", "theme-dark");
  document.body.classList.add(theme === "dark" ? "theme-dark" : "theme-light");
}

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") return stored;

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function initTheme() {
  applyTheme(getInitialTheme());

  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("theme-dark");
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}

/* ---------- NAVIGATION ---------- */

function hideAllSections() {
  ["landingSection", "customSection", "decisionSection"].forEach((id) => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function showChangeListButton(show) {
  const btn = document.getElementById("changeListButton");
  if (!btn) return;
  btn.style.display = show ? "inline-block" : "none";
}

function backToLanding() {
  hideAllSections();
  const landing = document.getElementById("landingSection");
  if (landing) landing.style.display = "block";
  document.body.classList.add("landing-active");
  showChangeListButton(false);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function goToCustom() {
  hideAllSections();
  const custom = document.getElementById("customSection");
  if (custom) custom.style.display = "block";
  document.body.classList.remove("landing-active");
  showChangeListButton(true);
  window.scrollTo({ top: 0, behavior: "instant" });
}

function goToDecision() {
  hideAllSections();
  const decision = document.getElementById("decisionSection");
  if (decision) decision.style.display = "block";
  document.body.classList.remove("landing-active");
  showChangeListButton(true);

  const title = document.getElementById("decisionTitle");
  if (title) {
    title.textContent = currentPresetName
      ? `Ranking: ${currentPresetName}`
      : "Ranking";
  }

  window.scrollTo({ top: 0, behavior: "instant" });
}

/* ---------- PRESETS ---------- */

function startPreset(key) {
  const presets = window.PRESETS || {};
  const preset = presets[key];

  if (!preset || !preset.length) {
    alert("That preset is not available yet.");
    return;
  }

  const names = {
    restaurants: "Restaurant Types",
    babyNames: "Baby Names",
    movies: "Movies",
    travel: "Travel Destinations",
    ghibli: "Studio Ghibli Movies",
  };

  currentPresetName = names[key] || "Preset";

  goToDecision();
  startComparisonFromList(preset);
}

/* ---------- CUSTOM LIST ---------- */

function startCustomComparison() {
  const rawText = document.getElementById("customListInput").value || "";
  const lines = rawText
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (lines.length < 2) {
    alert("Please enter at least 2 options.");
    return;
  }

  currentPresetName = "Custom List";
  goToDecision();
  startComparisonFromList(lines);
}

function loadExample() {
  const example = [
    "Pizza Palace",
    "Sushi World",
    "Burger Town",
    "Taco Fiesta",
    "Indian Delight",
    "Ramen House",
    "BBQ Shack",
  ].join("\n");

  document.getElementById("customListInput").value = example;
}

/* ---------- COMPARISON LOGIC ---------- */

function startComparisonFromList(rawLines) {
  const uniqueNames = Array.from(
    new Set(rawLines.map((s) => String(s).trim()).filter(Boolean))
  );

  if (uniqueNames.length < 2) {
    alert("Need at least 2 distinct options.");
    return;
  }

  items = uniqueNames.map((name, idx) => ({
    id: idx,
    name,
    wins: 0,
  }));

  pairs = [];
  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([i, j]);
    }
  }

  // Shuffle pairs
  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  pairIndex = 0;

  const countLabel = document.getElementById("itemsCountLabel");
  if (countLabel) {
    countLabel.textContent = `${items.length} options`;
  }

  showCurrentPair();
  updateProgress();
  updateRanking();
}

function showCurrentPair() {
  const optionAName = document.getElementById("optionAName");
  const optionBName = document.getElementById("optionBName");
  const btnA = document.getElementById("optionAButton");
  const btnB = document.getElementById("optionBButton");

  if (!optionAName || !optionBName || !btnA || !btnB) return;

  if (pairIndex >= pairs.length) {
    optionAName.textContent = "Finished!";
    optionBName.textContent = "All comparisons done.";
    btnA.disabled = true;
    btnB.disabled = true;
    return;
  }

  const [i, j] = pairs[pairIndex];
  optionAName.textContent = items[i].name;
  optionBName.textContent = items[j].name;
  btnA.disabled = false;
  btnB.disabled = false;
}

function choose(choice) {
  if (pairIndex >= pairs.length) return;

  const [i, j] = pairs[pairIndex];
  if (choice === "A") {
    items[i].wins += 1;
  } else if (choice === "B") {
    items[j].wins += 1;
  }

  pairIndex += 1;
  updateProgress();
  updateRanking();
  showCurrentPair();
}

/* ---------- PROGRESS & RANKING ---------- */

function updateProgress() {
  const total = pairs.length;
  const done = Math.min(pairIndex, total);
  const progressLabel = document.getElementById("progressLabel");
  const progressBar = document.getElementById("progressBar");

  if (!progressLabel || !progressBar) return;

  if (total === 0) {
    progressLabel.textContent = "";
    progressBar.style.width = "0%";
    return;
  }

  const percent = (done / total) * 100;
  progressLabel.textContent = `Compared ${done} of ${total} pairs (${percent.toFixed(
    1
  )}%)`;
  progressBar.style.width = percent + "%";
}

function updateRanking() {
  const container = document.getElementById("rankingContainer");
  if (!container) return;

  const sorted = [...items].sort(
    (a, b) => b.wins - a.wins || a.name.localeCompare(b.name)
  );

  let html =
    "<table><thead><tr><th>#</th><th>Option</th><th>Wins</th></tr></thead><tbody>";

  sorted.forEach((item, idx) => {
    html += `<tr><td>${idx + 1}</td><td>${escapeHtml(
      item.name
    )}</td><td>${item.wins}</td></tr>`;
  });

  html += "</tbody></table>";

  container.classList.remove("empty-state");
  container.innerHTML = html;
}

/* ---------- UTIL ---------- */

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
