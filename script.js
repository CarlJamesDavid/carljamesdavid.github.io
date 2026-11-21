if ('scrollRestoration' in history) history.scrollRestoration = 'manual';

/* ---------- THEME TOGGLE ---------- */
const root = document.documentElement;
const themeBtn = document.getElementById('theme-toggle');

if (themeBtn) {
  themeBtn.addEventListener('click', () => {
    const isLight = root.getAttribute('data-theme') === 'light';
    const next = isLight ? 'dark' : 'light';
    root.setAttribute('data-theme', next);
    try { localStorage.setItem('theme', next); } catch (e) {}
  });
}

/* ---------- 0. INTRO SCREEN ---------- */
const intro = document.getElementById('intro');
const heroSection = document.getElementById('home');

if (intro) {
  /* Skip the intro when the visitor is coming back to a specific section —
     any link ending in #about, #portfolio, #contact, such as the Back to
     portfolio buttons on the case study page. Otherwise the intro would
     replay, lock scrolling for ~3 seconds, and scroll them to the hero
     instead of the section they actually asked for. */
  const returningToSection = window.location.hash.length > 1;

  if (returningToSection) {
    intro.remove();                              // out of the layout entirely
    document.querySelector('.nav').classList.add('show');

    /* Re-apply the anchor ourselves. The browser already tried to jump there
       while the intro was still in the page, so the position it picked is now
       wrong. behavior:'auto' overrides the smooth scrolling in the stylesheet
       so this lands instantly instead of animating, and running it again on
       load corrects for images that size themselves late. */
    const target = document.querySelector(window.location.hash);
    if (target) {
      const jumpToTarget = () => target.scrollIntoView({ behavior: 'auto' });
      jumpToTarget();
      window.addEventListener('load', jumpToTarget);
    }

  } else {
    window.scrollTo(0, 0);                       // always start at the intro
    document.body.classList.add('locked');       // no scrolling while it plays

    setTimeout(() => {
      document.body.classList.remove('locked');
      document.querySelector('.nav').classList.add('show');
      heroSection.scrollIntoView({ behavior: 'smooth' });   // glide down to the hero
    }, 2900);                                    // <-- how long the intro holds
  }
}

/* ---------- IMAGE PREVIEW (LIGHTBOX) ---------- */
const lightbox = document.getElementById('lightbox');

if (lightbox) {
  const lbImg     = lightbox.querySelector('img');
  const lbCaption = lightbox.querySelector('figcaption');
  const lbClose   = lightbox.querySelector('.lightbox-close');

  function openLightbox(img) {
    lbImg.src = img.src;
    lbImg.alt = img.alt || '';
    lbCaption.textContent = img.alt || '';
    lightbox.classList.add('open');
    lightbox.setAttribute('aria-hidden', 'false');
    document.body.classList.add('locked');       // stop the page scrolling behind
    lbClose.focus();
  }

  function closeLightbox() {
    lightbox.classList.remove('open');
    lightbox.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('locked');
  }

  document.querySelectorAll('.card img').forEach(img => {
    img.addEventListener('click', () => openLightbox(img));
  });

  lbClose.addEventListener('click', closeLightbox);

  // click the dark area (but not the image) to close
  lightbox.addEventListener('click', e => {
    if (e.target === lightbox || e.target.classList.contains('lightbox-inner')) closeLightbox();
  });

  // Esc closes it too
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && lightbox.classList.contains('open')) closeLightbox();
  });
}

/* ---------- 1. TABS ---------- */
const tabs = document.querySelectorAll('.tab');
const panels = document.querySelectorAll('.panel');

/* one place that opens a tab, so the tab buttons and the stat cards
   in the About section can both call it */
function showTab(name) {
  const panel = document.getElementById(name);
  if (!panel) return;                       // nothing to open, leave things as they are

  tabs.forEach(t => t.classList.toggle('active', t.dataset.tab === name));
  panels.forEach(p => p.classList.remove('active'));
  panel.classList.add('active');
}

tabs.forEach(tab => {
  tab.addEventListener('click', () => showTab(tab.dataset.tab));
});

/* ---------- 1b. STAT CARDS OPEN THEIR TAB ---------- */
/* each .stat is an <a href="#portfolio"> carrying data-tab; the browser
   handles the scroll, we just open the matching panel first */
