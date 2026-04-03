(function() {
  var STORAGE_KEY = "tmc-lang", DEFAULT_LANG = "en", SUPPORTED = { en: 1, es: 1, tl: 1 };
  var cache = new Map(), currentLang = DEFAULT_LANG, currentMessages = {}, requestId = 0;
  var fallbackGreetings = { "greeting.morning": "Good morning", "greeting.afternoon": "Good afternoon", "greeting.evening": "Good evening" };

  function readStoredLang() { try { return localStorage.getItem(STORAGE_KEY) || DEFAULT_LANG; } catch (_) { return DEFAULT_LANG; } }
  function saveStoredLang(lang) { try { localStorage.setItem(STORAGE_KEY, lang); } catch (_) {} }
  function normalize(lang) { return SUPPORTED[lang] ? lang : DEFAULT_LANG; }
  function each(selector, fn) { document.querySelectorAll(selector).forEach(fn); }
  function getValue(obj, key) {
    return key.split(".").reduce(function(acc, part) {
      return acc && Object.prototype.hasOwnProperty.call(acc, part) ? acc[part] : undefined;
    }, obj);
  }
  function t(key) { return getValue(currentMessages, key); }
  function greetingKey() {
    var hour = new Date().getHours();
    return hour < 12 ? "greeting.morning" : hour < 18 ? "greeting.afternoon" : "greeting.evening";
  }
  function updateDropdown(lang) {
    each("[data-tmc-lang-option],[data-lang-code],[data-language-code]", function(el) {
      var code = el.dataset.tmcLangOption || el.dataset.langCode || el.dataset.languageCode, active = code === lang;
      el.classList.toggle("active", active);
      el.setAttribute("aria-current", active ? "true" : "false");
      if ("selected" in el) el.selected = active;
    });
    each("[data-tmc-lang-current]", function(el) { el.textContent = t("lang." + lang) || lang; });
  }
  function applyTranslations() {
    each("[data-i18n]", function(el) { var value = t(el.dataset.i18n); if (value !== undefined) el.textContent = value; });
    each("[data-i18n-placeholder]", function(el) { var value = t(el.dataset.i18nPlaceholder); if (value !== undefined) el.setAttribute("placeholder", value); });
    each("[data-i18n-title]", function(el) { var value = t(el.dataset.i18nTitle); if (value !== undefined) el.setAttribute("title", value); });
    each("[data-i18n-html]", function(el) { var value = t(el.dataset.i18nHtml); if (value !== undefined) el.innerHTML = value; });
    each("[data-i18n-greeting],#tmc_greeting_label", function(el) { el.textContent = window.tmcGetGreeting(); });
    document.documentElement.lang = currentLang;
    updateDropdown(currentLang);
  }
  function loadLanguage(lang) {
    lang = normalize(lang);
    if (cache.has(lang)) return Promise.resolve(cache.get(lang));
    return fetch("lang/" + lang + ".json").then(function(response) {
      if (!response.ok) throw new Error("Failed to load language: " + lang);
      return response.json();
    }).then(function(messages) {
      cache.set(lang, messages);
      return messages;
    });
  }

  window.tmcGetGreeting = function() { var key = greetingKey(); return t(key) || fallbackGreetings[key]; };
  window.tmcSetLanguage = function(langCode) {
    var nextLang = normalize(langCode), id = ++requestId;
    saveStoredLang(nextLang);
    return loadLanguage(nextLang).catch(function() {
      nextLang = DEFAULT_LANG;
      saveStoredLang(nextLang);
      return loadLanguage(nextLang);
    }).then(function(messages) {
      if (id !== requestId) return;
      currentLang = nextLang;
      currentMessages = messages;
      applyTranslations();
    });
  };

  document.addEventListener("click", function(event) {
    var option = event.target.closest("[data-tmc-lang-option],[data-lang-code],[data-language-code]");
    if (!option) return;
    var code = option.dataset.tmcLangOption || option.dataset.langCode || option.dataset.languageCode;
    if (!code) return;
    event.preventDefault();
    window.tmcSetLanguage(code);
  });
  document.addEventListener("DOMContentLoaded", function() { window.tmcSetLanguage(readStoredLang()); });
})();
