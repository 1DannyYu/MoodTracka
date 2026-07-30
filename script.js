// Get the page sections so the app can switch between them.
const homePageSection = document.getElementById("homePage");
const themesPageSection = document.getElementById("themesPage");
const moodPageSection = document.getElementById("moodPage");
const statsPageSection = document.getElementById("statsPage");
const pageSections = [homePageSection, themesPageSection, moodPageSection, statsPageSection];

// Show the requested page and hide the others.
function showPage(pageName) {
  const targetPageId = `${pageName}Page`;

  pageSections.forEach(page => {
    page.classList.toggle("active", page.id === targetPageId);
  });

  if (pageName === "stats") {
    updateMoodStats();
    renderStatsChart();
  }
}

// Read the visible label from a card so the console output is easier to follow.
function getButtonLabel(button) {
  return button.querySelector("h2")?.textContent?.trim() || button.textContent.split("\n")[0].trim();
}

// Handle clicks on the home page cards.
const homePageCards = document.querySelectorAll(".card");

homePageCards.forEach(card => {
  card.addEventListener("click", () => {
    const label = getButtonLabel(card);
    console.log(`${label} button clicked`);

    if (card.dataset.target === "themes") {
      showPage("themes");
    } else if (card.dataset.target === "stats") {
      showPage("stats");
    } else if (card.dataset.target === "mood") {
      showPage("mood");
    }
  });
});

// Let the back button return to the home page.
const backButtons = document.querySelectorAll("[data-action='home']");
backButtons.forEach(button => {
  button.addEventListener("click", () => showPage("home"));
});

// Theme presets and colour picker controls.
const presetThemeButtons = document.querySelectorAll(".preset-card");
const themeColorInputs = {
  bgColor: document.getElementById("bgColor"),
  surfaceColor: document.getElementById("surfaceColor"),
  accentColor: document.getElementById("accentColor"),
  accent2Color: document.getElementById("accent2Color"),
  textColor: document.getElementById("textColor"),
  mutedColor: document.getElementById("mutedColor")
};

const themePresets = {
  "calm-dawn": {
    bg: "#fff7ef",
    surface: "#ffe5d2",
    surfaceStrong: "#f7c9a6",
    text: "#2f2b2a",
    muted: "#8e6b4f",
    accent: "#f39b6d",
    accent2: "#5d8fbe",
    border: "#d8895e",
    glow: "#ff9f43",
    glowSoft: "#ffd28a"
  },
  "forest-breathe": {
    bg: "#f1f8f2",
    surface: "#dfeee0",
    surfaceStrong: "#b8d6bb",
    text: "#203528",
    muted: "#57765f",
    accent: "#4f8f69",
    accent2: "#74b58f",
    border: "#4a7d5a",
    glow: "#84b17a",
    glowSoft: "#c7e3c0"
  },
  "night-sky": {
    bg: "#080b1f",
    surface: "#151b39",
    surfaceStrong: "#24315c",
    text: "#ecf2ff",
    muted: "#7f8eb2",
    accent: "#7c8cff",
    accent2: "#4dc5ff",
    border: "#4d5ea8",
    glow: "#8e7cff",
    glowSoft: "#9bdcff"
  },
  "sunshine-glow": {
    bg: "#fff8e8",
    surface: "#ffe5b8",
    surfaceStrong: "#f1c96c",
    text: "#4f3418",
    muted: "#9d6a2f",
    accent: "#ff8a3d",
    accent2: "#ff5f6d",
    border: "#c96a2f",
    glow: "#ffb347",
    glowSoft: "#ffd9a5"
  }
};

// Apply the selected theme by updating CSS custom properties.
function applyTheme(themeValues) {
  const resolvedTheme = {
    bg: themeValues.bg ?? themeColorInputs.bgColor.value,
    surface: themeValues.surface ?? themeColorInputs.surfaceColor.value,
    surfaceStrong: themeValues.surfaceStrong ?? "#2d3144",
    text: themeValues.text ?? themeColorInputs.textColor.value,
    muted: themeValues.muted ?? themeColorInputs.mutedColor.value,
    accent: themeValues.accent ?? themeColorInputs.accentColor.value,
    accent2: themeValues.accent2 ?? themeColorInputs.accent2Color.value,
    border: themeValues.border ?? themeColorInputs.accentColor.value,
    glow: themeValues.glow ?? "#ff8a2a",
    glowSoft: themeValues.glowSoft ?? "#ffb45c"
  };

  const rootStyles = document.documentElement.style;

  rootStyles.setProperty("--bg", resolvedTheme.bg);
  rootStyles.setProperty("--surface", resolvedTheme.surface);
  rootStyles.setProperty("--surface-strong", resolvedTheme.surfaceStrong);
  rootStyles.setProperty("--text", resolvedTheme.text);
  rootStyles.setProperty("--muted", resolvedTheme.muted);
  rootStyles.setProperty("--accent", resolvedTheme.accent);
  rootStyles.setProperty("--accent-2", resolvedTheme.accent2);
  rootStyles.setProperty("--border", resolvedTheme.border);
  rootStyles.setProperty("--glow", resolvedTheme.glow);
  rootStyles.setProperty("--glow-soft", resolvedTheme.glowSoft);

  // Update the colour pickers so they match the current theme.
  themeColorInputs.bgColor.value = resolvedTheme.bg;
  themeColorInputs.surfaceColor.value = resolvedTheme.surface;
  themeColorInputs.accentColor.value = resolvedTheme.accent;
  themeColorInputs.accent2Color.value = resolvedTheme.accent2;
  themeColorInputs.textColor.value = resolvedTheme.text;
  themeColorInputs.mutedColor.value = resolvedTheme.muted;
}

