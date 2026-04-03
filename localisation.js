const localisationState = {
  language: "ga",
  translations: {},
};

async function loadTranslations(lang) {
  try {
    const response = await fetch(`lang/${lang}.json`);
    if (!response.ok) throw new Error(`Failed to load ${lang}.json`);
    localisationState.translations = await response.json();
    localisationState.language = lang;
    return localisationState.translations;
  } catch (error) {
    console.error("Error loading translations:", error);
    return {};
  }
}

function t(key) {
  return localisationState.translations[key] || key;
}

function updatePageLanguage() {
  document.querySelectorAll("[data-i18n]").forEach((element) => {
    const key = element.getAttribute("data-i18n");
    element.textContent = t(key);
  });

  document.querySelectorAll("[data-i18n-placeholder]").forEach((element) => {
    const key = element.getAttribute("data-i18n-placeholder");
    element.placeholder = t(key);
  });

  window.dispatchEvent(new CustomEvent("languageChanged"));
}

async function setLanguage(lang) {
  await loadTranslations(lang);
  updatePageLanguage();
}

document.addEventListener("DOMContentLoaded", async () => {
  await loadTranslations("ga");
  updatePageLanguage();

  document
    .getElementById("set-ga")
    .addEventListener("click", () => setLanguage("ga"));
  document
    .getElementById("set-en")
    .addEventListener("click", () => setLanguage("en"));
});
