/**
 * Script principal da página de usuários
 * - Busca dados da API `/api/usuarios`
 * - Renderiza cards dinamicamente com filtros e paginação
 * - Aplica skeletons, reveals e crossfade na paginação
 */
(function () {
  const lista = document.getElementById('listaUsuarios');
  const statusEl = document.getElementById('status');
  const form = document.getElementById('formFiltro');
  const campoBusca = document.getElementById('campoBusca');
  const campoEstado = document.getElementById('campoEstado');
  const campoCidade = document.getElementById('campoCidade');
  const btnPrev = document.getElementById('btnPrev');
  const btnNext = document.getElementById('btnNext');
  const paginacaoInfo = document.getElementById('paginacaoInfo');
  const pager = document.getElementById('pager');
  const listaEstados = document.getElementById('listaEstados');
  const listaCidades = document.getElementById('listaCidades');
  const btnLimpar = document.getElementById('btnLimpar');
  const listaSection = document.querySelector('section.lista');

  const PER_PAGE = 9;
  let page = 1;
  const cachedEstados = new Set();
  const cachedCidades = new Set();
  let isLoading = false;
  const prefersReduced = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/**
 * Renderiza skeletons para a lista de usuários
 * @param {number} [qtd=PER_PAGE] Quantidade de skeletons a ser renderizada
 */
  function renderSkeletons(qtd = PER_PAGE) {
    if (!lista) return;
    lista.innerHTML = '';
    const frag = document.createDocumentFragment();
    for (let i = 0; i < qtd; i++) {
      const li = document.createElement('li');
      li.className = 'skeleton';
      li.innerHTML = `
        <div class="sk-media"></div>
        <div class="sk-content">
          <div class="sk-line lg"></div>
          <div class="sk-line md"></div>
          <div class="sk-line sm"></div>
        </div>`;
      frag.appendChild(li);
    }
    lista.appendChild(frag);
  }

  function setupReveals(targets) {
    if (prefersReduced || !('IntersectionObserver' in window)) {
      targets.forEach(el => el.classList.add('is-visible'));
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
    targets.forEach(el => io.observe(el));
  }

  function parseInitialStateFromUrl() {
    const params = new URLSearchParams(window.location.search);
    const qp = params.get('q');
    const est = params.get('estado');
    const cid = params.get('cidade');
    const pg = parseInt(params.get('page') || '1', 10);
    if (campoBusca && qp) campoBusca.value = qp;
    if (campoEstado && est) campoEstado.value = est;
    if (campoCidade && cid) campoCidade.value = cid;
    if (!Number.isNaN(pg) && pg > 0) page = pg;
  }

/**
 * Atualiza a URL com base nos campos de busca
 *
 * @param {boolean} [push=false] - Se true, utiliza o método pushState para atualizar a história do navegador
 */

  function updateUrl(push = false) {
    const params = new URLSearchParams();
    const q = campoBusca?.value.trim() || '';
    const estado = campoEstado?.value.trim() || '';
    const cidade = campoCidade?.value.trim() || '';
    if (q) params.set('q', q);
    if (estado) params.set('estado', estado);
    if (cidade) params.set('cidade', cidade);
    params.set('page', String(page));
    const newUrl = `${window.location.pathname}?${params.toString()}`;
    push ? window.history.pushState({}, '', newUrl) : window.history.replaceState({}, '', newUrl);
  }

  function addPageButton(p, currentPage) {
    const li = document.createElement('li');
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.textContent = String(p);
    btn.setAttribute('aria-label', `Ir para a página ${p}`);
    if (p === currentPage) {
      btn.setAttribute('aria-current', 'page');
      btn.classList.add('active');
      btn.disabled = true;
    }
    btn.addEventListener('click', () => { page = p; updateUrl(true); fadeAndLoad(); setTimeout(() => btn.focus(), 10); });
    li.appendChild(btn);
    pager.appendChild(li);
  }

  function addEllipsis() {
    const li = document.createElement('li');
    li.className = 'ellipsis';
    li.setAttribute('aria-hidden', 'true');
    li.textContent = '…';
    pager.appendChild(li);
  }

/**
 * Renderiza a paginação com base nos parâmetros dados.
 * Se total_pages for menor ou igual a 2, renderiza apenas um botão com o número da página atual.
 * Caso contrário, renderiza uma janela de 5 botões com base na página atual:
 *   - Primeira página
 *   - Páginas entre currentPage - half e currentPage + half
 *   - Última página
 *   - Se necessário, adiciona um botão de reticências entre a primeira e a última página
 *   - Se necessário, adiciona um botão de reticências entre a página atual e a última página
 *
 * @param {number} currentPage - Número da página atual
 * @param {boolean} hasNext - Se houver mais resultados
 * @param {number} totalPages - Número total de páginas
 */
  function renderPager(currentPage, hasNext, totalPages) {
    if (!pager) return;
    pager.innerHTML = '';
    pager.setAttribute('role', 'list');
    if (!totalPages || totalPages < 2) return addPageButton(currentPage, currentPage);

    const first = 1, last = totalPages, windowSize = 5;
    const half = Math.floor(windowSize / 2);
    let start = Math.max(first, currentPage - half);
    let end = Math.min(last, currentPage + half);
    if (end - start + 1 < windowSize) {
      const deficit = windowSize - (end - start + 1);
      start = Math.max(first, start - deficit);
      end = Math.min(last, start + windowSize - 1);
    }
    addPageButton(first, currentPage);
    if (start > first + 1) addEllipsis();
    for (let p = Math.max(start, first + 1); p <= Math.min(end, last - 1); p++) addPageButton(p, currentPage);
    if (end < last - 1) addEllipsis();
    if (last > first) addPageButton(last, currentPage);
  }

  function setStatus(msg) { if (statusEl) statusEl.textContent = msg || ''; }

  function criarCard(u) {
    const li = document.createElement('li');
    li.className = 'card';
    li.innerHTML = `
      <figure class="card__mídia">
        <img src="${u.foto}" alt="Foto de perfil de ${u.nome}" loading="lazy" decoding="async" />
      </figure>
      <section class="card__conteudo">
        <h2 class="card__titulo">${u.nome}</h2>
        <p class="card__texto">${u.email}</p>
        ${u.cidade ? `<p class="card__texto">${u.cidade}${u.estado ? ", " + u.estado : ""}${u.pais ? " - " + u.pais : ""}</p>` : ''}
        ${u.telefone ? `<p class="card__texto">${u.telefone}</p>` : ''}
      </section>`;
    return li;
  }


/**
 * Preenche as listas de estados e cidades com os dados da
 * lista de usuários.
 *
 * Itera sobre a lista de usuários e adiciona cada estado
 * e cidade encontrada às respectivas listas
 * `cachedEstados` e `cachedCidades`. Em seguida,
 * preenche as select options com os valores
 * presentes nas listas `cachedEstados` e `cachedCidades`.
 *
 * Se a lista de usuários for nula ou não for um array,
 * não faz nada.
 */

  function fillDatalists(usuarios) {
    if (!Array.isArray(usuarios)) return;
    for (const u of usuarios) {
      if (u.estado) cachedEstados.add(u.estado);
      if (u.cidade) cachedCidades.add(u.cidade);
    }
    if (listaEstados) {
      listaEstados.innerHTML = '';
      Array.from(cachedEstados).sort().forEach(e => {
        const opt = document.createElement('option'); opt.value = e; listaEstados.appendChild(opt);
      });
    }
    if (listaCidades) {
      listaCidades.innerHTML = '';
      Array.from(cachedCidades).sort().forEach(c => {
        const opt = document.createElement('option'); opt.value = c; listaCidades.appendChild(opt);
      });
    }
  }

  function buildCardsWithImages(usuarios) {
    const frag = document.createDocumentFragment();
    const images = [];
    for (const u of usuarios) {
      const card = criarCard(u);
      const img = card.querySelector('img');
      if (img) images.push(img);
      frag.appendChild(card);
    }
    return { frag, images };
  }

  function waitForImages(imgs, timeoutMs = 450) {
    const list = Array.isArray(imgs) ? imgs : [];
    const supportsDecode = list.every(img => 'decode' in img);
    if (!supportsDecode || !list.length) return Promise.resolve();
    const decoders = list.map(img => img.decode().catch(() => {}));
    return Promise.race([
      Promise.allSettled(decoders),
      new Promise(res => setTimeout(res, timeoutMs))
    ]);
  }

/**
 * Ativa ou desativa a opção de paginação
 * @param {boolean} disabled - Se true, desativa a opção de paginação
 * @returns {undefined}
 */
  function togglePagerDisabled(disabled) {
    if (btnPrev) btnPrev.disabled = disabled || page <= 1;
    if (btnNext) btnNext.disabled = disabled ? true : btnNext.disabled;
    if (!pager) return;
    Array.from(pager.querySelectorAll('button')).forEach(b => b.disabled = !!disabled);
  }

/**
 * Carrega a lista de usuários com skeletons e fade-in
 *
 * @param {Object} [opts] - Opcional object with properties
 * @param {boolean} [opts.useSkeleton=true] - Whether to render skeletons or not
 *
 * @returns {Promise<void>} - Promise that resolves when the list is loaded
 */
  async function carregar(opts = { useSkeleton: true }) {
    if (isLoading) return;
    isLoading = true;
    const q = campoBusca?.value.trim() || '';
    const estado = campoEstado?.value.trim() || '';
    const cidade = campoCidade?.value.trim() || '';
    const url = new URL(window.location.origin + '/api/usuarios');
    url.searchParams.set('results', String(PER_PAGE));
    url.searchParams.set('page', String(page));
    if (q) url.searchParams.set('q', q);
    if (estado) url.searchParams.set('estado', estado);
    if (cidade) url.searchParams.set('cidade', cidade);

  setStatus('');
  listaSection && listaSection.setAttribute('aria-busy', 'true');
    if (opts.useSkeleton) renderSkeletons();
    togglePagerDisabled(true);
    try {
      const resp = await fetch(url.toString());
      if (!resp.ok) throw new Error(`Erro ${resp.status}`);
      const data = await resp.json();

      if (lista) lista.innerHTML = '';
      if (Array.isArray(data.usuarios) && data.usuarios.length) {
        const { frag, images } = buildCardsWithImages(data.usuarios);
        await waitForImages(images, 450);
        lista.appendChild(frag);
        Array.from(lista.children).forEach(el => el.classList.add('reveal'));
        setupReveals(Array.from(lista.querySelectorAll('.reveal')));
        fillDatalists(data.usuarios);
        setStatus(`${data.total} usuário(s) encontrados nesta página.`);
        paginacaoInfo && (paginacaoInfo.textContent = `Página ${data.page}`);
        btnPrev && (btnPrev.disabled = page <= 1);
        const hasNext = typeof data.total_pages === 'number' ? page < data.total_pages : (data.usuarios.length === PER_PAGE);
        btnNext && (btnNext.disabled = !hasNext);
        renderPager(page, hasNext, data.total_pages);
        updateUrl(false);
        try {
          const main = document.getElementById('conteudo');
          const header = document.querySelector('.header');
          const h = header?.offsetHeight || 0;
          const top = (main?.getBoundingClientRect().top || 0) + window.scrollY - h;
          window.scrollTo({ top, behavior: prefersReduced ? 'auto' : 'smooth' });
        } catch {}
      } else {
        setStatus('Nenhum usuário encontrado.');
        paginacaoInfo && (paginacaoInfo.textContent = `Página ${page}`);
        btnNext && (btnNext.disabled = true);
        renderPager(page, false, 1);
        updateUrl(false);
      }
    } catch (e) {
      console.error(e);
      setStatus('Falha ao carregar dados. Tente novamente.');
    } finally {
      togglePagerDisabled(false);
      isLoading = false;
      listaSection && listaSection.setAttribute('aria-busy', 'false');
    }
  }

  function debounce(fn, delay) { let t; return (...args) => { clearTimeout(t); t = setTimeout(() => fn(...args), delay); }; }

  form && form.addEventListener('submit', ev => { ev.preventDefault(); page = 1; updateUrl(true); fadeAndLoad(); });
  campoBusca && campoBusca.addEventListener('input', debounce(() => { page = 1; updateUrl(false); fadeAndLoad(); }, 300));
  campoEstado && campoEstado.addEventListener('input', debounce(() => { page = 1; updateUrl(false); fadeAndLoad(); }, 300));
  campoCidade && campoCidade.addEventListener('input', debounce(() => { page = 1; updateUrl(false); fadeAndLoad(); }, 300));
  btnPrev && btnPrev.addEventListener('click', () => { if (page > 1) { page--; updateUrl(true); fadeAndLoad(); } });
  btnNext && btnNext.addEventListener('click', () => { page++; updateUrl(true); fadeAndLoad(); });
  btnLimpar && btnLimpar.addEventListener('click', () => {
    campoBusca && (campoBusca.value = '');
    campoEstado && (campoEstado.value = '');
    campoCidade && (campoCidade.value = '');
    cachedEstados.clear(); cachedCidades.clear();
    listaEstados && (listaEstados.innerHTML = '');
    listaCidades && (listaCidades.innerHTML = '');
    page = 1; updateUrl(true); fadeAndLoad();
  });

  parseInitialStateFromUrl();
  carregar();
  window.addEventListener('popstate', () => { parseInitialStateFromUrl(); fadeAndLoad(); });

/**
 * Carrega a lista de usuários com skeletons e fade-in
 *
 * @returns {Promise<void>} Promessa que resolve quando a lista for carregada
 */
  function fadeAndLoad() {
    return carregar({ useSkeleton: true });
  }
})();
