const homePage = document.getElementById("homePage");
const themesPage = document.getElementById("themesPage");
const pages = [homePage, themesPage];

function showPage(pageName) {
  pages.forEach(page => {
    page.classList.toggle("active", page.id === `${pageName}Page`);
  });
}

const buttons = document.querySelectorAll(".card");

buttons.forEach(button => {
  button.addEventListener("click", () => {
    const label = button.querySelector("h2")?.innerText || button.innerText.split("\n")[0];
    console.log(`${label} button clicked`);

    if (button.dataset.target === "themes") {
      showPage("themes");
    }
  });
});

document.querySelectorAll("[data-action='home']").forEach(button => {
  button.addEventListener("click", () => showPage("home"));
});

const presetButtons = document.querySelectorAll(".preset-card");
const colorInputs = {
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

function applyTheme(themeValues) {
  const resolvedTheme = {
    bg: themeValues.bg ?? colorInputs.bgColor.value,
    surface: themeValues.surface ?? colorInputs.surfaceColor.value,
    surfaceStrong: themeValues.surfaceStrong ?? "#2d3144",
    text: themeValues.text ?? colorInputs.textColor.value,
    muted: themeValues.muted ?? colorInputs.mutedColor.value,
    accent: themeValues.accent ?? colorInputs.accentColor.value,
    accent2: themeValues.accent2 ?? colorInputs.accent2Color.value,
    border: themeValues.border ?? colorInputs.accentColor.value,
    glow: themeValues.glow ?? "#ff8a2a",
    glowSoft: themeValues.glowSoft ?? "#ffb45c"
  };

  document.documentElement.style.setProperty("--bg", resolvedTheme.bg);
  document.documentElement.style.setProperty("--surface", resolvedTheme.surface);
  document.documentElement.style.setProperty("--surface-strong", resolvedTheme.surfaceStrong);
  document.documentElement.style.setProperty("--text", resolvedTheme.text);
  document.documentElement.style.setProperty("--muted", resolvedTheme.muted);
  document.documentElement.style.setProperty("--accent", resolvedTheme.accent);
  document.documentElement.style.setProperty("--accent-2", resolvedTheme.accent2);
  document.documentElement.style.setProperty("--border", resolvedTheme.border);
  document.documentElement.style.setProperty("--glow", resolvedTheme.glow);
  document.documentElement.style.setProperty("--glow-soft", resolvedTheme.glowSoft);

  colorInputs.bgColor.value = resolvedTheme.bg;
  colorInputs.surfaceColor.value = resolvedTheme.surface;
  colorInputs.accentColor.value = resolvedTheme.accent;
  colorInputs.accent2Color.value = resolvedTheme.accent2;
  colorInputs.textColor.value = resolvedTheme.text;
  colorInputs.mutedColor.value = resolvedTheme.muted;
}

presetButtons.forEach(button => {
  button.addEventListener("click", () => {
    const selectedTheme = themePresets[button.dataset.theme];
    if (selectedTheme) {
      applyTheme(selectedTheme);
    }
  });
});

Object.values(colorInputs).forEach(input => {
  input.addEventListener("input", () => {
    applyTheme({
      bg: colorInputs.bgColor.value,
      surface: colorInputs.surfaceColor.value,
      surfaceStrong: "#2d3144",
      text: colorInputs.textColor.value,
      muted: colorInputs.mutedColor.value,
      accent: colorInputs.accentColor.value,
      accent2: colorInputs.accent2Color.value,
      border: colorInputs.accentColor.value,
      glow: "#ff8a2a",
      glowSoft: "#ffb45c"
    });
  });
});

applyTheme(themePresets["calm-dawn"]);
