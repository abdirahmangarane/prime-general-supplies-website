(function () {
  'use strict';

  document.getElementById('year').textContent = new Date().getFullYear();

  /* ---------------------------------------------------------------------
     Mobile menu
     --------------------------------------------------------------------- */
  const navToggle = document.getElementById('navToggle');
  const mobileMenu = document.getElementById('mobileMenu');
  navToggle.addEventListener('click', () => {
    const open = mobileMenu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(open));
  });
  mobileMenu.querySelectorAll('a').forEach((a) =>
    a.addEventListener('click', () => {
      mobileMenu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    })
  );

  /* ---------------------------------------------------------------------
     Reveal on scroll
     --------------------------------------------------------------------- */
  const revealEls = document.querySelectorAll('.reveal');
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add('in');
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.12 }
    );
    revealEls.forEach((el) => io.observe(el));
  } else {
    revealEls.forEach((el) => el.classList.add('in'));
  }

  /* ---------------------------------------------------------------------
     Helpers
     --------------------------------------------------------------------- */
  function fmtMoney(n) {
    if (n === null || n === undefined) return 'On request';
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }
  function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }

  /* ---------------------------------------------------------------------
     Projects / contracts — fetched from the backend API
     --------------------------------------------------------------------- */
  let ALL_PROJECTS = [];
  let activeFilter = 'All';

  function ticketMarkup(p) {
    const statusBadge = p.amount ? 'Delivered' : 'In scope';
    return `
      <article class="ticket">
        <div class="ticket-body">
          <div class="tk-cat">${escapeHTML(p.category)}</div>
          <h4>${escapeHTML(p.title)}</h4>
          <div class="ticket-fields">
            <div class="tf-row"><span>Client</span><b>${escapeHTML(p.clientFull || p.client)}</b></div>
            <div class="tf-row"><span>Location</span><b>${escapeHTML(p.location)}</b></div>
            <div class="tf-row"><span>Year</span><b>${escapeHTML(String(p.year))}</b></div>
          </div>
          <div class="ticket-amount">
            <span class="amt">${fmtMoney(p.amount)}</span>
            <span class="badge">${statusBadge}</span>
          </div>
        </div>
      </article>`;
  }

  function renderFilters(categories) {
    const row = document.getElementById('filterRow');
    const cats = ['All', ...categories];
    row.innerHTML = cats
      .map((c) => `<button class="filter-chip${c === activeFilter ? ' active' : ''}" data-cat="${escapeHTML(c)}">${escapeHTML(c)}</button>`)
      .join('');
    row.querySelectorAll('.filter-chip').forEach((btn) => {
      btn.addEventListener('click', () => {
        activeFilter = btn.getAttribute('data-cat');
        renderFilters(categories);
        renderTickets();
      });
    });
  }

  function renderTickets() {
    const grid = document.getElementById('ticketsGrid');
    const list = activeFilter === 'All' ? ALL_PROJECTS : ALL_PROJECTS.filter((p) => p.category === activeFilter);
    if (!list.length) {
      grid.innerHTML = '<p style="font-family:var(--mono); color:var(--ink-soft);">No contracts in this category yet.</p>';
      return;
    }
    grid.innerHTML = list.map((p) => ticketMarkup(p)).join('');
  }

  fetch('/api/projects')
    .then((r) => r.json())
    .then((data) => {
      ALL_PROJECTS = data.projects || [];
      // sort newest first
      ALL_PROJECTS.sort((a, b) => b.year - a.year);
      const categories = [...new Set(ALL_PROJECTS.map((p) => p.category))].sort();
      renderFilters(categories);
      renderTickets();
    })
    .catch(() => {
      document.getElementById('ticketsGrid').innerHTML =
        '<p style="font-family:var(--mono); color:var(--ink-soft);">Could not load contract records right now. Please refresh the page.</p>';
    });

  /* ---------------------------------------------------------------------
     Team — fetched from backend API
     --------------------------------------------------------------------- */
  fetch('/api/team')
    .then((r) => r.json())
    .then((data) => {
      const grid = document.getElementById('teamGrid');
      const team = data.team || [];
      grid.innerHTML = team
        .map(
          (m) => `
        <div class="team-card reveal in">
          <div class="team-photo"><img src="${m.photo}" alt="Portrait of ${escapeHTML(m.name)}" loading="lazy"></div>
          <div class="team-info">
            <h4>${escapeHTML(m.name)}</h4>
            <span class="team-role">${escapeHTML(m.role)}</span>
            <p class="team-bio">${escapeHTML(m.bio)}</p>
          </div>
        </div>`
        )
        .join('');
    })
    .catch(() => {
      document.getElementById('teamGrid').innerHTML =
        '<p style="font-family:var(--mono); color:var(--ink-soft);">Could not load team profiles right now.</p>';
    });

  /* ---------------------------------------------------------------------
     Clients — fetched from backend API
     --------------------------------------------------------------------- */
  fetch('/api/clients')
    .then((r) => r.json())
    .then((data) => {
      const grid = document.getElementById('clientsGrid');
      const clients = data.clients || [];
      grid.innerHTML = clients
        .map((c) =>
          c.logo
            ? `
        <div class="client-plate client-plate-logo">
          <img src="${c.logo}" alt="${escapeHTML(c.name)} logo" loading="lazy">
        </div>`
            : `
        <div class="client-plate">
          <div class="csh">${escapeHTML(c.short)}</div>
          <div class="cfull">${escapeHTML(c.name)}</div>
        </div>`
        )
        .join('');
    })
    .catch(() => {
      document.getElementById('clientsGrid').innerHTML =
        '<p style="font-family:var(--mono); color:#c7d5ec; padding:20px;">Could not load partner list right now.</p>';
    });

  /* ---------------------------------------------------------------------
     Contact form
     --------------------------------------------------------------------- */
  const form = document.getElementById('contactForm');
  const msgBox = document.getElementById('formMsg');
  const submitBtn = document.getElementById('submitBtn');

  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    msgBox.className = 'form-msg';
    msgBox.textContent = '';

    const payload = {
      name: document.getElementById('name').value,
      email: document.getElementById('email').value,
      phone: document.getElementById('phone').value,
      company: document.getElementById('company').value,
      message: document.getElementById('message').value,
      website: document.getElementById('website').value, // honeypot
    };

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending…';

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json();

      if (res.ok && data.ok) {
        msgBox.textContent = data.message || 'Thank you — your message has been received.';
        msgBox.classList.add('show', 'ok');
        form.reset();
      } else {
        msgBox.textContent = data.error || 'Something went wrong. Please try again.';
        msgBox.classList.add('show', 'err');
      }
    } catch (err) {
      msgBox.textContent = 'Network error — please check your connection and try again.';
      msgBox.classList.add('show', 'err');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = 'Send Message';
    }
  });
})();
