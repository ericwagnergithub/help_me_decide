let items = [];   // { id, name, wins }
let pairs = [];   // [i, j]
let pairIndex = 0;

const THEME_KEY = "hmd-theme";

/* ---------- THEME HANDLING ---------- */

function applyTheme(theme) {
  const body = document.body;
  body.classList.remove("theme-light", "theme-dark");

  if (theme === "dark") {
    body.classList.add("theme-dark");
  } else {
    body.classList.add("theme-light");
  }
}

function getInitialTheme() {
  const stored = localStorage.getItem(THEME_KEY);
  if (stored === "light" || stored === "dark") {
    return stored;
  }

  // Fallback: respect OS preference
  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  return prefersDark ? "dark" : "light";
}

function initTheme() {
  const initial = getInitialTheme();
  applyTheme(initial);

  const toggle = document.getElementById("themeToggle");
  if (!toggle) return;

  toggle.addEventListener("click", () => {
    const isDark = document.body.classList.contains("theme-dark");
    const next = isDark ? "light" : "dark";
    applyTheme(next);
    localStorage.setItem(THEME_KEY, next);
  });
}

document.addEventListener("DOMContentLoaded", initTheme);

/* ---------- NAVIGATION / PRESETS ---------- */

function goToMain() {
  document.getElementById("landingSection").style.display = "none";
  document.getElementById("mainSection").style.display = "block";
  document.body.classList.remove("landing-active");
  window.scrollTo({ top: 0, behavior: "instant" });
}

function startPreset(key) {
  const presets = window.PRESETS || {};
  const preset = presets[key];

  if (!preset || !preset.length) {
    alert("That preset is not available yet.");
    return;
  }

  const input = document.getElementById("listInput");
  input.value = preset.join("\n");
  goToMain();
  startComparison();
}

/* ---------- GENERIC EXAMPLE & CLEAR ---------- */

function loadExample() {
  const example = [
    "Pizza Palace",
    "Sushi World",
    "Burger Town",
    "Taco Fiesta",
    "Indian Delight",
    "Ramen House",
    "BBQ Shack"
  ].join("\n");
  document.getElementById("listInput").value = example;
  window.scrollTo({ top: 0, behavior: "smooth" });
}

function clearAll() {
  document.getElementById("listInput").value = "";
  items = [];
  pairs = [];
  pairIndex = 0;
  document.getElementById("comparisonSection").style.display = "none";
}

/* ---------- COMPARISON FLOW ---------- */

function startComparison() {
  const rawLines = document
    .getElementById("listInput")
    .value
    .split("\n")
    .map((s) => s.trim())
    .filter(Boolean);

  if (rawLines.length < 2) {
    alert("Please enter at least 2 options.");
    return;
  }

  const uniqueNames = Array.from(new Set(rawLines));

  items = uniqueNames.map((name, idx) => ({
    id: idx,
    name,
    wins: 0
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

  document.getElementById("itemsCountLabel").textContent =
    items.length + " option" + (items.length === 1 ? "" : "s");

  document.getElementById("comparisonSection").style.display = "block";
  showCurrentPair();
  updateProgress();
  updateRanking();

  setTimeout(() => {
    document
      .getElementById("comparisonSection")
      .scrollIntoView({ behavior: "smooth" });
  }, 50);
}

function showCurrentPair() {
  const optionAName = document.getElementById("optionAName");
  const optionBName = document.getElementById("optionBName");
  const btnA = document.getElementById("optionAButton");
  const btnB = document.getElementById("optionBButton");

  if (pairIndex >= pairs.length) {
    optionAName.textContent = "No more comparisons.";
    optionBName.textContent = "You’re done!";
    btnA.disabled = true;
    btnB.disabled = true;
    btnA.textContent = "Done";
    btnB.textContent = "Done";
    return;
  }

  const [i, j] = pairs[pairIndex];
  optionAName.textContent = items[i].name;
  optionBName.textContent = items[j].name;
  btnA.disabled = false;
  btnB.disabled = false;
  btnA.textContent = "Pick A";
  btnB.textContent = "Pick B";
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
  const remaining = Math.max(total - done, 0);

  const progressLabel = document.getElementById("progressLabel");
  const progressBar = document.getElementById("progressBar");

  if (total === 0) {
    progressLabel.textContent = "";
    progressBar.style.width = "0%";
    return;
  }

  const percent = (done / total) * 100;
  progressLabel.textContent =
    "Compared " +
    done +
    " of " +
    total +
    " pairs (" +
    percent.toFixed(1) +
    "%), " +
    remaining +
    " left";

  progressBar.style.width = percent + "%";
}

function updateRanking() {
  if (!items.length) return;

  const rankingContainer = document.getElementById("rankingContainer");
  const sorted = [...items].sort(
    (a, b) => b.wins - a.wins || a.name.localeCompare(b.name)
  );

  let html =
    "<table><thead><tr>" +
    "<th>#</th><th>Option</th><th>Wins</th>" +
    "</tr></thead><tbody>";

  sorted.forEach((item, idx) => {
    html +=
      "<tr>" +
      "<td>" +
      (idx + 1) +
      "</td>" +
      "<td>" +
      escapeHtml(item.name) +
      "</td>" +
      "<td>" +
      item.wins +
      "</td>" +
      "</tr>";
  });

  html += "</tbody></table>";

  rankingContainer.classList.remove("empty-state");
  rankingContainer.innerHTML = html;
}

/* ---------- UTIL ---------- */

function escapeHtml(str) {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}
