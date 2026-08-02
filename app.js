(function () {
  const dict = window.ONESITE_I18N || { en: {}, ru: {} };
  const root = document.documentElement;
  const form = document.getElementById("lead-form");
  const success = document.getElementById("form-success");
  const menuToggle = document.querySelector(".menu-toggle");
  const mobileNav = document.getElementById("mobile-nav");
  const submitBtn = form ? form.querySelector('[type="submit"]') : null;
  const menuLabel = document.querySelector("[data-menu-label]");
  const desktopQuery = window.matchMedia("(min-width: 900px)");

  const state = {
    lang: root.lang === "ru" ? "ru" : "en",
    theme: root.getAttribute("data-theme") === "dark" ? "dark" : "light",
    need: "",
    budget: "",
    submitting: false,
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
    state.lang = lang === "ru" ? "ru" : "en";
    root.lang = state.lang;
    document.querySelectorAll("[data-lang]").forEach((btn) => {
      btn.setAttribute("aria-pressed", String(btn.getAttribute("data-lang") === state.lang));
    });
    try {
      localStorage.setItem("onesite-lang", state.lang);
    } catch (e) {}
    applyI18n();
    if (state.submitting && submitBtn) submitBtn.textContent = t("form.submitting");
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

  function hideSuccess() {
    if (success) success.classList.remove("visible");
  }

  function selectChip(fieldName, chip) {
    const field = document.querySelector(`[data-field="${fieldName}"]`);
    if (!field || !chip) return;
    const chips = Array.from(field.querySelectorAll('[role="radio"]'));
    chips.forEach((c) => {
      const on = c === chip;
      c.setAttribute("aria-checked", String(on));
      c.tabIndex = on ? 0 : -1;
    });
    state[fieldName] = chip.getAttribute("data-value") || "";
    field.classList.remove("has-error");
    hideSuccess();
    chip.focus();
  }

  function bindChipGroup(fieldName) {
    const field = document.querySelector(`[data-field="${fieldName}"]`);
    if (!field) return;
    const group = field.querySelector('[role="radiogroup"]');
    const chips = Array.from(field.querySelectorAll('[role="radio"]'));

    chips.forEach((chip, index) => {
      chip.addEventListener("click", () => selectChip(fieldName, chip));
      chip.addEventListener("keydown", (event) => {
        let next = null;
        if (event.key === "ArrowRight" || event.key === "ArrowDown") {
          next = chips[(index + 1) % chips.length];
        } else if (event.key === "ArrowLeft" || event.key === "ArrowUp") {
          next = chips[(index - 1 + chips.length) % chips.length];
        } else if (event.key === " " || event.key === "Enter") {
          event.preventDefault();
          selectChip(fieldName, chip);
          return;
        } else {
          return;
        }
        event.preventDefault();
        selectChip(fieldName, next);
      });
    });

    if (group) {
      group.addEventListener("focusin", () => {
        const checked = chips.find((c) => c.getAttribute("aria-checked") === "true") || chips[0];
        if (checked && document.activeElement === group) checked.focus();
      });
    }
  }

  function clearErrors() {
    document.querySelectorAll(".field.has-error").forEach((el) => el.classList.remove("has-error"));
    document.querySelectorAll("[aria-invalid]").forEach((el) => el.removeAttribute("aria-invalid"));
  }

  function setError(name) {
    const field = document.querySelector(`[data-field="${name}"]`);
    if (!field) return;
    field.classList.add("has-error");
    const control = field.querySelector("input, textarea, [role='radiogroup']");
    if (control) {
      if (control.matches("input, textarea")) control.setAttribute("aria-invalid", "true");
    }
  }

  function validate() {
    clearErrors();
    let ok = true;
    const name = (document.getElementById("name") || {}).value || "";
    const contact = (document.getElementById("contact") || {}).value || "";
    const about = (document.getElementById("about") || {}).value || "";

    if (!state.need) {
      setError("need");
      ok = false;
    }
    if (!state.budget) {
      setError("budget");
      ok = false;
    }
    if (!name.trim()) {
      setError("name");
      ok = false;
    }
    if (!contact.trim()) {
      setError("contact");
      ok = false;
    }
    if (!about.trim()) {
      setError("about");
      ok = false;
    }
    return ok;
  }

  function resetForm() {
    if (!form) return;
    form.reset();
    state.need = "";
    state.budget = "";
    ["need", "budget"].forEach((fieldName) => {
      const field = document.querySelector(`[data-field="${fieldName}"]`);
      if (!field) return;
      const chips = Array.from(field.querySelectorAll('[role="radio"]'));
      chips.forEach((c, i) => {
        c.setAttribute("aria-checked", "false");
        c.tabIndex = i === 0 ? 0 : -1;
      });
    });
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

  bindChipGroup("need");
  bindChipGroup("budget");

  if (form) {
    form.addEventListener("submit", (event) => {
      event.preventDefault();
      if (state.submitting) return;
      if (!validate()) return;

      state.submitting = true;
      if (submitBtn) {
        submitBtn.disabled = true;
        submitBtn.textContent = t("form.submitting");
      }

      window.setTimeout(() => {
        state.submitting = false;
        resetForm();
        if (success) {
          const title = success.querySelector("strong");
          const body = success.querySelector("p");
          if (title) title.textContent = t("form.successTitle");
          if (body) body.textContent = t("form.successBody");
          success.classList.remove("visible");
          void success.offsetWidth;
          success.classList.add("visible");
          success.setAttribute("tabindex", "-1");
          success.focus();
        }
        if (submitBtn) {
          submitBtn.disabled = false;
          submitBtn.textContent = t("form.submit");
        }
      }, 260);
    });

    ["name", "contact", "about"].forEach((id) => {
      const el = document.getElementById(id);
      if (!el) return;
      el.addEventListener("input", () => {
        const field = document.querySelector(`[data-field="${id}"]`);
        if (field) field.classList.remove("has-error");
        el.removeAttribute("aria-invalid");
        hideSuccess();
      });
    });
  }

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
