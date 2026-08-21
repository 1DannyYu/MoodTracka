const loginPageSection = document.getElementById("loginPage");
const homePageSection = document.getElementById("homePage");
const themesPageSection = document.getElementById("themesPage");
const moodPageSection = document.getElementById("moodPage");
const entriesPageSection = document.getElementById("entriesPage");
const statsPageSection = document.getElementById("statsPage");
const adminPageSection = document.getElementById("adminPage");
const pageSections = [loginPageSection, homePageSection, themesPageSection, moodPageSection, entriesPageSection, statsPageSection, adminPageSection];

const storagePrefix = "MoodTracka";
const activeStudentStorageKey = `${storagePrefix}:activeStudentId`;
const studentsRegistryStorageKey = `${storagePrefix}:registeredStudents`;
const themeAutoModeStorageSuffix = "themeAuto";
const ADMIN_STUDENT_ID = "6767";

const accountBadge = document.getElementById("activeStudentBadge");
const switchAccountButton = document.getElementById("switchAccountBtn");
const studentIdInput = document.getElementById("studentIdInput");
const studentNameInput = document.getElementById("studentNameInput");
const loginButton = document.getElementById("loginBtn");
const loginMessage = document.getElementById("loginMessage");

const adminCard = document.getElementById("adminCard");
const adminSearchInput = document.getElementById("adminSearchInput");
const adminDownloadTxtBtn = document.getElementById("adminDownloadTxtBtn");
const adminToggleRawViewBtn = document.getElementById("adminToggleRawViewBtn");
const adminRawTextView = document.getElementById("adminRawTextView");
const adminRawTextContent = document.getElementById("adminRawTextContent");
const adminStudentList = document.getElementById("adminStudentList");

function isAdmin() {
  return getActiveStudentId() === ADMIN_STUDENT_ID;
}

function normalizeStudentId(value) {
  const str = String(value || "").trim().replace(/\s+/g, "");
  if (str.toLowerCase() === "admin") {
    return ADMIN_STUDENT_ID;
  }
  return str;
}

function normalizeStudentName(value) {
  return String(value || "").trim().replace(/\s+/g, " ");
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

function getThemeAutoStorageKey() {
  return getCurrentStudentStorageKey(themeAutoModeStorageSuffix);
}

function getRegisteredStudentsMap() {
  try {
    const raw = localStorage.getItem(studentsRegistryStorageKey);
    return raw ? JSON.parse(raw) : {};
  } catch (error) {
    return {};
  }
}

function saveRegisteredStudentsMap(registry) {
  try {
    localStorage.setItem(studentsRegistryStorageKey, JSON.stringify(registry));
  } catch (error) {
    // Storage fallback
  }
}

function getStudentName(studentId) {
  const normalizedId = normalizeStudentId(studentId);
  if (!normalizedId) return "";

  // Check individual student key first
  const individualName = localStorage.getItem(getStudentStorageKey(normalizedId, "name"));
  if (individualName && individualName.trim()) {
    return individualName.trim();
  }

  // Check registry
  const registry = getRegisteredStudentsMap();
  if (registry[normalizedId]?.name) {
    return registry[normalizedId].name;
  }

  return "";
}

function saveStudentName(studentId, name) {
  const normalizedId = normalizeStudentId(studentId);
  const normalizedName = normalizeStudentName(name);
  if (!normalizedId) return;

  if (normalizedName) {
    localStorage.setItem(getStudentStorageKey(normalizedId, "name"), normalizedName);
  }

  const registry = getRegisteredStudentsMap();
  const existing = registry[normalizedId] || {};
  registry[normalizedId] = {
    ...existing,
    id: normalizedId,
    name: normalizedName || existing.name || "",
    lastActive: new Date().toISOString()
  };
  saveRegisteredStudentsMap(registry);
}

function getAllKnownStudentIds() {
  const idSet = new Set();

  const registry = getRegisteredStudentsMap();
  Object.keys(registry).forEach(id => {
    const normalized = normalizeStudentId(id);
    if (/^\d+$/.test(normalized)) {
      idSet.add(normalized);
    }
  });

  const activeId = getActiveStudentId();
  if (activeId && /^\d+$/.test(activeId)) {
    idSet.add(activeId);
  }

  try {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key && key.startsWith(`${storagePrefix}:student:`)) {
        const parts = key.split(":");
        if (parts[2] && /^\d+$/.test(parts[2])) {
          idSet.add(parts[2]);
        }
      }
    }
  } catch (e) {
    // ignore
  }

  return Array.from(idSet).sort((a, b) => Number(a) - Number(b));
}

