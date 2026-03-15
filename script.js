/* =========================
   CONFIG (FACIL DE EDITAR)
   =========================
   EDITAR WHATSAPP:
   - Cambia el numero de destino aqui.
   - Formato para wa.me: solo numeros, sin +, sin espacios.
*/

const WHATSAPP_NUMBER = "8299146322";

/* =========================
   Helpers
   ========================= */

function $(selector, root = document) {
  return root.querySelector(selector);
}

function $all(selector, root = document) {
  return Array.from(root.querySelectorAll(selector));
}

function setHeaderScrolledState() {
  const header = $("[data-header]");
  if (!header) return;
  header.classList.toggle("is-scrolled", window.scrollY > 6);
}

function closeMenu() {
  const menuButton = $("[data-menu-btn]");
  if (!menuButton) return;
  document.body.classList.remove("is-menu-open");
  menuButton.setAttribute("aria-expanded", "false");
}

function openMenu() {
  const menuButton = $("[data-menu-btn]");
  if (!menuButton) return;
  document.body.classList.add("is-menu-open");
  menuButton.setAttribute("aria-expanded", "true");
}

/* =========================
   Init
   ========================= */

let selectedPlan = "";

document.addEventListener("DOMContentLoaded", () => {
  // Año en el footer
  const year = $("[data-year]");
  if (year) year.textContent = String(new Date().getFullYear());

  // Header shadow on scroll
  setHeaderScrolledState();
  window.addEventListener("scroll", setHeaderScrolledState, { passive: true });

  // Mobile menu
  const menuButton = $("[data-menu-btn]");
  if (menuButton) {
    menuButton.addEventListener("click", () => {
      const isOpen = document.body.classList.contains("is-menu-open");
      if (isOpen) closeMenu();
      else openMenu();
    });
  }

  // Close menu when clicking any nav link (mobile)
  const nav = $("[data-nav]");
  if (nav) {
    nav.addEventListener("click", (event) => {
      const link = event.target.closest("a");
      if (!link) return;
      closeMenu();
    });
  }

  // Close on Escape
  window.addEventListener("keydown", (event) => {
    if (event.key === "Escape") closeMenu();
  });

  // Close on resize (avoid stuck menu state)
  window.addEventListener(
    "resize",
    () => {
      if (window.innerWidth > 760) closeMenu();
    },
    { passive: true }
  );

  // Capturar el plan elegido (opcional, pero util)
  $all("[data-plan]").forEach((button) => {
    button.addEventListener("click", () => {
      selectedPlan = String(button.getAttribute("data-plan") || "").trim();
    });
  });

  // Reveal animations
  setupReveal();

  // Contact form -> WhatsApp
  setupWhatsAppForm();
});

/* =========================
   Reveal + Counters
   ========================= */

function setupReveal() {
  const revealNodes = $all("[data-reveal]");
  if (!revealNodes.length) return;

  const counters = new WeakSet();

  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add("is-revealed");

        // Animar contadores solo una vez
        const counterEls = $all("[data-counter]", entry.target);
        counterEls.forEach((el) => {
          if (counters.has(el)) return;
          counters.add(el);
          animateCounter(el);
        });

        observer.unobserve(entry.target);
      });
    },
    { threshold: 0.12 }
  );

  revealNodes.forEach((node) => observer.observe(node));
}

function animateCounter(el) {
  const target = Number(el.getAttribute("data-counter") || "0");
  if (!Number.isFinite(target) || target <= 0) return;

  const duration = 800;
  const start = performance.now();

  function tick(now) {
    const t = Math.min(1, (now - start) / duration);
    const eased = 1 - Math.pow(1 - t, 3); // easeOutCubic
    const value = Math.round(target * eased);
    el.textContent = String(value);
    if (t < 1) requestAnimationFrame(tick);
  }

  requestAnimationFrame(tick);
}

/* =========================
   WhatsApp Form
   ========================= */

function setupWhatsAppForm() {
  const form = $("[data-contact-form]");
  if (!form) return;

  const errorBox = $("[data-form-error]", form);

  form.addEventListener("submit", (event) => {
    event.preventDefault();
    if (errorBox) {
      errorBox.hidden = true;
      errorBox.textContent = "";
    }

    const data = new FormData(form);
    const nombre = String(data.get("nombre") || "").trim();
    const negocio = String(data.get("negocio") || "").trim();
    const email = String(data.get("email") || "").trim();
    const whatsapp = String(data.get("whatsapp") || "").trim();
    const tipo = String(data.get("tipo") || "").trim();

    // Validacion simple (el HTML ya marca required, esto es un extra)
    if (!nombre || !negocio || !email || !whatsapp || !tipo) {
      showFormError(errorBox, "Por favor completa todos los campos para abrir WhatsApp con el mensaje.");
      return;
    }

    const lines = [
      "Hola, me interesa una página web.",
      "",
      `Nombre: ${nombre}`,
      `Negocio: ${negocio}`,
      `Email: ${email}`,
      `WhatsApp: ${whatsapp}`,
      `Tipo de página: ${tipo}`,
    ];

    if (selectedPlan) lines.push(`Plan interesado: ${selectedPlan}`);

    lines.push("", "Gracias.");

    const text = encodeURIComponent(lines.join("\n"));
    const url = `https://wa.me/${WHATSAPP_NUMBER}?text=${text}`;

    // Intentar abrir en nueva pestaña; fallback si el navegador bloquea popups.
    const win = window.open(url, "_blank", "noopener,noreferrer");
    if (!win) window.location.href = url;
  });
}

function showFormError(errorBox, message) {
  if (!errorBox) return;
  errorBox.textContent = message;
  errorBox.hidden = false;
}
