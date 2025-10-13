/**
 * Script global de alternância de tema (claro/escuro)
 *
 * Responsável por:
 * - Detectar a preferência de tema do sistema (OS);
 * - Aplicar e salvar a escolha do usuário no localStorage;
 * - Alternar o tema ao clicar no botão com id "btnTema";
 * - Adicionar/remover a classe `.theme-dark` no elemento <html>.
 *
 * Valores possíveis no localStorage:
 * - "claro"  → tema claro (padrão);
 * - "escuro" → tema escuro.
 */
(function () {
  const CHAVE = "theme";
  const html = document.documentElement;
  const btn = document.getElementById("btnTema");
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /**
   * Aplica o tema ao documento e salva no localStorage.
   * @param {"claro"|"escuro"} tema - Tema a ser aplicado
   */
  function aplicarTema(tema) {
    const val = (tema === 'escuro') ? 'dark' : (tema === 'claro') ? 'light' : tema;
    if (val === "dark") {
      html.classList.add("theme-dark");
      btn?.setAttribute("aria-pressed", "true");
    } else {
      html.classList.remove("theme-dark");
      btn?.setAttribute("aria-pressed", "false");
    }

    try {
      localStorage.setItem(CHAVE, val);
    } catch (e) {
      console.warn("[Tema] Falha ao salvar preferência no localStorage:", e);
      try {
        window.dispatchEvent(
          new CustomEvent("theme-storage-error", { detail: { message: String(e) } })
        );
      } catch {}
    }
    try {
      window.dispatchEvent(new CustomEvent('themechange', { detail: { theme: val } }));
    } catch {}
  }

  const salvo = (() => {
    try {
      return localStorage.getItem(CHAVE) || localStorage.getItem('temaPreferido');
    } catch {
      return null;
    }
  })();

  if (salvo === "light" || salvo === "dark" || salvo === "claro" || salvo === "escuro") {
    aplicarTema(salvo);
  } else {
    const prefereEscuro =
      window.matchMedia?.("(prefers-color-scheme: dark)")?.matches;
    aplicarTema(prefereEscuro ? "dark" : "light");
  }

  btn?.addEventListener("click", () => {
    const ehEscuro = html.classList.contains("theme-dark");
    aplicarTema(ehEscuro ? "light" : "dark");
  });

  function setupGlobalReveals() {
    const els = Array.from(document.querySelectorAll('.reveal'));
    if (!els.length) return;
    if (prefersReduced || !('IntersectionObserver' in window)) {
      els.forEach(el => el.classList.add('is-visible'));
      return;
    }
    const io = new IntersectionObserver((entries, obs) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          obs.unobserve(entry.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '40px' });
    els.forEach(el => io.observe(el));
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', setupGlobalReveals);
  else setupGlobalReveals();
})();