function getStudentEntriesById(studentId) {
  const normalizedId = normalizeStudentId(studentId);
  if (!normalizedId) return [];

  const storageKey = getStudentStorageKey(normalizedId, "entries");
  let raw = [];
  try {
    const storedValue = localStorage.getItem(storageKey);
    raw = storedValue ? JSON.parse(storedValue) : [];
  } catch (error) {
    raw = [];
  }

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map(entry => {
    const e = Object.assign({}, entry);
    if (!e.mood) e.mood = "unknown";
    if (!e.date) {
      if (e.time) {
        const parsed = new Date(e.time);
        e.date = !Number.isNaN(parsed.getTime()) ? parsed.toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10);
      } else {
        e.date = new Date().toISOString().slice(0, 10);
      }
    }
    return e;
  });
}

function updateActiveStudentBadge() {
  const studentId = getActiveStudentId();
  const studentName = getStudentName(studentId);

  if (accountBadge) {
    if (!studentId) {
      accountBadge.textContent = "Not logged in";
    } else if (studentId === ADMIN_STUDENT_ID) {
      accountBadge.textContent = studentName
        ? `🛡️ Logged in as ${studentName} (Admin ID: ${studentId})`
        : `🛡️ Logged in as Administrator (ID: ${studentId})`;
    } else if (studentName) {
      accountBadge.textContent = `Logged in as ${studentName} (ID: ${studentId})`;
    } else {
      accountBadge.textContent = `Logged in as ID: ${studentId}`;
    }
  }

  if (adminCard) {
    adminCard.style.display = studentId === ADMIN_STUDENT_ID ? "block" : "none";
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
  if (studentNameInput) {
    studentNameInput.value = "";
  }
  refreshStatsVisuals();
  renderMoodEntries();
  applyTheme(themePresets["night-sky"], false);
  resetMoodForm();
  showPage("login");
}

function openStudentSession(studentId, studentName) {
  const trimmedId = normalizeStudentId(studentId);
  let trimmedName = (studentName !== undefined && studentName !== null)
    ? normalizeStudentName(studentName)
    : normalizeStudentName(studentNameInput?.value);

  if (trimmedId === ADMIN_STUDENT_ID && !trimmedName) {
    trimmedName = getStudentName(ADMIN_STUDENT_ID) || "School Wellbeing Admin";
  }

  if (!setActiveStudentId(trimmedId)) {
    if (loginMessage) {
      loginMessage.textContent = "Enter a valid student ID number (or Admin ID: 6767) to continue.";
    }
    return false;
  }

  const activeId = getActiveStudentId();

  if (trimmedName) {
    saveStudentName(activeId, trimmedName);
  } else {
    // If no name supplied now, register ID if not already saved
    saveStudentName(activeId, getStudentName(activeId));
  }

  const resolvedName = getStudentName(activeId);

  if (studentIdInput) {
    studentIdInput.value = activeId;
  }
  if (studentNameInput) {
    studentNameInput.value = resolvedName;
  }

  if (loginMessage) {
    loginMessage.textContent = resolvedName
      ? `Logged in as ${resolvedName} (ID: ${activeId}).`
      : `Logged in as ID: ${activeId}.`;
  }

  updateActiveStudentBadge();
  moodThemeAutoEnabled = loadMoodThemeAutoEnabled();
  updateMoodThemeModeUI();
  applyStudentTheme(false);
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

function loadMoodThemeAutoEnabled() {
  const storageKey = getThemeAutoStorageKey();

  if (!storageKey) {
    return true;
  }

  try {
    const storedValue = localStorage.getItem(storageKey);
    return storedValue === null ? true : JSON.parse(storedValue) !== false;
  } catch (error) {
    return true;
  }
}

function saveMoodThemeAutoEnabled(isEnabled) {
  const storageKey = getThemeAutoStorageKey();

  if (!storageKey) {
    return;
  }

  localStorage.setItem(storageKey, JSON.stringify(Boolean(isEnabled)));
}

// Show the requested page and hide the others.
function showPage(pageName) {
  if (pageName !== "login" && !getActiveStudentId()) {
    pageName = "login";
  }

  if (pageName === "admin" && !isAdmin()) {
    pageName = "home";
  }

  const targetPageId = `${pageName}Page`;

  pageSections.forEach(page => {
    if (page) {
      page.classList.toggle("active", page.id === targetPageId);
    }
  });

  if (pageName === "stats") {
    refreshStatsVisuals();
  }

  if (pageName === "entries") {
    renderMoodEntries();
  }

  if (pageName === "admin") {
    renderAdminStudentList(adminSearchInput?.value || "");
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
    } else if (card.dataset.target === "admin") {
      showPage("admin");
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
const moodThemeToggle = document.getElementById("moodThemeToggle");
const themeModeMessage = document.getElementById("themeModeMessage");

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

const moodThemePalettes = {
  calm: {
    bg: "#08111a",
    surface: "#102433",
    surfaceStrong: "#17364b",
    text: "#edf7fb",
    muted: "#8ab0c2",
    accent: "#5dc7c7",
    accent2: "#62a9ff",
    border: "#2f6d7f",
    glow: "#4edbd3",
    glowSoft: "#9cefe8"
  },
  happy: {
    bg: "#fff5df",
    surface: "#ffe7b8",
    surfaceStrong: "#ffd26f",
    text: "#5a3412",
    muted: "#a56a1f",
    accent: "#ffb703",
    accent2: "#ff7b54",
    border: "#d98e1f",
    glow: "#ffbf47",
    glowSoft: "#ffe0a3"
  },
  angry: {
    bg: "#1a0708",
    surface: "#361014",
    surfaceStrong: "#641b22",
    text: "#fff0f1",
    muted: "#d98a92",
    accent: "#e63946",
    accent2: "#ff7b6b",
    border: "#9e2a35",
    glow: "#ff4d5a",
    glowSoft: "#ffb0b8"
  },
  tired: {
    bg: "#0d1020",
    surface: "#191f38",
    surfaceStrong: "#2d3557",
    text: "#e9ecff",
    muted: "#96a0c7",
    accent: "#8b8cff",
    accent2: "#6dd3ff",
    border: "#4d5a91",
    glow: "#9ba3ff",
    glowSoft: "#c0c7ff"
  },
  stressed: {
    bg: "#13070b",
    surface: "#2a1118",
    surfaceStrong: "#4f1a25",
    text: "#ffeef2",
    muted: "#cb8f9d",
    accent: "#ff6d8c",
    accent2: "#c86bff",
    border: "#7d3144",
    glow: "#ff7a96",
    glowSoft: "#ffbbcb"
  },
  unknown: {
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
  }
};

let moodThemeAutoEnabled = true;

function getThemeForMood(mood) {
  return moodThemePalettes[mood] || moodThemePalettes.unknown;
}

function getLatestMoodTheme() {
  const latestEntry = getMoodEntries().at(-1);
  return getThemeForMood(latestEntry?.mood || "unknown");
}

function updateMoodThemeModeUI() {
  if (moodThemeToggle) {
    moodThemeToggle.checked = moodThemeAutoEnabled;
  }

  presetThemeButtons.forEach(button => {
    button.disabled = moodThemeAutoEnabled;
  });

  Object.values(themeColorInputs).forEach(input => {
    input.disabled = moodThemeAutoEnabled;
  });

  if (themeModeMessage) {
    themeModeMessage.textContent = moodThemeAutoEnabled
      ? "Mood themes are on."
      : "Mood themes are off. Night sky stays as the default theme.";
  }
}

function applyStudentTheme(shouldPersist = true) {
  if (moodThemeAutoEnabled) {
    applyTheme(getLatestMoodTheme(), false);
    return;
  }

  applyTheme(loadThemeForActiveStudent(), shouldPersist);
}

function setMoodThemeAutoEnabled(isEnabled) {
  moodThemeAutoEnabled = Boolean(isEnabled);
  saveMoodThemeAutoEnabled(moodThemeAutoEnabled);
  updateMoodThemeModeUI();

  if (moodThemeAutoEnabled) {
    applyTheme(getLatestMoodTheme(), false);
  } else {
    applyTheme(loadThemeForActiveStudent(), false);
  }
}

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
    if (moodThemeAutoEnabled) {
      return;
    }

    const selectedTheme = themePresets[button.dataset.theme];
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  });
});

