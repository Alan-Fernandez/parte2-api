/**
 * Footer modular
 *
 * Responsável por:
 * - Carregar o HTML/CSS do rodapé via fetch;
 * - Atualizar imagens dependentes do tema (se disponível);
 * - Funcionar de forma segura, sem quebrar a página se o footer falhar.
 */
export async function loadFooter() {
  try {
    const res = await fetch('/footer');
    if (!res.ok) throw new Error('Falha ao carregar footer');

    const html = await res.text();
    const slot = document.getElementById('footer');
    if (slot) slot.innerHTML = html;
    if (!document.querySelector('link[href$="/static/css/footer.css"]')) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = '/static/css/footer.css';
      document.head.appendChild(link);
    }
  } catch (e) {
    console.error('[Footer] Erro ao carregar:', e);
  }
}
