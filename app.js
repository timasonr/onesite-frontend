(function () {
  const dict = window.ONESITE_I18N || { en: {}, ru: {} };
  const root = document.documentElement;
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const menuLabel = document.querySelector("[data-menu-label]");
  const desktopQuery = window.matchMedia("(min-width: 900px)");

  const SUPPORTED_LANGS = ["en", "ru", "de"];

  const state = {
    lang: SUPPORTED_LANGS.includes(root.lang) ? root.lang : "ru",
    theme: root.getAttribute("data-theme") === "dark" ? "dark" : "light",
  };

  function t(key) {
    const langTable = dict[state.lang] || {};
    if (Object.prototype.hasOwnProperty.call(langTable, key)) return langTable[key];
    const enTable = dict.en || {};
    if (Object.prototype.hasOwnProperty.call(enTable, key)) return enTable[key];
    return key;
  }

  function applyI18n() {
    document.querySelectorAll("[data-i18n]").forEach((el) => {
      el.textContent = t(el.getAttribute("data-i18n"));
    });

    document.querySelectorAll("[data-i18n-placeholder]").forEach((el) => {
      el.setAttribute("placeholder", t(el.getAttribute("data-i18n-placeholder")));
    });

    document.querySelectorAll("[data-i18n-alt]").forEach((el) => {
      el.setAttribute("alt", t(el.getAttribute("data-i18n-alt")));
    });

    updateMenuLabel();
    document.title = t("meta.title");
    root.classList.remove("i18n-pending");
  }

  function updateMenuLabel() {
    if (!menuToggle) return;
    const open = mobileNav && mobileNav.classList.contains("open");
    const key = open ? "nav.close" : "nav.menu";
    const label = t(key);
    if (menuLabel) menuLabel.textContent = label;
    menuToggle.setAttribute("aria-label", label);
  }

  function setLang(lang) {
    state.lang = SUPPORTED_LANGS.includes(lang) ? lang : "ru";
    root.lang = state.lang;
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === state.lang));
    });
    try {
      localStorage.setItem("onesite-lang", state.lang);
    } catch (e) {}
    applyI18n();
  }

  function setTheme(theme) {
    state.theme = theme === "dark" ? "dark" : "light";
    root.setAttribute("data-theme", state.theme);
    document.querySelectorAll("[data-theme-set]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-theme-set") === state.theme));
    });
    try {
      localStorage.setItem("onesite-theme", state.theme);
    } catch (e) {}
  }

  function closeMobileNav() {
    if (!mobileNav || !menuToggle) return;
    mobileNav.classList.remove("open");
    menuToggle.setAttribute("aria-expanded", "false");
    updateMenuLabel();
  }

  function openMobileNav() {
    if (!mobileNav || !menuToggle) return;
    mobileNav.classList.add("open");
    menuToggle.setAttribute("aria-expanded", "true");
    updateMenuLabel();
  }

  document.querySelectorAll("[data-lang]").forEach((btn) => {
    btn.addEventListener("click", () => setLang(btn.getAttribute("data-lang")));
  });

  document.querySelectorAll("[data-theme-set]").forEach((btn) => {
    btn.addEventListener("click", () => setTheme(btn.getAttribute("data-theme-set")));
  });

  if (menuToggle && mobileNav) {
    menuToggle.addEventListener("click", () => {
      if (mobileNav.classList.contains("open")) closeMobileNav();
      else openMobileNav();
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape") closeMobileNav();
    });

    document.addEventListener("click", (event) => {
      if (!mobileNav.classList.contains("open")) return;
      const inside = mobileNav.contains(event.target) || menuToggle.contains(event.target);
      if (!inside) closeMobileNav();
    });

    const onViewportChange = () => {
      if (desktopQuery.matches) closeMobileNav();
    };
    if (desktopQuery.addEventListener) desktopQuery.addEventListener("change", onViewportChange);
    else desktopQuery.addListener(onViewportChange);
  }

  document.querySelectorAll('a[href^="#"]').forEach((link) => {
    link.addEventListener("click", () => closeMobileNav());
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion && "IntersectionObserver" in window) {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));
  } else {
    document.querySelectorAll(".reveal").forEach((el) => el.classList.add("is-visible"));
  }

  const marquee = document.querySelector("[data-marquee] .marquee-track");
  if (marquee) {
    marquee.innerHTML += marquee.innerHTML;
  }

  const stage = document.querySelector("[data-hero-stage] .hero-collage");
  if (stage && !reduceMotion) {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(() => {
        const y = Math.min(window.scrollY, 700);
        stage.style.transform = `translate3d(0, ${y * 0.18}px, 0)`;
        ticking = false;
      });
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
  }

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightbox-img");
  function closeLightbox() {
    if (!lightbox) return;
    lightbox.hidden = true;
    if (lightboxImg) {
      lightboxImg.removeAttribute("src");
      lightboxImg.alt = "";
    }
  }
  function openLightbox(src, alt) {
    if (!lightbox || !lightboxImg) return;
    lightboxImg.src = src;
    lightboxImg.alt = alt || "";
    lightbox.hidden = false;
  }
  document.querySelectorAll("[data-lightbox]").forEach((btn) => {
    btn.addEventListener("click", () => {
      const img = btn.querySelector("img");
      if (!img) return;
      openLightbox(img.currentSrc || img.src, img.alt);
    });
  });
  if (lightbox) {
    lightbox.addEventListener("click", (event) => {
      if (event.target === lightbox || event.target.hasAttribute("data-lightbox-close")) closeLightbox();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeLightbox();
  });

  setLang(state.lang);
  setTheme(state.theme);
})();
