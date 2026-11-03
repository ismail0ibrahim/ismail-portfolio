(function () {
  var allowed = { en: 1, de: 1, es: 1, it: 1, tr: 1, ru: 1, zh: 1, ar: 1 };
  var params = new URLSearchParams(location.search);
  var requested = params.get("lang") || localStorage.getItem("lang") || "en";
  var lang = allowed[requested] ? requested : "en";
  var dict = CV_TRANSLATIONS[lang] || CV_TRANSLATIONS.en;

  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  if (dict["meta.title"]) {
    document.title = dict["meta.title"];
  }

  document.querySelectorAll("[data-cvi18n]").forEach(function (el) {
    var key = el.dataset.cvi18n;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  document.querySelector("[data-action='print']")?.addEventListener("click", function () {
    window.print();
  });
})();