// Switch to a preset theme when a preset card is clicked.
presetThemeButtons.forEach(button => {
  button.addEventListener("click", () => {
    const selectedTheme = themePresets[button.dataset.theme];
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  });
});

// Update the preview as the user changes any custom colour.
Object.values(themeColorInputs).forEach(input => {
  input.addEventListener("input", () => {
    applyTheme({
      bg: themeColorInputs.bgColor.value,
      surface: themeColorInputs.surfaceColor.value,
      surfaceStrong: "#2d3144",
      text: themeColorInputs.textColor.value,
      muted: themeColorInputs.mutedColor.value,
      accent: themeColorInputs.accentColor.value,
      accent2: themeColorInputs.accent2Color.value,
      border: themeColorInputs.accentColor.value,
      glow: "#ff8a2a",
      glowSoft: "#ffb45c"
    });
  });
});

// Keep the stats view in sync with the entries the user saves.
function getMoodEntries() {
  return JSON.parse(localStorage.getItem("moodEntries") || "[]");
}

function formatMoodLabel(mood) {
  return mood ? mood.charAt(0).toUpperCase() + mood.slice(1) : "—";
}

function getMostCommonMood(entries) {
  if (!entries.length) return "—";

  const counts = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  return formatMoodLabel(Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0]);
}

function getStreak(entries) {
  if (!entries.length) return 0;

  const validDates = entries
    .map(entry => entry.date || entry.time || "")
    .map(value => {
      const match = value.match(/(\d{4}-\d{2}-\d{2})/);
      return match ? match[1] : null;
    })
    .filter(Boolean);

  if (!validDates.length) return 0;

  const sortedDates = [...new Set(validDates)].sort();
  let streak = 1;

  for (let i = 1; i < sortedDates.length; i += 1) {
    const [prevYear, prevMonth, prevDay] = sortedDates[i - 1].split("-").map(Number);
    const [currYear, currMonth, currDay] = sortedDates[i].split("-").map(Number);
    const previousDate = Date.UTC(prevYear, prevMonth - 1, prevDay);
    const currentDate = Date.UTC(currYear, currMonth - 1, currDay);
    const dayDiff = (previousDate - currentDate) / (1000 * 60 * 60 * 24);

    if (dayDiff === 1) {
      streak += 1;
    } else {
      break;
    }
  }

  return streak;
}

function updateMoodStats() {
  const entries = getMoodEntries();
  const countEl = document.getElementById("checkinCount");
  const mostCommonEl = document.getElementById("mostCommonMood");
  const streakEl = document.getElementById("streakValue");

  if (countEl) countEl.textContent = entries.length;
  if (mostCommonEl) mostCommonEl.textContent = getMostCommonMood(entries);
  if (streakEl) streakEl.textContent = `${getStreak(entries)} day${getStreak(entries) === 1 ? "" : "s"}`;
}

// Build a compact bar chart for the stats page from saved entries.
function renderStatsChart() {
  const chart = document.getElementById("statsChart");
  if (!chart) return;

  const entries = JSON.parse(localStorage.getItem("moodEntries") || "[]");
  const summary = entries.reduce((acc, entry) => {
    acc[entry.mood] = (acc[entry.mood] || 0) + 1;
    return acc;
  }, {});

  const chartData = [
    { label: "Calm", value: summary.calm || 0, color: "var(--accent)" },
    { label: "Happy", value: summary.happy || 0, color: "var(--accent-2)" },
    { label: "Tired", value: summary.tired || 0, color: "var(--glow)" },
    { label: "Stressed", value: summary.stressed || 0, color: "var(--muted)" }
  ];

  chart.innerHTML = chartData.map(item => `
    <div class="chart-row">
      <span>${item.label}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${Math.max(item.value, 1) * 14}%; background:${item.color};"></div>
      </div>
      <strong>${item.value}</strong>
    </div>
  `).join("");
}

// Simple mood entry form for the new tracking page.
const moodButtons = document.querySelectorAll(".mood-btn");
const moodNoteInput = document.getElementById("moodNote");
const saveMoodButton = document.getElementById("saveMoodBtn");
const moodMessage = document.getElementById("moodMessage");
let selectedMood = "calm";

moodButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedMood = button.dataset.mood;
    moodButtons.forEach(btn => btn.classList.toggle("active", btn === button));
  });
});

if (saveMoodButton) {
  saveMoodButton.addEventListener("click", () => {
    const entries = getMoodEntries();
    entries.push({
      mood: selectedMood,
      note: moodNoteInput?.value.trim() || "No note added",
      date: new Date().toLocaleDateString("en-CA")
    });
    localStorage.setItem("moodEntries", JSON.stringify(entries));

    if (moodNoteInput) moodNoteInput.value = "";
    if (moodMessage) moodMessage.textContent = `Saved ${selectedMood} entry.`;

    updateMoodStats();
    renderStatsChart();
  });
}

// Start the app with the night-sky theme and build the stats view.
applyTheme(themePresets["night-sky"]);
updateMoodStats();
renderStatsChart();
