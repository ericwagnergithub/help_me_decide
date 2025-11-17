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
  if (stored) return stored;

  const prefersDark = window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;

  return prefersDark ? "dark" : "light";
}

function initTheme() {
  applyTheme(getInitialTheme());

  const toggle = document.getElementById("themeToggle");
  toggle.onclick = () => {
    const next = document.body.classList.contains("theme-dark")
      ? "light"
      : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  };
}

if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", initTheme);
} else {
  initTheme();
}

/* ---------- NAVIGATION ---------- */

function hideAllSections() {
  ["landingSection", "customSection", "decisionSection"].forEach(id => {
    const el = document.getElementById(id);
    if (el) el.style.display = "none";
  });
}

function showChangeListButton(show) {
  document.getElementById("changeListButton").style.display =
    show ? "inline-block" : "none";
}

function backToLanding() {
  hideAllSections();
  document.getElementById("landingSection").style.display = "block";
  showChangeListButton(false);
  document.body.classList.add("landing-active");
  window.scrollTo({ top: 0 });
}

function goToCustom() {
  hideAllSections();
  document.getElementById("customSection").style.display = "block";
  showChangeListButton(true);
  document.body.classList.remove("landing-active");
  window.scrollTo({ top: 0 });
}

function goToDecision() {
  hideAllSections();
  document.getElementById("decisionSection").style.display = "block";
  showChangeListButton(true);

  const title = document.getElementById("decisionTitle");
  title.textContent = currentPresetName
    ? `Ranking: ${currentPresetName}`
    : "Ranking";

  window.scrollTo({ top: 0 });
}

/* ---------- PRESETS ---------- */

function startPreset(key) {
  const presets = window.PRESETS || {};
  const list = presets[key];

  const names = {
    restaurants: "Restaurant Types",
    babyNames: "Baby Names",
    movies: "Movies",
    travel: "Travel Destinations",
    ghibli: "Studio Ghibli Movies"
  };

  currentPresetName = names[key] || "Preset";

  goToDecision();
  startComparisonFromList(list);
}

/* ---------- CUSTOM LIST ---------- */

function startCustomComparison() {
  const raw = document.getElementById("customListInput").value;
  const lines = raw.split("\n").map(x => x.trim()).filter(Boolean);

  if (lines.length < 2) {
    alert("Please enter at least 2 options.");
    return;
  }

  currentPresetName = "Custom List";
  goToDecision();
  startComparisonFromList(lines);
}

function loadExample() {
  document.getElementById("customListInput").value =
    "Pizza Palace\nSushi World\nBurger Town\nTaco Fiesta\nRamen House";
}

/* ---------- COMPARISON ---------- */

function startComparisonFromList(list) {
  const unique = [...new Set(list.map(x => x.trim()))];

  items = unique.map((name, id) => ({ id, name, wins: 0 }));
  pairs = [];

  for (let i = 0; i < items.length; i++) {
    for (let j = i + 1; j < items.length; j++) {
      pairs.push([i, j]);
    }
  }

  for (let i = pairs.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [pairs[i], pairs[j]] = [pairs[j], pairs[i]];
  }

  pairIndex = 0;

  document.getElementById("itemsCountLabel").textContent =
    `${items.length} options`;

  showCurrentPair();
  updateProgress();
  updateRanking();
}

function showCurrentPair() {
  const A = document.getElementById("optionAName");
  const B = document.getElementById("optionBName");
  const btnA = document.getElementById("optionAButton");
  const btnB = document.getElementById("optionBButton");

  if (pairIndex >= pairs.length) {
    A.textContent = "Finished!";
    B.textContent = "All comparisons done.";
    btnA.disabled = true;
    btnB.disabled = true;
    return;
  }

  const [i, j] = pairs[pairIndex];
  A.textContent = items[i].name;
  B.textContent = items[j].name;
  btnA.disabled = false;
  btnB.disabled = false;
}

function choose(choice) {
  const [i, j] = pairs[pairIndex];
  if (choice === "A") items[i].wins++;
  else items[j].wins++;

  pairIndex++;
  updateProgress();
  updateRanking();
  showCurrentPair();
}

/* ---------- PROGRESS ---------- */

function updateProgress() {
  const total = pairs.length;
  const done = Math.min(pairIndex, total);

  document.getElementById("progressLabel").textContent =
    `Compared ${done} of ${total} pairs`;
  document.getElementById("progressBar").style.width =
    (done / total) * 100 + "%";
}

/* ---------- RANKING ---------- */

function updateRanking() {
  const container = document.getElementById("rankingContainer");

  const sorted = [...items].sort(
    (a, b) => b.wins - a.wins || a.name.localeCompare(b.name)
  );

  let html = "<table><thead><tr><th>#</th><th>Option</th><th>Wins</th></tr></thead><tbody>";

  sorted.forEach((item, idx) => {
    html += `<tr>
      <td>${idx + 1}</td>
      <td>${item.name}</td>
      <td>${item.wins}</td>
    </tr>`;
  });

  html += "</tbody></table>";

  container.innerHTML = html;
}