document.querySelectorAll('.stat[data-tab], .btn[data-tab]').forEach(stat => {
  stat.addEventListener('click', () => showTab(stat.dataset.tab));
});

/* ---------- 2. TYPING EFFECT ---------- */
const phrases = ['Happy coding!', 'Welcome to my portfolio.', 'Let\'s build something.'];
const typingEl = document.querySelector('.typing');
let pIndex = 0, cIndex = 0, deleting = false;

function type() {
  const current = phrases[pIndex];
  cIndex = deleting ? cIndex - 1 : cIndex + 1;
  typingEl.innerHTML = current.slice(0, cIndex) + '<span class="caret">_</span>';

  let speed = deleting ? 45 : 90;

  if (!deleting && cIndex === current.length) {
    speed = 1800;            // pause at the end of the sentence
    deleting = true;
  } else if (deleting && cIndex === 0) {
    deleting = false;
    pIndex = (pIndex + 1) % phrases.length;   // loop back to the first phrase
    speed = 400;
  }
  setTimeout(type, speed);
}
if (typingEl) type();

/* ---------- 3. FADE IN ON SCROLL ---------- */
const observer = new IntersectionObserver(entries => {
  entries.forEach(entry => {
    if (entry.isIntersecting) entry.target.classList.add('visible');
  });
}, { threshold: 0.15 });

document.querySelectorAll('.section, .card, .stat, .tech, .skill').forEach(el => {
  el.classList.add('reveal');
  observer.observe(el);
});

/* ---------- 4. NAV HIGHLIGHT WHILE SCROLLING ---------- */
const navLinks = document.querySelectorAll('.nav-links a');
const sections = document.querySelectorAll('section[id]');

function setActiveLink() {
  let current = '';

  sections.forEach(sec => {
    if (window.scrollY >= sec.offsetTop - 140) current = sec.id;
  });

  // if we've hit the bottom of the page, force the last section active
  const atBottom = window.innerHeight + window.scrollY >= document.body.offsetHeight - 4;
  if (atBottom && sections.length) current = sections[sections.length - 1].id;

  navLinks.forEach(link => {
    link.classList.toggle('active', link.getAttribute('href') === '#' + current);
  });
}

window.addEventListener('scroll', setActiveLink);
setActiveLink();  
(() => {
  const socials = document.querySelectorAll('.social[data-tip]');
  if (!socials.length) return;

  const HOLD = 450;
  let timer = null;
  let heldOpen = null;          // the link whose bubble a long press opened

  const closeAll = () => {
    socials.forEach(s => s.classList.remove('tip-open'));
    heldOpen = null;
  };

  socials.forEach(el => {
    el.addEventListener('touchstart', () => {
      clearTimeout(timer);
      timer = setTimeout(() => {
        closeAll();
        el.classList.add('tip-open');
        heldOpen = el;
      }, HOLD);
    }, { passive: true });

    // a short tap, a drag, or lifting early cancels the pending bubble
    ['touchend', 'touchmove', 'touchcancel'].forEach(evt =>
      el.addEventListener(evt, () => clearTimeout(timer), { passive: true })
    );

    // swallow only the click that ended a long press
    el.addEventListener('click', e => {
      if (heldOpen === el) {
        e.preventDefault();
        heldOpen = null;
      }
    });
  });

  // tapping anywhere else, or scrolling, dismisses an open bubble
  document.addEventListener('touchstart', e => {
    if (!e.target.closest('.social[data-tip]')) closeAll();
  }, { passive: true });
  window.addEventListener('scroll', closeAll, { passive: true });
})();

/* ---------- CONTACT FORM (opens the visitor's email app) ---------- */
const contactForm = document.querySelector('#contact .form');
if (contactForm) {
  contactForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const [nameEl, emailEl, msgEl] = contactForm.querySelectorAll('input, textarea');
    const subject = 'Portfolio message from ' + nameEl.value.trim();
    const body = msgEl.value.trim() + '\n\n' + nameEl.value.trim() + '\n' + emailEl.value.trim();
    window.location.href = 'mailto:cj23david@gmail.com?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
  });
}
