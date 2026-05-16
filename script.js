/* ── Theme toggle ───────────────────────────────────── */
const root        = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

themeToggle.addEventListener('click', () => {
  const isDark = root.getAttribute('data-theme') === 'dark';
  const next   = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

/* ── Greeting ────────────────────────────────────────── */
(function () {
  const hour = new Date().getHours();
  let text;
  if      (hour >= 5  && hour < 12) text = 'Good morning';
  else if (hour >= 12 && hour < 17) text = 'Good afternoon';
  else if (hour >= 17 && hour < 21) text = 'Good evening';
  else                               text = 'Good night';
  const el = document.getElementById('greeting');
  if (el) el.textContent = text;
})();

/* ── Nav toggle ─────────────────────────────────────── */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = nav.querySelectorAll('a');

navToggle.addEventListener('click', () => {
  const open = nav.classList.toggle('open');
  navToggle.setAttribute('aria-expanded', String(open));
});

navLinks.forEach(link => link.addEventListener('click', () => {
  nav.classList.remove('open');
  navToggle.setAttribute('aria-expanded', 'false');
}));

/* ── Reveal on scroll ───────────────────────────────── */
const revealEls = document.querySelectorAll('.reveal');

const revealObserver = new IntersectionObserver(
  entries => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  },
  { threshold: 0.08, rootMargin: '0px 0px -28px 0px' }
);

// Hero elements stagger: eyebrow → h1 → lead → buttons
document.querySelectorAll('.hero .reveal').forEach((el, i) => {
  el.style.transitionDelay = `${i * 100}ms`;
});

revealEls.forEach(el => revealObserver.observe(el));

/* ── Portfolio tabs ─────────────────────────────────── */
const tabBtns = document.querySelectorAll('.tab-btn');
const tabPanels = document.querySelectorAll('.tab-panel');

tabBtns.forEach(btn => {
  btn.addEventListener('click', () => {
    const target = btn.dataset.tab;

    tabBtns.forEach(b => {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    tabPanels.forEach(p => p.classList.add('hidden'));

    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    document.getElementById(`tab-${target}`).classList.remove('hidden');
  });
});

/* ── Active nav link on scroll ──────────────────────── */
const sections = document.querySelectorAll('main section[id]');

const setActive = () => {
  let current = '';
  sections.forEach(section => {
    if (window.scrollY >= section.offsetTop - 130) {
      current = section.id;
    }
  });
  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === `#${current}`);
  });
};

window.addEventListener('scroll', setActive, { passive: true });
setActive();

/* ── GitHub Repos ───────────────────────────────────── */
const GITHUB_USER = 'WaleedMehmadi';
const REPO_PER_PAGE = 6;

const LANG_COLORS = {
  JavaScript:  '#f1e05a',
  TypeScript:  '#2b7489',
  Python:      '#3572a5',
  Java:        '#b07219',
  HTML:        '#e34c26',
  CSS:         '#563d7c',
  'C++':       '#f34b7d',
  C:           '#555555',
  Shell:       '#89e051',
  Ruby:        '#701516',
  Go:          '#00add8',
  Rust:        '#dea584',
  Swift:       '#f05138',
  Kotlin:      '#a97bff',
  PHP:         '#4f5d95',
  Dart:        '#00b4ab',
};

function formatRelativeDate(dateStr) {
  const diff = Date.now() - new Date(dateStr).getTime();
  const days = Math.floor(diff / 86400000);
  if (days < 1)  return 'Today';
  if (days < 7)  return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  if (days < 365) return `${Math.floor(days / 30)}mo ago`;
  return `${Math.floor(days / 365)}y ago`;
}

function buildSkeletons(count = REPO_PER_PAGE) {
  return Array.from({ length: count }, () => `
    <div class="repo-skeleton">
      <div class="sk-line w-60"></div>
      <div class="sk-line w-100"></div>
      <div class="sk-line w-80"></div>
      <div class="sk-line w-40" style="margin-top:8px"></div>
    </div>
  `).join('');
}

function buildRepoCard(repo) {
  const lang = repo.language;
  const dot  = lang
    ? `<span class="lang-dot" style="background:${LANG_COLORS[lang] || '#8b8fa8'}"></span><span class="repo-lang">${lang}</span>`
    : '';
  const stars = repo.stargazers_count > 0
    ? `<span class="repo-stars">★ ${repo.stargazers_count}</span>`
    : '';

  return `
    <article class="card repo-card">
      <div class="repo-top">
        <h3 class="repo-name">
          <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer">${repo.name.replace(/-/g, '-​')}</a>
        </h3>
        ${stars}
      </div>
      <p class="repo-desc">${repo.description ? repo.description : '<em>No description</em>'}</p>
      <div class="repo-meta">
        <span class="repo-lang-wrap">${dot}</span>
        <span class="repo-date">Updated ${formatRelativeDate(repo.pushed_at)}</span>
      </div>
      <div class="project-action">
        <a href="${repo.html_url}" target="_blank" rel="noopener noreferrer" class="demo-btn">View Repository</a>
      </div>
    </article>
  `;
}

async function loadRepos(sort = 'pushed') {
  const loading = document.getElementById('repo-loading');
  const grid    = document.getElementById('repo-grid');
  const error   = document.getElementById('repo-error');

  loading.innerHTML = buildSkeletons();
  loading.classList.remove('hidden');
  grid.classList.add('hidden');
  error.classList.add('hidden');

  try {
    const url = `https://api.github.com/users/${GITHUB_USER}/repos?sort=${sort}&per_page=${REPO_PER_PAGE}&type=public`;
    const res  = await fetch(url, { headers: { Accept: 'application/vnd.github+json' } });
    if (!res.ok) throw new Error(`${res.status}`);
    const repos = await res.json();

    loading.classList.add('hidden');

    if (!repos.length) {
      error.querySelector('p').textContent = 'No public repositories found.';
      error.classList.remove('hidden');
      return;
    }

    grid.innerHTML = repos.map(buildRepoCard).join('');
    grid.classList.remove('hidden');

    grid.querySelectorAll('.repo-card').forEach((card, i) => {
      card.style.animationDelay = `${i * 60}ms`;
      card.classList.add('reveal', 'visible');
    });
  } catch {
    loading.classList.add('hidden');
    error.classList.remove('hidden');
  }
}

document.querySelectorAll('.sort-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.sort-btn').forEach(b => {
      b.classList.remove('active');
    });
    btn.classList.add('active');
    loadRepos(btn.dataset.sort);
  });
});

loadRepos();
