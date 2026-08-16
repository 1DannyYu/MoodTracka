// Get the page sections so the app can switch between them.
const loginPageSection = document.getElementById("loginPage");
const homePageSection = document.getElementById("homePage");
const themesPageSection = document.getElementById("themesPage");
const moodPageSection = document.getElementById("moodPage");
const entriesPageSection = document.getElementById("entriesPage");
const statsPageSection = document.getElementById("statsPage");
const pageSections = [loginPageSection, homePageSection, themesPageSection, moodPageSection, entriesPageSection, statsPageSection];

const storagePrefix = "MoodTracka";
const activeStudentStorageKey = `${storagePrefix}:activeStudentId`;
const accountBadge = document.getElementById("activeStudentBadge");
const switchAccountButton = document.getElementById("switchAccountBtn");
const studentIdInput = document.getElementById("studentIdInput");
const loginButton = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

function normalizeStudentId(value) {
  return String(value || "").replace(/\s+/g, "").trim();
}

function getActiveStudentId() {
  return normalizeStudentId(localStorage.getItem(activeStudentStorageKey));
}

function getStudentStorageKey(studentId, suffix) {
  return `${storagePrefix}:student:${studentId}:${suffix}`;
}

function getCurrentStudentStorageKey(suffix) {
  const studentId = getActiveStudentId();
  return studentId ? getStudentStorageKey(studentId, suffix) : null;
}

function updateActiveStudentBadge() {
  const studentId = getActiveStudentId();

  if (accountBadge) {
    accountBadge.textContent = studentId ? `Logged in as ${studentId}` : "Not logged in";
  }

  if (switchAccountButton) {
    switchAccountButton.textContent = studentId ? "Switch account" : "Log in";
  }
}

function clearAccountState() {
  selectedEntryIndices.clear();
  updateActiveStudentBadge();
}

function setActiveStudentId(studentId) {
  const nextStudentId = normalizeStudentId(studentId);

  if (!/^\d+$/.test(nextStudentId)) {
    return false;
  }

  localStorage.setItem(activeStudentStorageKey, nextStudentId);
  clearAccountState();
  refreshStatsVisuals();
  renderMoodEntries();
  return true;
}

function logoutStudent() {
  localStorage.removeItem(activeStudentStorageKey);
  clearAccountState();
  refreshStatsVisuals();
  renderMoodEntries();
  showPage("login");
}

function openStudentSession(studentId) {
  if (!setActiveStudentId(studentId)) {
    if (loginMessage) {
      loginMessage.textContent = "Enter a valid student ID number to continue.";
    }
    return false;
  }

  if (studentIdInput) {
    studentIdInput.value = getActiveStudentId();
  }

  if (loginMessage) {
    loginMessage.textContent = `Logged in as ${getActiveStudentId()}.`;
  }

  const savedTheme = loadThemeForActiveStudent();
  applyTheme(savedTheme, false);
  resetMoodForm();
  showPage("home");
  return true;
}

function loadThemeForActiveStudent() {
  const storageKey = getCurrentStudentStorageKey("theme");

  if (!storageKey) {
    return themePresets["night-sky"];
  }

  try {
    const rawTheme = localStorage.getItem(storageKey);
    if (!rawTheme) {
      return themePresets["night-sky"];
    }

    return JSON.parse(rawTheme);
  } catch (error) {
    return themePresets["night-sky"];
  }
}

function saveThemeForActiveStudent(themeValues) {
  const storageKey = getCurrentStudentStorageKey("theme");

  if (!storageKey) {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(themeValues));
}

