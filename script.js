// #theme
const root        = document.documentElement;
const themeToggle = document.getElementById('themeToggle');

themeToggle.addEventListener('click', () => {
  const isDark = root.getAttribute('data-theme') === 'dark';
  const next   = isDark ? 'light' : 'dark';
  root.setAttribute('data-theme', next);
  localStorage.setItem('theme', next);
});

// #greeting
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

// #navigation
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

// #reveal
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

// #hero
document.querySelectorAll('.hero .reveal').forEach((el, i) => {
  el.style.transitionDelay = `${i * 100}ms`;
});

revealEls.forEach(el => revealObserver.observe(el));

// #tabs
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

// #active-section
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

// #github
const GITHUB_USER = 'WaleedMehmadi';
const REPO_PER_PAGE = 6;
const REPO_CACHE_TTL = 15 * 60 * 1000;
let repoRequestId = 0;
let repoRetryTimer;

function readRepoStorage(key) {
  try {
    return JSON.parse(localStorage.getItem(`github:${GITHUB_USER}:${key}`));
  } catch {
    return null;
  }
}

function writeRepoStorage(key, value) {
  try {
    localStorage.setItem(`github:${GITHUB_USER}:${key}`, JSON.stringify(value));
  } catch {}
}

let repoRetryAt = Number(readRepoStorage('retry-at')) || 0;

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

function renderRepos(repos) {
  const grid = document.getElementById('repo-grid');
  const error = document.getElementById('repo-error');

  grid.innerHTML = repos.map(buildRepoCard).join('');
  grid.classList.toggle('hidden', repos.length === 0);
  error.classList.toggle('hidden', repos.length > 0);
  if (!repos.length) error.querySelector('p').textContent = 'No public repositories found.';

  grid.querySelectorAll('.repo-card').forEach((card, i) => {
    card.style.animationDelay = `${i * 60}ms`;
    card.classList.add('reveal', 'visible');
  });
}

function repoLimitMessage() {
  const time = new Date(repoRetryAt).toLocaleTimeString('en', { hour: 'numeric', minute: '2-digit' });
  return `GitHub's request limit has been reached. Try again after ${time}, or view the repositories directly.`;
}

function updateRepoRetry() {
  const retry = document.getElementById('repoRetry');
  clearTimeout(repoRetryTimer);
  retry.disabled = repoRetryAt > Date.now();
  if (retry.disabled) {
    repoRetryTimer = setTimeout(updateRepoRetry, repoRetryAt - Date.now());
  }
}

async function loadRepos(sort = 'pushed') {
  const requestId = ++repoRequestId;
  const loading = document.getElementById('repo-loading');
  const grid    = document.getElementById('repo-grid');
  const error   = document.getElementById('repo-error');
  const status  = document.getElementById('repo-status');
  const stored  = readRepoStorage(sort);
  const cached  = stored && Number.isFinite(stored.savedAt) && Array.isArray(stored.repos) &&
    stored.repos.every(repo => repo && typeof repo.name === 'string' && typeof repo.html_url === 'string')
    ? stored : null;
  const hasSavedRepos = cached && cached.repos.length > 0;

  loading.classList.add('hidden');
  grid.classList.add('hidden');
  error.classList.add('hidden');
  status.classList.add('hidden');
  updateRepoRetry();

  if (cached) {
    renderRepos(cached.repos);
    if (Date.now() - cached.savedAt < REPO_CACHE_TTL) return;
  }

  const showFailure = message => {
    loading.classList.add('hidden');
    if (hasSavedRepos) {
      status.textContent = 'Showing saved repositories. Live updates are temporarily unavailable.';
      status.classList.remove('hidden');
    } else {
      error.querySelector('p').textContent = message;
      error.classList.remove('hidden');
    }
    updateRepoRetry();
  };

  if (repoRetryAt > Date.now()) {
    showFailure(repoLimitMessage());
    return;
  }

  if (!hasSavedRepos) {
    error.classList.add('hidden');
    loading.innerHTML = buildSkeletons();
    loading.classList.remove('hidden');
  }

  let errorMessage = 'Could not load repositories. Please try again or view them directly.';
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 10000);

  try {
    const url = `https://api.github.com/users/${GITHUB_USER}/repos?sort=${sort}&per_page=${REPO_PER_PAGE}&type=public`;
    const res  = await fetch(url, {
      headers: { Accept: 'application/vnd.github+json' },
      signal: controller.signal
    });
    if (requestId !== repoRequestId) return;

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      if (requestId !== repoRequestId) return;
      const rateLimited = (res.status === 403 || res.status === 429) &&
        (res.headers.get('x-ratelimit-remaining') === '0' || res.status === 429 || /rate limit/i.test(body.message || ''));

      if (rateLimited) {
        const retryAfter = Number(res.headers.get('retry-after')) * 1000;
        const reset = res.headers.get('x-ratelimit-remaining') === '0'
          ? Number(res.headers.get('x-ratelimit-reset')) * 1000 : 0;
        repoRetryAt = Math.max(Date.now() + (retryAfter || 60000), reset + 1000);
        writeRepoStorage('retry-at', repoRetryAt);
        errorMessage = repoLimitMessage();
      } else if (res.status === 404) {
        errorMessage = 'This GitHub account could not be found. View the profile directly or try again later.';
      }
      throw new Error(String(res.status));
    }

    const repos = await res.json();
    if (requestId !== repoRequestId) return;
    if (!Array.isArray(repos)) throw new Error('Invalid repository response');

    writeRepoStorage(sort, { repos, savedAt: Date.now() });
    loading.classList.add('hidden');
    renderRepos(repos);
  } catch {
    if (requestId === repoRequestId) showFailure(errorMessage);
  } finally {
    clearTimeout(timeout);
  }
}

document.getElementById('repoRetry').addEventListener('click', () => {
  loadRepos(document.querySelector('.sort-btn.active').dataset.sort);
});

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
