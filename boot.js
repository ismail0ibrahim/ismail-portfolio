(function () {
  var allowed = { en: 1, de: 1, es: 1, it: 1, tr: 1, ru: 1, zh: 1, ar: 1 };
  var hour = new Date().getHours();
  var autoTheme = hour >= 7 && hour < 19 ? "light" : "dark";
  var theme = sessionStorage.getItem("theme");
  if (theme !== "light" && theme !== "dark") {
    theme = autoTheme;
  }

  localStorage.removeItem("theme");
  document.documentElement.dataset.theme = theme;

  var locked = document.documentElement.dataset.lockLang;
  var lang = locked && allowed[locked] ? locked : (localStorage.getItem("lang") || "en");
  if (!allowed[lang]) {
    lang = "en";
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
})();