// Show the requested page and hide the others.
function showPage(pageName) {
  if (pageName !== "login" && !getActiveStudentId()) {
    pageName = "login";
  }

  const targetPageId = `${pageName}Page`;

  pageSections.forEach(page => {
    page.classList.toggle("active", page.id === targetPageId);
  });

  if (pageName === "stats") {
    refreshStatsVisuals();
  }

  if (pageName === "entries") {
    renderMoodEntries();
  }

  if (pageName === "login") {
    updateActiveStudentBadge();
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
    } else if (card.dataset.target === "entries") {
      showPage("entries");
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
function applyTheme(themeValues, shouldPersist = true) {
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

  if (shouldPersist) {
    saveThemeForActiveStudent(resolvedTheme);
  }
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
  const storageKey = getCurrentStudentStorageKey("entries");

  if (!storageKey) {
    return [];
  }

  // Read raw entries and normalize them so date handling is consistent.
  const raw = JSON.parse(localStorage.getItem(storageKey) || "[]");

  const normalized = raw.map(entry => {
    const e = Object.assign({}, entry);

    // Ensure there is a mood string
    if (!e.mood) e.mood = "unknown";

    // Normalize to `date` in YYYY-MM-DD format.
    let dateStr = null;
    if (e.date && /^\d{4}-\d{2}-\d{2}$/.test(e.date)) {
      dateStr = e.date;
    } else if (e.time) {
      const parsed = new Date(e.time);
      if (!Number.isNaN(parsed.getTime())) {
        dateStr = parsed.toISOString().slice(0, 10);
      } else {
        const m = String(e.time).match(/(\d{4}-\d{2}-\d{2})/);
        if (m) dateStr = m[1];
      }
    }

    // If we still don't have a date, fall back to today.
    if (!dateStr) dateStr = new Date().toISOString().slice(0, 10);

    e.date = dateStr;
    return e;
  });

  // Persist cleaned entries back to storage so future reads are simpler.
  try {
    localStorage.setItem(storageKey, JSON.stringify(normalized));
  } catch (err) {
    // If storage fails, ignore — we still return normalized data for this session.
  }

  return normalized;
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

const moodColorMap = {
  calm: "var(--accent)",
  happy: "var(--accent-2)",
  tired: "var(--glow)",
  stressed: "var(--muted)"
};

const moodScoreMap = {
  calm: 4,
  happy: 5,
  tired: 2,
  stressed: 1,
  unknown: 2
};

function getMoodTotals(entries) {
  const totals = { calm: 0, happy: 0, tired: 0, stressed: 0 };

  entries.forEach(entry => {
    if (totals[entry.mood] !== undefined) {
      totals[entry.mood] += 1;
    }
  });

  return totals;
}

function refreshStatsVisuals() {
  updateMoodStats();
  renderStatsChart();
  renderWeeklyTrendChart();
  renderMoodBreakdownChart();
}

function renderStatsChart() {
  const chart = document.getElementById("statsChart");
  if (!chart) return;

  const entries = getMoodEntries();
  const summary = getMoodTotals(entries);

  const chartData = [
    { label: "Calm", value: summary.calm || 0, color: moodColorMap.calm },
    { label: "Happy", value: summary.happy || 0, color: moodColorMap.happy },
    { label: "Tired", value: summary.tired || 0, color: moodColorMap.tired },
    { label: "Stressed", value: summary.stressed || 0, color: moodColorMap.stressed }
  ];

  const maxValue = Math.max(...chartData.map(item => item.value), 1);

  chart.innerHTML = chartData.map(item => `
    <div class="chart-row">
      <span>${item.label}</span>
      <div class="bar-track">
        <div class="bar-fill" style="width:${(item.value / maxValue) * 100}%; background:${item.color};"></div>
      </div>
      <strong>${item.value}</strong>
    </div>
  `).join("");
}

function renderWeeklyTrendChart() {
  const chart = document.getElementById("weeklyTrendChart");
  if (!chart) return;

  const entries = getMoodEntries();

  if (!entries.length) {
    chart.innerHTML = '<div class="chart-empty">Log a few moods to unlock the weekly trend.</div>';
    return;
  }

  const newestDate = entries
    .map(entry => entry.date)
    .filter(Boolean)
    .sort((a, b) => new Date(b) - new Date(a))[0];

  const endDate = newestDate ? new Date(`${newestDate}T12:00:00`) : new Date();
  const dates = Array.from({ length: 7 }, (_, index) => {
    const date = new Date(endDate);
    date.setDate(endDate.getDate() - (6 - index));
    date.setHours(0, 0, 0, 0);
    return date.toISOString().slice(0, 10);
  });

  const trend = dates.map(date => {
    const dayEntries = entries.filter(entry => entry.date === date);
    const average = dayEntries.length
      ? dayEntries.reduce((sum, entry) => sum + (moodScoreMap[entry.mood] || moodScoreMap.unknown), 0) / dayEntries.length
      : 0;

    const dominantMood = dayEntries.length
      ? Object.entries(dayEntries.reduce((acc, entry) => {
          acc[entry.mood] = (acc[entry.mood] || 0) + 1;
          return acc;
        }, {})).sort((a, b) => b[1] - a[1])[0][0]
      : "no-entry";

    return {
      date,
      label: new Date(`${date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short" }),
      value: average,
      moodLabel: dayEntries.length ? formatMoodLabel(dominantMood) : "No entry",
      hasEntry: dayEntries.length > 0
    };
  });

  const values = trend.map(day => day.value).filter(value => value > 0);
  const min = Math.min(...values, 0);
  const max = Math.max(...values, 5);
  const width = 280;
  const height = 150;
  const padding = 18;
  const usableWidth = width - padding * 2;
  const usableHeight = height - padding * 2;
  const baselineY = height - padding;

  const entryIndexes = trend
    .map((day, index) => (day.hasEntry ? index : null))
    .filter(index => index !== null);

  function getYForDay(index, dayValue = 0) {
    const previousIndex = [...entryIndexes].reverse().find(entryIndex => entryIndex < index);
    const nextIndex = entryIndexes.find(entryIndex => entryIndex > index);
    const referenceValue = dayValue || (previousIndex !== undefined ? trend[previousIndex].value : nextIndex !== undefined ? trend[nextIndex].value : 0);

    return baselineY - ((referenceValue - min) / (max - min || 1)) * usableHeight;
  }

  const points = trend.map((day, index) => {
    const x = padding + (trend.length === 1 ? usableWidth / 2 : (usableWidth / (trend.length - 1)) * index);
    const y = day.hasEntry ? getYForDay(index, day.value) : getYForDay(index);
    return { ...day, x, y };
  });

  const averageMoodScore = values.length
    ? values.reduce((sum, value) => sum + value, 0) / values.length
    : 0;
  const lineColor = averageMoodScore >= 4 ? "var(--accent)" : averageMoodScore >= 3 ? "var(--accent-2)" : averageMoodScore >= 2 ? "var(--glow)" : "var(--muted)";

  const linePath = points.map((point, index) => {
    const command = index === 0 ? "M" : "L";
    return `${command} ${point.x} ${point.y}`;
  }).join(" ");

  const areaPath = `${linePath} L ${points[points.length - 1].x} ${baselineY} L ${points[0].x} ${baselineY} Z`;

  const pointMarkup = points.filter(point => point.hasEntry).map(point => {
    const shortLabel = point.moodLabel.charAt(0);
    return `
      <g>
        <circle cx="${point.x}" cy="${point.y}" r="4" class="trend-point" />
        <text x="${point.x}" y="${point.y - 11}" text-anchor="middle" class="trend-label">${shortLabel}</text>
      </g>
    `;
  }).join("");

  const legendMarkup = Object.entries(moodColorMap).map(([mood, color]) => `
    <span class="trend-legend-item">
      <span class="trend-legend-swatch" style="background:${color};"></span>
      ${formatMoodLabel(mood)}
    </span>
  `).join("");

  chart.innerHTML = `
    <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="none" aria-label="7-day mood trend">
      <path d="${areaPath}" class="trend-area" />
      <path d="${linePath}" class="trend-line" style="stroke:${lineColor};" />
      ${pointMarkup}
    </svg>
    <div class="trend-legend">${legendMarkup}</div>
    <div class="trend-labels">
      ${trend.map(day => `<span>${day.label}</span>`).join("")}
    </div>
  `;
}

function renderMoodBreakdownChart() {
  const chart = document.getElementById("moodDonutChart");
  if (!chart) return;

  const entries = getMoodEntries();
  const totals = getMoodTotals(entries);
  const totalEntries = Object.values(totals).reduce((sum, value) => sum + value, 0);

  if (!totalEntries) {
    chart.innerHTML = '<div class="chart-empty">No entries yet.</div>';
    return;
  }

  const radius = 42;
  const circumference = 2 * Math.PI * radius;
  let currentOffset = 0;

  const segments = Object.entries(moodColorMap)
    .map(([mood, color]) => {
      const value = totals[mood] || 0;
      const ratio = value / totalEntries;
      const dash = ratio * circumference;
      const segment = `
        <circle
          cx="56"
          cy="56"
          r="${radius}"
          fill="none"
          stroke="${color}"
          stroke-width="14"
          stroke-dasharray="${dash} ${circumference - dash}"
          stroke-dashoffset="${-currentOffset}"
          transform="rotate(-90 56 56)"
          stroke-linecap="round"
        />
      `;
      currentOffset += dash;
      return segment;
    })
    .join("");

  const legend = Object.entries(moodColorMap)
    .map(([mood, color]) => {
      const value = totals[mood] || 0;
      const percentage = totalEntries ? Math.round((value / totalEntries) * 100) : 0;
      return `
        <div class="donut-legend-row">
          <span class="legend-swatch" style="background:${color};"></span>
          <span>${formatMoodLabel(mood)}</span>
          <strong>${percentage}%</strong>
        </div>
      `;
    })
    .join("");

  chart.innerHTML = `
    <div class="donut-wrap">
      <svg viewBox="0 0 112 112" aria-label="mood distribution chart">
        <circle cx="56" cy="56" r="${radius}" fill="none" stroke="rgba(148, 163, 184, 0.15)" stroke-width="14" />
        ${segments}
      </svg>
      <div class="donut-center">
        <strong>${totalEntries}</strong>
        <span>entries</span>
      </div>
    </div>
    <div class="donut-legend">${legend}</div>
  `;
}

function renderMoodEntries() {
  const entriesList = document.getElementById("entriesList");
  if (!entriesList) return;

  const entries = getMoodEntries()
    .map((entry, index) => ({ entry, index }))
    .reverse();

  if (!entries.length) {
    entriesList.innerHTML = `
      <div class="empty-state">
        <h3>No saved snapshots yet</h3>
        <p>Save a mood entry and it will appear here automatically.</p>
      </div>
    `;
    return;
  }

  entriesList.innerHTML = entries.map(({ entry, index }) => `
    <article class="entry-card${selectedEntryIndices.has(index) ? " selected" : ""}">
      <label class="entry-select">
        <input type="checkbox" data-action="toggle-entry-select" data-entry-index="${index}" ${selectedEntryIndices.has(index) ? "checked" : ""} />
        <span class="entry-select-box"></span>
      </label>
      <div class="entry-copy">
        <h3>${formatMoodLabel(entry.mood)}</h3>
        <p>${entry.note || "No note added"}</p>
      </div>
      <div class="entry-meta">
        <span>${entry.date}</span>
        <div class="entry-actions">
          <button class="entry-action-btn" data-action="edit-entry" data-entry-index="${index}" type="button">Edit</button>
          <button class="entry-action-btn danger" data-action="delete-entry" data-entry-index="${index}" type="button">Delete</button>
        </div>
      </div>
    </article>
  `).join("");

  syncEntryBulkControls();
}

function saveMoodEntries(entries) {
  const storageKey = getCurrentStudentStorageKey("entries");

  if (!storageKey) {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(entries));
}

const allowedMoods = ["calm", "happy", "tired", "stressed"];
const selectedEntryIndices = new Set();

const entriesList = document.getElementById("entriesList");
const selectAllEntriesCheckbox = document.getElementById("selectAllEntries");
const selectionCount = document.getElementById("selectionCount");
const deleteSelectedEntriesButton = document.getElementById("deleteSelectedEntriesBtn");
const resetEntriesButton = document.getElementById("resetEntriesBtn");
const resetEntriesModal = document.getElementById("resetEntriesModal");
const cancelResetEntriesButton = document.getElementById("cancelResetEntriesBtn");
const confirmResetEntriesButton = document.getElementById("confirmResetEntriesBtn");

function syncEntryBulkControls() {
  const totalEntries = getMoodEntries().length;
  const selectedCount = selectedEntryIndices.size;

  if (selectionCount) {
    selectionCount.textContent = `${selectedCount} selected`;
  }

  if (deleteSelectedEntriesButton) {
    deleteSelectedEntriesButton.disabled = selectedCount === 0;
  }

  if (selectAllEntriesCheckbox) {
    selectAllEntriesCheckbox.checked = totalEntries > 0 && selectedCount === totalEntries;
    selectAllEntriesCheckbox.indeterminate = selectedCount > 0 && selectedCount < totalEntries;
  }
}

function clearSelectedEntries() {
  selectedEntryIndices.clear();
  syncEntryBulkControls();
}

function deleteEntriesByIndices(entryIndices) {
  if (!entryIndices.length) return;

  const entries = getMoodEntries();
  const uniqueIndices = [...new Set(entryIndices)].filter(index => Number.isInteger(index));

  uniqueIndices.sort((a, b) => b - a).forEach(index => {
    entries.splice(index, 1);
  });

  saveMoodEntries(entries);
  clearSelectedEntries();
  refreshStatsVisuals();
  renderMoodEntries();
}

function editMoodEntry(entryIndex) {
  const entries = getMoodEntries();
  const currentEntry = entries[entryIndex];

  if (!currentEntry) return;

  const moodInput = prompt("Edit mood: calm, happy, tired, stressed", currentEntry.mood || "calm");
  if (moodInput === null) return;

  const noteInput = prompt("Edit note:", currentEntry.note || "No note added");
  if (noteInput === null) return;

  entries[entryIndex] = {
    ...currentEntry,
    mood: allowedMoods.includes(moodInput.trim().toLowerCase()) ? moodInput.trim().toLowerCase() : currentEntry.mood,
    note: noteInput.trim() || "No note added"
  };

  saveMoodEntries(entries);
  refreshStatsVisuals();
  renderMoodEntries();
}

function deleteMoodEntry(entryIndex) {
  const entries = getMoodEntries();
  const currentEntry = entries[entryIndex];

  if (!currentEntry) return;

  const confirmed = confirm(`Delete the ${formatMoodLabel(currentEntry.mood)} entry from ${currentEntry.date}?`);
  if (!confirmed) return;

  deleteEntriesByIndices([entryIndex]);
}

if (entriesList) {
  entriesList.addEventListener("click", event => {
    const button = event.target.closest("button[data-action]");
    const checkbox = event.target.closest("input[data-action='toggle-entry-select']");

    if (checkbox) {
      const entryIndex = Number(checkbox.dataset.entryIndex);

      if (checkbox.checked) {
        selectedEntryIndices.add(entryIndex);
      } else {
        selectedEntryIndices.delete(entryIndex);
      }

      syncEntryBulkControls();
      renderMoodEntries();
      return;
    }

    if (!button) return;

    const entryIndex = Number(button.dataset.entryIndex);

    if (button.dataset.action === "edit-entry") {
      editMoodEntry(entryIndex);
    }

    if (button.dataset.action === "delete-entry") {
      deleteMoodEntry(entryIndex);
    }
  });
}

if (selectAllEntriesCheckbox) {
  selectAllEntriesCheckbox.addEventListener("change", () => {
    selectedEntryIndices.clear();

    if (selectAllEntriesCheckbox.checked) {
      getMoodEntries().forEach((_, index) => selectedEntryIndices.add(index));
    }

    syncEntryBulkControls();
    renderMoodEntries();
  });
}

if (deleteSelectedEntriesButton) {
  deleteSelectedEntriesButton.addEventListener("click", () => {
    deleteEntriesByIndices([...selectedEntryIndices]);
  });
}

function openResetEntriesModal() {
  if (!resetEntriesModal) return;
  resetEntriesModal.classList.add("visible");
  resetEntriesModal.setAttribute("aria-hidden", "false");
}

function closeResetEntriesModal() {
  if (!resetEntriesModal) return;
  resetEntriesModal.classList.remove("visible");
  resetEntriesModal.setAttribute("aria-hidden", "true");
}

if (resetEntriesButton) {
  resetEntriesButton.addEventListener("click", openResetEntriesModal);
}

if (cancelResetEntriesButton) {
  cancelResetEntriesButton.addEventListener("click", closeResetEntriesModal);
}

if (confirmResetEntriesButton) {
  confirmResetEntriesButton.addEventListener("click", () => {
    saveMoodEntries([]);
    clearSelectedEntries();
    closeResetEntriesModal();
    refreshStatsVisuals();
    renderMoodEntries();
  });
}

if (resetEntriesModal) {
  resetEntriesModal.addEventListener("click", event => {
    if (event.target === resetEntriesModal) {
      closeResetEntriesModal();
    }
  });
}

// Simple mood entry form for the new tracking page.
const moodButtons = document.querySelectorAll(".mood-btn");
const moodNoteInput = document.getElementById("moodNote");
const saveMoodButton = document.getElementById("saveMoodBtn");
const moodMessage = document.getElementById("moodMessage");
let selectedMood = "calm";

function resetMoodForm() {
  selectedMood = "calm";
  moodButtons.forEach(button => {
    button.classList.toggle("active", button.dataset.mood === selectedMood);
  });

  if (moodNoteInput) {
    moodNoteInput.value = "";
  }

  if (moodMessage) {
    moodMessage.textContent = "Your latest mood will appear here.";
  }
}

moodButtons.forEach(button => {
  button.addEventListener("click", () => {
    selectedMood = button.dataset.mood;
    moodButtons.forEach(btn => btn.classList.toggle("active", btn === button));
  });
});

if (studentIdInput) {
  studentIdInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      openStudentSession(studentIdInput.value);
    }
  });
}

if (loginButton) {
  loginButton.addEventListener("click", () => {
    openStudentSession(studentIdInput?.value || "");
  });
}

if (switchAccountButton) {
  switchAccountButton.addEventListener("click", () => {
    logoutStudent();
    if (studentIdInput) {
      studentIdInput.focus();
      studentIdInput.select();
    }
  });
}

if (saveMoodButton) {
  saveMoodButton.addEventListener("click", () => {
    if (!getActiveStudentId()) {
      showPage("login");
      if (loginMessage) {
        loginMessage.textContent = "Log in with a student ID before saving entries.";
      }
      return;
    }

    const entries = getMoodEntries();
    entries.push({
      mood: selectedMood,
      note: moodNoteInput?.value.trim() || "No note added",
      date: new Date().toLocaleDateString("en-CA")
    });
    saveMoodEntries(entries);

    if (moodNoteInput) moodNoteInput.value = "";
    if (moodMessage) moodMessage.textContent = `Saved ${selectedMood} entry.`;

    refreshStatsVisuals();
    renderMoodEntries();
  });
}

// Start the app with the night-sky theme and build the stats view.
// Start the app using the current student's saved session when available.
updateActiveStudentBadge();

if (getActiveStudentId()) {
  openStudentSession(getActiveStudentId());
} else {
  applyTheme(themePresets["night-sky"], false);
  resetMoodForm();
  refreshStatsVisuals();
  showPage("login");
}
