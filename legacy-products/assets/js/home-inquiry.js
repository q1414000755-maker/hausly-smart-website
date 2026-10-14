(() => {
  const form = document.querySelector("[data-home-inquiry]");
  if (!form) return;

  const status = form.querySelector("[data-home-inquiry-status]");

  // 2026-09-18: the old build moved the Connectivity fieldset to the end of the
  // form with JS, which left the field legends numbered 1 / 6 / 3 / 4 / 5 and
  // made the section order disagree with the 01 Products → 02 Purchase → 03
  // Contact step bar. Connectivity now sits in its real DOM place (2), so the
  // legends run 1–6 and no client-side reordering is needed.

  const summary = document.querySelector(".home-inquiry-summary");
  const desktopLayout = window.matchMedia("(min-width: 1181px)");
  // The two panels are meant to read as one block, so the form is stretched to
  // the summary's height. It must never be squeezed below its own content
  // though (an extra field would get clipped), so take the larger of the two and
  // bring the summary up to the same height.
  const syncFormHeightToSummary = () => {
    if (!summary || !desktopLayout.matches) {
      form.style.removeProperty("height");
      summary?.style.removeProperty("min-height");
      return;
    }
    form.style.removeProperty("height");
    const target = Math.max(summary.getBoundingClientRect().height, form.scrollHeight);
    form.style.height = `${target}px`;
    const current = parseFloat(summary.style.minHeight);
    if (!Number.isFinite(current) || Math.abs(current - target) > 0.5) {
      summary.style.minHeight = `${target}px`;
    }
  };

  if (summary && "ResizeObserver" in window) {
    new ResizeObserver(syncFormHeightToSummary).observe(summary);
  }
  desktopLayout.addEventListener("change", syncFormHeightToSummary);
  window.addEventListener("resize", syncFormHeightToSummary);
  requestAnimationFrame(syncFormHeightToSummary);

  const contactFields = [
    ...form.querySelectorAll('[name="name"], [name="company"], [name="email"], [name="country"]'),
  ];

  const selectedValues = (name) =>
    [...form.querySelectorAll(`[name="${name}"]:checked`)].map((input) => input.value);

  const updateSummary = () => {
    ["product", "connectivity", "projectType", "market"].forEach((name) => {
      const output = document.querySelector(`[data-home-inquiry-summary="${name}"]`);
      if (!output) return;
      const values = selectedValues(name);
      output.textContent = values.length ? values.join(", ") : "Not selected";
    });
  };

  form.addEventListener("change", updateSummary);

  // Quantity is a free-text number field, not a choice group, so it is mirrored
  // into the summary separately.
  const quantityInput = form.querySelector('[name="quantity"]');
  const syncQuantity = () => {
    const output = document.querySelector('[data-home-inquiry-summary="quantity"]');
    if (!output) return;
    const raw = quantityInput ? quantityInput.value.trim() : "";
    output.textContent = /^\d+$/.test(raw) ? `${raw} units` : "Not specified";
  };
  form.addEventListener("input", syncQuantity);

  const messageFor = (input) => {
    if (input.validity.valueMissing) {
      return `${input.closest("label")?.childNodes[0]?.textContent.trim() || "This field"} is required.`;
    }
    if (input.validity.typeMismatch && input.name === "email") {
      return "Enter a valid business email address.";
    }
    return "Check this field and try again.";
  };

  const clearError = (input) => {
    const error = form.querySelector(`[data-home-inquiry-error="${input.name}"]`);
    input.removeAttribute("aria-invalid");
    input.removeAttribute("aria-describedby");
    if (error) error.textContent = "";
  };

  const showError = (input) => {
    const error = form.querySelector(`[data-home-inquiry-error="${input.name}"]`);
    if (!error) return;
    input.setAttribute("aria-invalid", "true");
    input.setAttribute("aria-describedby", error.id);
    error.textContent = messageFor(input);
  };

  const validateContactFields = () => {
    let firstInvalid = null;
    contactFields.forEach((input) => {
      if (input.validity.valid) clearError(input);
      else {
        showError(input);
        firstInvalid ||= input;
      }
    });
    return firstInvalid;
  };

  contactFields.forEach((input) => {
    input.addEventListener("input", () => {
      if (input.validity.valid) clearError(input);
    });
    input.addEventListener("change", () => {
      if (input.validity.valid) clearError(input);
    });
  });

  document.querySelectorAll("[data-home-inquiry-edit]").forEach((button) => {
    button.addEventListener("click", () => {
      const input = form.querySelector(`[name="${button.dataset.homeInquiryEdit}"]`);
      input?.focus();
      input?.closest("fieldset")?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
  });

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const firstInvalid = validateContactFields();
    if (firstInvalid) {
      if (status) {
        status.textContent =
          "Please correct the highlighted contact fields before submitting your request.";
      }
      firstInvalid.focus();
      firstInvalid.closest("fieldset")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    if (status) status.textContent = "Your request is ready for our project team.";
  });

  updateSummary();
  syncQuantity();
})();
