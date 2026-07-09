const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("section[id]");
const year = document.querySelector("#year");
const themeToggle = document.querySelector("#themeToggle");
const langDropdown = document.querySelector("#langDropdown");
const langToggle = document.querySelector("#langToggle");
const langToggleFlag = document.querySelector("#langToggleFlag");
const langToggleLabel = document.querySelector("#langToggleLabel");
const langMenu = document.querySelector("#langMenu");
const langOptions = document.querySelectorAll("#langMenu li");

if (year) {
  year.textContent = new Date().getFullYear();
}

themeToggle?.addEventListener("click", () => {
  const next = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
  document.documentElement.dataset.theme = next;
  sessionStorage.setItem("theme", next);
});

function applyLanguage(lang) {
  const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";

  document.querySelectorAll("[data-i18n]").forEach((el) => {
    const key = el.dataset.i18n;
    if (dict[key]) {
      el.textContent = dict[key];
    }
  });

  const cvFile = `assets/Ismail_CV_${(TRANSLATIONS[lang] ? lang : "en").toUpperCase()}.pdf`;
  document.querySelectorAll(".cv-link").forEach((el) => {
    el.href = cvFile;
  });
}

function updateLangToggle(lang) {
  const option = document.querySelector(`#langMenu li[data-lang="${lang}"]`);
  if (!option || !langToggleFlag || !langToggleLabel) {
    return;
  }
  langToggleFlag.src = `https://flagcdn.com/w40/${option.dataset.flag}.png`;
  langToggleLabel.textContent = lang.toUpperCase();
  langOptions.forEach((li) => {
    li.setAttribute("aria-selected", String(li.dataset.lang === lang));
  });
}

function closeLangMenu() {
  langDropdown?.classList.remove("open");
  langToggle?.setAttribute("aria-expanded", "false");
}

const savedLang = localStorage.getItem("lang") || "en";
updateLangToggle(savedLang);
applyLanguage(savedLang);

langToggle?.addEventListener("click", (event) => {
  event.stopPropagation();
  const isOpen = langDropdown.classList.toggle("open");
  langToggle.setAttribute("aria-expanded", String(isOpen));
});

langOptions.forEach((li) => {
  li.addEventListener("click", () => {
    const lang = li.dataset.lang;
    localStorage.setItem("lang", lang);
    updateLangToggle(lang);
    applyLanguage(lang);
    closeLangMenu();
  });
});

document.addEventListener("click", (event) => {
  if (langDropdown && !langDropdown.contains(event.target)) {
    closeLangMenu();
  }
});

navToggle?.addEventListener("click", () => {
  const isOpen = navLinks?.classList.toggle("open") ?? false;
  navToggle.setAttribute("aria-expanded", String(isOpen));
});

navItems.forEach((item) => {
  item.addEventListener("click", () => {
    navLinks?.classList.remove("open");
    navToggle?.setAttribute("aria-expanded", "false");
  });
});

const revealObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        revealObserver.unobserve(entry.target);
      }
    });
  },
  {
    threshold: 0.16,
  }
);

revealItems.forEach((item) => revealObserver.observe(item));

const activeSectionObserver = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (!entry.isIntersecting) {
        return;
      }

      navItems.forEach((item) => {
        item.classList.toggle("active", item.getAttribute("href") === `#${entry.target.id}`);
      });
    });
  },
  {
    rootMargin: "-35% 0px -55% 0px",
  }
);

sections.forEach((section) => activeSectionObserver.observe(section));
