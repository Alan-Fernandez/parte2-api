/**
 * Navbar modular
 *
 * Responsável por:
 * - Carregar HTML e CSS do Navbar via fetch;
 * - Sincronizar tema (light/dark) e atualizar imagens;
 * - Menu hambúrguer, scroll suave e scroll spy;
 * - Expor utilitário `applyThemeToImages`.
 */
export async function loadNavbar() {
    const response = await fetch("/navbar");
    const navbarHTML = await response.text();
    document.querySelector("#navbar").innerHTML = navbarHTML;

        if (!document.querySelector('link[href$="/static/css/navbar.css"]')) {
            const link = document.createElement('link');
            link.rel = 'stylesheet';
            link.href = '/static/css/navbar.css';
            document.head.appendChild(link);
        }

    applyInitialTheme();

    const selector = document.getElementById('themeSelector');
    if (selector) {
        const saved = localStorage.getItem('theme') || '';
        selector.value = saved === 'dark' ? 'dark' : 'light';
        selector.addEventListener('change', (e) => {
            const value = e.target.value;
            document.documentElement.classList.add('theme-animating');
            const clearThemeAnimating = () => document.documentElement.classList.remove('theme-animating');
            setTimeout(clearThemeAnimating, 260);
            if (value === 'dark') {
                document.documentElement.classList.add('theme-dark');
                localStorage.setItem('theme', 'dark');
            } else if (value === 'light') {
                document.documentElement.classList.remove('theme-dark');
                localStorage.setItem('theme', 'light');
            } else {
                document.documentElement.classList.remove('theme-dark');
                localStorage.removeItem('theme');
            }
            const theme = getCurrentTheme();
            window.dispatchEvent(new CustomEvent('themechange', { detail: { theme } }));
        });
    }

    setupNavInteractions();
    setupScrollSpy();
}

/** Aplica o tema inicial salvo no localStorage ou "light" */
function applyInitialTheme() {
    try {
        const saved = localStorage.getItem('theme');
        if (saved === 'dark') document.documentElement.classList.add('theme-dark');
        else document.documentElement.classList.remove('theme-dark');
    } catch {}
}

/** Configura menu hambúrguer, links e scroll suave */
function setupNavInteractions() {
    const hamburger = document.querySelector('.hamburger');
    const navMenu = document.querySelector('.nav-menu');
    const header = document.querySelector('.header');
    const links = document.querySelectorAll('.nav-link');
    let overlay = document.querySelector('.nav-overlay');
    if (!overlay) {
        overlay = document.createElement('div');
        overlay.className = 'nav-overlay';
        document.body.appendChild(overlay);
    }

    function setInertMain(val) {
        const main = document.getElementById('conteudo');
        main && (main.inert = val);
    }
    function closeMenu() {
        navMenu?.classList.remove('active');
        hamburger?.classList.remove('hamburger-active');
        overlay?.classList.remove('active');
        hamburger?.setAttribute('aria-expanded', 'false');
        setInertMain(false);
    }
    function openMenu() {
        navMenu?.classList.add('active');
        hamburger?.classList.add('hamburger-active');
        overlay?.classList.add('active');
        hamburger?.setAttribute('aria-expanded', 'true');
        setInertMain(true);

        const firstLink = navMenu?.querySelector('.nav-link');
        firstLink && firstLink.focus?.();
    }

    if (hamburger && navMenu) {
        hamburger.setAttribute('aria-controls', 'nav');
        hamburger.setAttribute('aria-expanded', 'false');
        hamburger.addEventListener('click', () => {
            const willOpen = !navMenu.classList.contains('active');
            willOpen ? openMenu() : closeMenu();
        });
        overlay.addEventListener('click', closeMenu);
        window.addEventListener('keydown', (e) => { if (e.key === 'Escape') closeMenu(); });
    }

    links.forEach(link => {
        link.addEventListener('click', (e) => {
            const href = link.getAttribute('href') || '';
            if (href.startsWith('#')) {
                e.preventDefault();
                links.forEach(a => a.classList.remove('active'));
                link.classList.add('active');

                const target = document.querySelector(href);
                if (target) {
                    const headerHeight = header ? header.offsetHeight : 0;
                    const y = target.getBoundingClientRect().top + window.pageYOffset - headerHeight;
                    window.scrollTo({ top: y, behavior: 'smooth' });
                }

                if (navMenu?.classList.contains('active')) closeMenu();
            }
        });
    });
}

let __spyInitialized = false;

/** Configura scroll spy, atualizando link ativo conforme scroll */
function setupScrollSpy() {
    if (__spyInitialized) return;

    const header = document.querySelector('.header');
    const links = Array.from(document.querySelectorAll('.nav-link'));
    if (!links.length) return;

    const map = new Map();
    links.forEach(link => {
        const href = link.getAttribute('href');
        if (href?.startsWith('#')) map.set(href.slice(1), link);
    });

    const collectSections = () => Array.from(map.keys())
        .map(id => document.getElementById(id))
        .filter(Boolean);

    let sections = collectSections();
    if (!sections.length) {
        const main = document.querySelector('#main');
        if (main) {
            const mo = new MutationObserver(() => {
                sections = collectSections();
                if (sections.length) {
                    mo.disconnect();
                    setupScrollSpy();
                }
            });
            mo.observe(main, { childList: true, subtree: true });
        }
        return;
    }

    const getHeaderHeight = () => header?.offsetHeight || 0;
    const setActive = (id) => {
        links.forEach(a => a.classList.remove('active'));
        map.get(id)?.classList.add('active');
    };

    let ticking = false;
    const updateActive = () => {
        ticking = false;
        const scrollPos = window.scrollY + getHeaderHeight() + 8;
        let current = sections[0];
        for (const sec of sections) if (sec.offsetTop <= scrollPos) current = sec;
        current?.id && setActive(current.id);
    };

    const requestTick = () => {
        if (!ticking) {
            requestAnimationFrame(updateActive);
            ticking = true;
        }
    };

    window.addEventListener('scroll', requestTick, { passive: true });
    window.addEventListener('resize', requestTick);

    updateActive();
    __spyInitialized = true;
}

function getCurrentTheme() {
    return document.documentElement.classList.contains('theme-dark') ? 'dark' : 'light';
}

