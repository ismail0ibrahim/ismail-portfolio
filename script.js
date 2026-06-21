const navToggle = document.querySelector(".nav-toggle");
const navLinks = document.querySelector(".nav-links");
const navItems = document.querySelectorAll(".nav-links a");
const revealItems = document.querySelectorAll(".reveal");
const sections = document.querySelectorAll("section[id]");
const year = document.querySelector("#year");

if (year) {
  year.textContent = new Date().getFullYear();
}

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