// Update the preview as the user changes any custom colour.
Object.values(themeColorInputs).forEach(input => {
  input.addEventListener("input", () => {
    if (moodThemeAutoEnabled) {
      return;
    }

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

  let raw = [];
  try {
    const storedValue = localStorage.getItem(storageKey);
    raw = storedValue ? JSON.parse(storedValue) : [];
  } catch (error) {
    raw = [];
  }

  if (!Array.isArray(raw)) {
    raw = [];
  }

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

  for (let i = sortedDates.length - 1; i > 0; i -= 1) {
    const [currYear, currMonth, currDay] = sortedDates[i].split("-").map(Number);
    const [prevYear, prevMonth, prevDay] = sortedDates[i - 1].split("-").map(Number);
    const currentDate = Date.UTC(currYear, currMonth - 1, currDay);
    const previousDate = Date.UTC(prevYear, prevMonth - 1, prevDay);
    const dayDiff = (currentDate - previousDate) / (1000 * 60 * 60 * 24);

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
  calm: "#5dc7c7",
  happy: "#ffb703",
  angry: "#e63946",
  tired: "#8b8cff",
  stressed: "#ff6d8c"
};

const moodScoreMap = {
  calm: 4,
  happy: 5,
  angry: 1,
  tired: 2,
  stressed: 1,
  unknown: 2
};

function getMoodTotals(entries) {
  const totals = { calm: 0, happy: 0, angry: 0, tired: 0, stressed: 0 };

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
    { label: "Angry", value: summary.angry || 0, color: moodColorMap.angry },
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
  const title = document.getElementById("weeklyTrendTitle");
  const chart = document.getElementById("weeklyTrendChart");
  if (!chart) return;

  const entries = getMoodEntries();

  if (!entries.length) {
    if (title) {
      title.textContent = "Recent entries";
    }
    chart.innerHTML = '<div class="chart-empty">Log a few moods to unlock the 10 most recent entries pie chart.</div>';
    return;
  }

  const recentEntries = entries.slice(-10);
  const moodOrder = [...allowedMoods, "unknown"];
  const groupedRecentEntries = recentEntries
    .map((entry, index) => ({ entry, index }))
    .sort((left, right) => {
      const leftRank = moodOrder.indexOf(left.entry.mood || "unknown");
      const rightRank = moodOrder.indexOf(right.entry.mood || "unknown");

      if (leftRank !== rightRank) {
        return leftRank - rightRank;
      }

      return left.index - right.index;
    })
    .map(item => item.entry);

  if (title) {
    title.textContent = "Recent entries";
  }

  const width = 180;
  const height = 180;
  const centerX = width / 2;
  const centerY = height / 2;
  const radius = 72;

  function polarToCartesian(angleInDegrees) {
    const angleInRadians = (angleInDegrees - 90) * (Math.PI / 180);
    return {
      x: centerX + radius * Math.cos(angleInRadians),
      y: centerY + radius * Math.sin(angleInRadians)
    };
  }

  function describePieSlice(startAngle, endAngle) {
    const start = polarToCartesian(endAngle);
    const end = polarToCartesian(startAngle);
    const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

    return [
      `M ${centerX} ${centerY}`,
      `L ${start.x} ${start.y}`,
      `A ${radius} ${radius} 0 ${largeArcFlag} 0 ${end.x} ${end.y}`,
      "Z"
    ].join(" ");
  }

  const segmentSize = 360 / groupedRecentEntries.length;
  let currentAngle = 0;

  const pieSegments = groupedRecentEntries.map(entry => {
    const mood = entry.mood || "unknown";
    const moodColor = moodColorMap[mood] || moodColorMap.unknown || "var(--muted)";
    const startAngle = currentAngle;
    const endAngle = currentAngle + segmentSize;
    currentAngle = endAngle;

    return `
      <path
        d="${describePieSlice(startAngle, endAngle)}"
        class="pie-slice"
        style="fill:${moodColor};"
      />
    `;
  }).join("");

  const legendMarkup = groupedRecentEntries.slice().reverse().map((entry, index) => {
    const mood = entry.mood || "unknown";
    const moodColor = moodColorMap[mood] || moodColorMap.unknown || "var(--muted)";
    const label = `${formatMoodLabel(mood)} · ${entry.date || "No date"}`;
    return `
      <div class="pie-legend-item">
        <span class="pie-legend-swatch" style="background:${moodColor};"></span>
        <span>${label}</span>
      </div>
    `;
  }).join("");

  chart.innerHTML = `
    <div class="pie-visual">
      <svg viewBox="0 0 ${width} ${height}" preserveAspectRatio="xMidYMid meet" aria-label="10 most recent entries pie chart">
        ${pieSegments}
      </svg>
      <div class="pie-center">
        <strong>${recentEntries.length}</strong>
        <span>entries</span>
      </div>
    </div>
    <div class="pie-legend">
      ${legendMarkup}
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

  if (moodThemeAutoEnabled) {
    applyStudentTheme(false);
  }
}

const allowedMoods = ["calm", "happy", "angry", "tired", "stressed"];
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

  const moodInput = prompt("Edit mood: calm, happy, angry, tired, stressed", currentEntry.mood || "calm");
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

if (moodThemeToggle) {
  moodThemeToggle.addEventListener("change", () => {
    setMoodThemeAutoEnabled(moodThemeToggle.checked);
  });
}

if (studentIdInput) {
  studentIdInput.addEventListener("input", () => {
    const rawId = normalizeStudentId(studentIdInput.value);
    if (/^\d+$/.test(rawId)) {
      const savedName = getStudentName(rawId);
      if (savedName && studentNameInput && !studentNameInput.matches(":focus")) {
        studentNameInput.value = savedName;
      }
    }
  });

  studentIdInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      openStudentSession(studentIdInput.value, studentNameInput?.value);
    }
  });
}

if (studentNameInput) {
  studentNameInput.addEventListener("keydown", event => {
    if (event.key === "Enter") {
      openStudentSession(studentIdInput?.value, studentNameInput.value);
    }
  });
}

if (loginButton) {
  loginButton.addEventListener("click", () => {
    openStudentSession(studentIdInput?.value || "", studentNameInput?.value || "");
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

// Admin Portal: confidential student details generation and viewer functions
function generateHumanReadableStudentDetailsTxt() {
  const allStudentIds = getAllKnownStudentIds();
  const now = new Date();
  const dateFormatted = now.toLocaleString("en-AU", {
    dateStyle: "full",
    timeStyle: "short"
  });

  let output = "";
  output += "================================================================================\n";
  output += "                 MOODTRACKA — CONFIDENTIAL STUDENT RECORDS\n";
  output += "                 ACCESS LEVEL: ADMINISTRATOR (ID: 6767)\n";
  output += "================================================================================\n";
  output += `Export Date:               ${dateFormatted}\n`;
  output += `Total Registered Students: ${allStudentIds.length}\n`;
  output += "================================================================================\n\n";

  output += "--------------------------------------------------------------------------------\n";
  output += "STUDENT SUMMARY DIRECTORY\n";
  output += "--------------------------------------------------------------------------------\n";
  output += "ID".padEnd(12) + "| " + "Name".padEnd(26) + "| " + "Check-ins".padEnd(11) + "| " + "Streak".padEnd(10) + "| " + "Top Mood" + "\n";
  output += "-".repeat(12) + "+-" + "-".repeat(26) + "+-" + "-".repeat(11) + "+-" + "-".repeat(10) + "+-" + "-".repeat(16) + "\n";

  if (allStudentIds.length === 0) {
    output += "No student records found.\n";
  } else {
    allStudentIds.forEach(id => {
      const name = getStudentName(id) || (id === ADMIN_STUDENT_ID ? "Administrator" : "—");
      const entries = getStudentEntriesById(id);
      const streak = `${getStreak(entries)} day${getStreak(entries) === 1 ? "" : "s"}`;
      const topMood = getMostCommonMood(entries);
      output += id.padEnd(12) + "| " + name.padEnd(26) + "| " + String(entries.length).padEnd(11) + "| " + streak.padEnd(10) + "| " + topMood + "\n";
    });
  }
  output += "--------------------------------------------------------------------------------\n\n";

  output += "================================================================================\n";
  output += "DETAILED STUDENT RECORDS & MOOD ENTRIES\n";
  output += "================================================================================\n\n";

  if (allStudentIds.length === 0) {
    output += "No detailed student entries recorded yet.\n\n";
  } else {
    allStudentIds.forEach((id, studentIndex) => {
      const name = getStudentName(id) || (id === ADMIN_STUDENT_ID ? "Administrator" : "Not provided");
      const entries = getStudentEntriesById(id);
      const streak = `${getStreak(entries)} day${getStreak(entries) === 1 ? "" : "s"}`;
      const topMood = getMostCommonMood(entries);
      const totals = getMoodTotals(entries);
      const totalEntries = entries.length;

      output += `[ STUDENT RECORD #${studentIndex + 1} ]\n`;
      output += `Student ID:       ${id}${id === ADMIN_STUDENT_ID ? " (Administrator)" : ""}\n`;
      output += `Student Name:     ${name}\n`;
      output += `Total Check-ins:  ${totalEntries}\n`;
      output += `Current Streak:   ${streak}\n`;
      output += `Most Common Mood: ${topMood}\n`;
      output += "Mood Breakdown:\n";
      ["calm", "happy", "tired", "stressed", "angry"].forEach(mood => {
        const count = totals[mood] || 0;
        const pct = totalEntries ? Math.round((count / totalEntries) * 100) : 0;
        output += `  • ${formatMoodLabel(mood).padEnd(10)}: ${String(count).padStart(2)} entries (${String(pct).padStart(3)}%)\n`;
      });
      output += "\n";

      if (entries.length === 0) {
        output += "  (No mood snapshots recorded yet for this student)\n\n";
      } else {
        output += `  Mood Snapshots History (${entries.length} ${entries.length === 1 ? "entry" : "entries"}):\n`;
        output += "  " + "-".repeat(76) + "\n";
        output += "  " + "#".padEnd(4) + "| " + "Date".padEnd(12) + "| " + "Mood".padEnd(10) + "| Note\n";
        output += "  " + "-".repeat(4) + "+-" + "-".repeat(12) + "+-" + "-".repeat(10) + "+-" + "-".repeat(44) + "\n";

        entries.forEach((entry, idx) => {
          const num = String(idx + 1).padEnd(4);
          const date = (entry.date || "—").padEnd(12);
          const mood = formatMoodLabel(entry.mood).padEnd(10);
          const note = entry.note || "No note added";
          output += `  ${num}| ${date}| ${mood}| ${note}\n`;
        });
        output += "  " + "-".repeat(76) + "\n\n";
      }

      output += "================================================================================\n\n";
    });
  }

  output += "End of MoodTracka Confidential Student Records.\n";
  return output;
}

function downloadStudentDetailsTxt() {
  if (!isAdmin()) {
    alert("Unauthorized: Only administrator account (ID: 6767) can download student records.");
    return;
  }
  const content = generateHumanReadableStudentDetailsTxt();
  const blob = new Blob([content], { type: "text/plain;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = "student_details.txt";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);
  URL.revokeObjectURL(url);
}

function saveStudentEntriesById(studentId, entries) {
  const normalizedId = normalizeStudentId(studentId);
  if (!normalizedId) return;

  const storageKey = getStudentStorageKey(normalizedId, "entries");
  try {
    localStorage.setItem(storageKey, JSON.stringify(entries));
  } catch (err) {}

  if (getActiveStudentId() === normalizedId) {
    refreshStatsVisuals();
    renderMoodEntries();
  }
}

function renderAdminStudentList(query = "") {
  if (!adminStudentList) return;
  if (!isAdmin()) {
    adminStudentList.innerHTML = '<p class="chart-empty">Access denied. Admin credentials required.</p>';
    return;
  }

  const allStudentIds = getAllKnownStudentIds();
  const cleanQuery = query.toLowerCase().trim();

  const filteredIds = allStudentIds.filter(id => {
    if (!cleanQuery) return true;
    const name = (getStudentName(id) || "").toLowerCase();
    return id.includes(cleanQuery) || name.includes(cleanQuery);
  });

  if (!filteredIds.length) {
    adminStudentList.innerHTML = `
      <div class="empty-state">
        <h3>No student records matching "${query}"</h3>
        <p>Try searching for a different name or ID.</p>
      </div>
    `;
    return;
  }

  adminStudentList.innerHTML = filteredIds.map(id => {
    const name = getStudentName(id) || (id === ADMIN_STUDENT_ID ? "Administrator" : "Name not provided");
    const entries = getStudentEntriesById(id);
    const streak = `${getStreak(entries)} day${getStreak(entries) === 1 ? "" : "s"}`;
    const topMood = getMostCommonMood(entries);
    const totals = getMoodTotals(entries);

    const moodBadges = ["calm", "happy", "tired", "stressed", "angry"]
      .filter(mood => totals[mood] > 0)
      .map(mood => `<span style="display:inline-block; margin-right:8px; padding:2px 8px; border-radius:999px; background:${moodColorMap[mood]}22; color:${moodColorMap[mood]}; font-size:12px; font-weight:600;">${formatMoodLabel(mood)}: ${totals[mood]}</span>`)
      .join("");

    const entriesRows = entries.length ? entries.map((entry, originalIndex) => ({ entry, originalIndex })).reverse().map(({ entry, originalIndex }, idx) => `
      <tr>
        <td>#${entries.length - idx}</td>
        <td>${entry.date || "—"}</td>
        <td><strong style="color:${moodColorMap[entry.mood] || "inherit"}">${formatMoodLabel(entry.mood)}</strong></td>
        <td>${entry.note || "No note added"}</td>
        <td style="text-align: right;">
          <button class="admin-delete-btn" data-admin-action="delete-single-entry" data-student-id="${id}" data-entry-index="${originalIndex}" type="button" title="Delete this entry">Delete</button>
        </td>
      </tr>
    `).join("") : '<tr><td colspan="5" style="color:var(--muted); text-align:center; padding:12px;">No mood snapshots recorded yet</td></tr>';

    const clearButtonMarkup = entries.length > 0
      ? `<button class="entry-action-btn danger" style="padding: 6px 14px; font-size: 13px;" data-admin-action="clear-all-entries" data-student-id="${id}" type="button">Clear All Entries</button>`
      : "";

    return `
      <article class="admin-student-card">
        <div class="admin-student-header">
          <div>
            <h3>${name}</h3>
          </div>
          <div style="display: flex; gap: 10px; align-items: center; flex-wrap: wrap;">
            ${clearButtonMarkup}
            <span class="admin-student-id-badge">${id === ADMIN_STUDENT_ID ? "ADMIN ID: 6767" : `STUDENT ID: ${id}`}</span>
          </div>
        </div>

        <div class="admin-student-stats">
          <div>Check-ins: <strong>${entries.length}</strong></div>
          <div>Streak: <strong>${streak}</strong></div>
          <div>Top Mood: <strong>${topMood}</strong></div>
        </div>

        ${moodBadges ? `<div>${moodBadges}</div>` : ""}

        <div style="overflow-x: auto;">
          <table class="admin-entries-table">
            <thead>
              <tr>
                <th style="width: 50px;">#</th>
                <th style="width: 110px;">Date</th>
                <th style="width: 110px;">Mood</th>
                <th>Note</th>
                <th style="width: 80px; text-align: right;">Action</th>
              </tr>
            </thead>
            <tbody>
              ${entriesRows}
            </tbody>
          </table>
        </div>
      </article>
    `;
  }).join("");
}

if (adminStudentList) {
  adminStudentList.addEventListener("click", event => {
    if (!isAdmin()) return;

    const deleteSingleBtn = event.target.closest("button[data-admin-action='delete-single-entry']");
    const clearAllBtn = event.target.closest("button[data-admin-action='clear-all-entries']");

    if (deleteSingleBtn) {
      const studentId = deleteSingleBtn.dataset.studentId;
      const entryIndex = Number(deleteSingleBtn.dataset.entryIndex);
      const studentName = getStudentName(studentId) || `Student ID ${studentId}`;
      const entries = getStudentEntriesById(studentId);
      const targetEntry = entries[entryIndex];

      if (!targetEntry) return;

      const confirmed = confirm(`Admin: Delete the ${formatMoodLabel(targetEntry.mood)} entry (${targetEntry.date}) for ${studentName}?`);
      if (confirmed) {
        entries.splice(entryIndex, 1);
        saveStudentEntriesById(studentId, entries);
        renderAdminStudentList(adminSearchInput?.value || "");
        if (adminRawTextView && adminRawTextView.style.display !== "none" && adminRawTextContent) {
          adminRawTextContent.textContent = generateHumanReadableStudentDetailsTxt();
        }
      }
      return;
    }

    if (clearAllBtn) {
      const studentId = clearAllBtn.dataset.studentId;
      const studentName = getStudentName(studentId) || `Student ID ${studentId}`;
      const confirmed = confirm(`Admin Warning: Permanently delete ALL mood entries for ${studentName} (ID: ${studentId})?`);
      if (confirmed) {
        saveStudentEntriesById(studentId, []);
        renderAdminStudentList(adminSearchInput?.value || "");
        if (adminRawTextView && adminRawTextView.style.display !== "none" && adminRawTextContent) {
          adminRawTextContent.textContent = generateHumanReadableStudentDetailsTxt();
        }
      }
    }
  });
}

if (adminSearchInput) {
  adminSearchInput.addEventListener("input", () => {
    renderAdminStudentList(adminSearchInput.value);
  });
}

if (adminDownloadTxtBtn) {
  adminDownloadTxtBtn.addEventListener("click", () => {
    downloadStudentDetailsTxt();
  });
}

if (adminToggleRawViewBtn) {
  adminToggleRawViewBtn.addEventListener("click", () => {
    if (!adminRawTextView) return;
    const isHidden = adminRawTextView.style.display === "none";
    adminRawTextView.style.display = isHidden ? "block" : "none";
    adminToggleRawViewBtn.textContent = isHidden ? "Hide Text View" : "Toggle Text View";

    if (isHidden && adminRawTextContent) {
      adminRawTextContent.textContent = generateHumanReadableStudentDetailsTxt();
    }
  });
}

// Seed sample students in local storage if fresh so admin 6767 has records to inspect immediately
function ensureInitialStudentSampleData() {
  const registry = getRegisteredStudentsMap();
  if (Object.keys(registry).length === 0) {
    saveStudentName("1001", "Alex Morgan");
    saveStudentName("1002", "Sam Taylor");
    saveStudentName("1003", "Jordan Lee");
    saveStudentName(ADMIN_STUDENT_ID, "School Wellbeing Admin");

    if (!localStorage.getItem(getStudentStorageKey("1001", "entries"))) {
      localStorage.setItem(getStudentStorageKey("1001", "entries"), JSON.stringify([
        { mood: "calm", note: "Ready for the school week ahead.", date: "2026-08-17" },
        { mood: "happy", note: "Finished science assignment on time.", date: "2026-08-18" },
        { mood: "calm", note: "Had a quiet study session in the library.", date: "2026-08-19" },
        { mood: "happy", note: "Great basketball practice at lunch!", date: "2026-08-20" },
        { mood: "calm", note: "Feeling peaceful and prepared for exams.", date: "2026-08-21" }
      ]));
    }

    if (!localStorage.getItem(getStudentStorageKey("1002", "entries"))) {
      localStorage.setItem(getStudentStorageKey("1002", "entries"), JSON.stringify([
        { mood: "tired", note: "Stayed up late studying history notes.", date: "2026-08-18" },
        { mood: "happy", note: "Had a fun lunch with classmates.", date: "2026-08-19" },
        { mood: "happy", note: "Enjoyed drama class rehearsals.", date: "2026-08-20" },
        { mood: "calm", note: "Relaxing evening at home.", date: "2026-08-21" }
      ]));
    }

    if (!localStorage.getItem(getStudentStorageKey("1003", "entries"))) {
      localStorage.setItem(getStudentStorageKey("1003", "entries"), JSON.stringify([
        { mood: "stressed", note: "Big math test coming up tomorrow.", date: "2026-08-19" },
        { mood: "tired", note: "Exhausted after sports training.", date: "2026-08-20" },
        { mood: "calm", note: "Test is over, feeling relieved now.", date: "2026-08-21" }
      ]));
    }
  }
}

ensureInitialStudentSampleData();

// Start the app with the night-sky theme and build the stats view.
// Start the app using the current student's saved session when available.
updateActiveStudentBadge();

if (getActiveStudentId()) {
  const activeId = getActiveStudentId();
  const savedName = getStudentName(activeId);
  if (studentIdInput) studentIdInput.value = activeId;
  if (studentNameInput) studentNameInput.value = savedName;
  openStudentSession(activeId, savedName);
} else {
  applyTheme(themePresets["night-sky"], false);
  resetMoodForm();
  moodThemeAutoEnabled = true;
  updateMoodThemeModeUI();
  refreshStatsVisuals();
  showPage("login");
}
