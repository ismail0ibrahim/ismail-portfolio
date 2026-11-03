(function () {
  var allowed = { en: 1, de: 1, es: 1, it: 1, tr: 1, ru: 1, zh: 1, ar: 1 };
  var params = new URLSearchParams(location.search);
  var stored = localStorage.getItem("lang");
  if (stored && !allowed[stored]) {
    localStorage.removeItem("lang");
    stored = "";
  }
  var lang = params.get("lang") || stored || "en";
  if (!allowed[lang]) {
    lang = "en";
  }
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
})();
