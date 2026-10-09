// Shared behaviour for every theme. Markup hooks: data-guest, #btn-open, #music,
// data-countdown, data-copy, .rv, .gallery, form.wish.
const ICONS = new URL('icons.svg', document.currentScript.src).pathname;
const icon = id => `<svg class="i" aria-hidden="true"><use href="${ICONS}#${id}"/></svg>`;
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];

// Guest name from ?to=Nama+Tamu
const to = new URLSearchParams(location.search).get('to');
if (to) $$('[data-guest]').forEach(el => (el.textContent = to));

// Photo not uploaded yet → show the theme placeholder (data-ph)
$$('img[data-ph]').forEach(img => {
  const ph = () => { img.src = img.dataset.ph; img.classList.add('ph'); };
  img.complete && !img.naturalWidth ? ph() : img.addEventListener('error', ph, { once: true });
});

// Open invitation + music
const music = $('#music');
const btnMusic = $('#btn-music');
const setMusic = on => music && (on ? music.play().catch(() => {}) : music.pause());
// Spin only while really playing; drop the button if the file is missing
music?.addEventListener('play', () => btnMusic?.classList.add('on'));
music?.addEventListener('pause', () => btnMusic?.classList.remove('on'));
music?.addEventListener('error', () => btnMusic?.remove());
$('#btn-open')?.addEventListener('click', () => {
  document.body.classList.add('opened');
  scrollTo(0, 0);
  setMusic(true);
  // Intro motion starts from the beginning only once the cover is gone
  $$('video[data-play-on-open]').forEach(v => { v.currentTime = 0; v.play().catch(() => {}); });
  setTimeout(startReveal, 500);
});
if (!$('#btn-open')) startReveal();
btnMusic?.addEventListener('click', () => setMusic(music.paused));
document.addEventListener('visibilitychange', () => document.hidden && setMusic(false));

// "Simpan ke Google Calendar": <a data-cal="Judul" data-start="2026-12-12T09:00+07:00" data-end="…" data-loc="…">
const gcalTime = s => new Date(s).toISOString().replace(/[-:]|\.\d{3}/g, '');
$$('a[data-cal]').forEach(a => {
  const q = new URLSearchParams({
    action: 'TEMPLATE',
    text: a.dataset.cal,
    dates: `${gcalTime(a.dataset.start)}/${gcalTime(a.dataset.end)}`,
    location: a.dataset.loc || '',
    details: `Undangan: ${location.origin}${location.pathname}`,
  });
  a.href = 'https://calendar.google.com/calendar/render?' + q;
  a.target = '_blank';
  a.rel = 'noopener';
});

// Countdown
$$('[data-countdown]').forEach(el => {
  const end = new Date(el.dataset.countdown).getTime();
  const tick = () => {
    const t = Math.max(0, end - Date.now()) / 1000;
    const v = { d: t / 86400, h: (t / 3600) % 24, m: (t / 60) % 60, s: t % 60 };
    for (const k in v) $(`[data-${k}]`, el).textContent = String(Math.floor(v[k])).padStart(2, '0');
  };
  tick();
  setInterval(tick, 1000);
});

// Copy rekening / alamat
$$('[data-copy]').forEach(btn =>
  btn.addEventListener('click', async () => {
    await navigator.clipboard.writeText(btn.dataset.copy);
    const old = btn.innerHTML;
    btn.innerHTML = `${icon('check')} Tersalin`;
    setTimeout(() => (btn.innerHTML = old), 1800);
  })
);

// Reveal on scroll. Started only after the cover opens (nothing animates unseen behind it);
// elements entering together are staggered.
const io = new IntersectionObserver(
  es => es.filter(e => e.isIntersecting).forEach((e, i) => {
    e.target.style.transitionDelay = `${i * 0.12}s`;
    e.target.classList.add('in');
    io.unobserve(e.target);
  }),
  { threshold: 0.15, rootMargin: '0px 0px -6% 0px' }
);
function startReveal() { $$('.rv').forEach(el => io.observe(el)); }
$$('.rv.stagger').forEach(el => [...el.children].forEach((c, i) => c.style.setProperty('--i', i)));

// Scroll-linked motion. [data-px="0.3"]: ornament drifts against the scroll (parallax depth);
// [data-zoom]: background settles from 1.12 to 1 as its section reaches the middle of the screen.
// Uses the separate translate/scale properties so it stacks with keyframes (sway, floaty) on transform.
const movers = matchMedia('(prefers-reduced-motion: reduce)').matches ? [] : $$('[data-px],[data-zoom]');
let queued = false;
const move = () => {
  queued = false;
  const vh = innerHeight;
  for (const el of movers) {
    const r = el.parentElement.getBoundingClientRect(); // parent: not moved by us, so no feedback
    if (r.bottom < 0 || r.top > vh) continue;
    const c = (r.top + r.height / 2 - vh / 2) / vh; // 0 when centered, ± as it scrolls away
    if (el.dataset.px) el.style.translate = `0 ${(c * el.dataset.px * 120).toFixed(1)}px`;
    if ('zoom' in el.dataset) el.style.scale = (1 + Math.min(Math.max(c, 0), 1) * 0.12).toFixed(3);
  }
};
if (movers.length) {
  addEventListener('scroll', () => queued || (queued = requestAnimationFrame(move)), { passive: true });
  move();
}

// Gallery lightbox
const box = document.createElement('dialog');
box.className = 'lightbox';
box.innerHTML = '<img alt="">';
box.addEventListener('click', () => box.close());
document.body.append(box);
$$('.gallery img').forEach(img =>
  img.addEventListener('click', () => {
    $('img', box).src = img.src;
    box.showModal();
  })
);

// Wishes / RSVP → /api/wishes (Turso). All themes share one feed (INV in lib/db.js).
const form = $('form.wish');
if (form) {
  const inv = 'utama';
  const api = '/api/wishes/';
  const list = $('.wishes');
  const note = document.createElement('p');
  note.className = 'wish-note';
  form.append(note);
  const picker = $('.stickers', form);
  let sticker = '';

  if (picker) {
    picker.innerHTML = picker.dataset.list
      .split(',')
      .map(src => `<button type="button" aria-pressed="false"><img src="${src}" alt="stiker" loading="lazy"></button>`)
      .join('');
    picker.addEventListener('click', e => {
      const b = e.target.closest('button');
      if (!b) return;
      const on = b.getAttribute('aria-pressed') !== 'true';
      $$('button', picker).forEach(x => x.setAttribute('aria-pressed', 'false'));
      b.setAttribute('aria-pressed', on);
      sticker = on ? $('img', b).getAttribute('src') : '';
    });
  }

  const render = async () => {
    const res = await fetch(`${api}?inv=${inv}`).catch(() => null);
    if (!res?.ok) return;
    const { wishes, counts } = await res.json();
    list.replaceChildren(
      ...wishes.map(w => {
        const a = document.createElement('article');
        const b = document.createElement('b');
        const p = document.createElement('p');
        const s = document.createElement('small');
        b.textContent = w.name;
        p.textContent = w.msg;
        s.textContent = `${w.attend} · ${new Date(w.at).toLocaleString('id-ID')}`;
        a.append(b, s, p);
        // Stickers only exist in adat-jawa/img, but the feed is shown on every theme.
        if (w.sticker) a.append(Object.assign(new Image(), { src: `/adat-jawa/${w.sticker}`, alt: 'stiker' }));
        return a;
      })
    );
    for (const k of ['Hadir', 'Tidak Hadir', 'Ragu-ragu']) {
      const el = $(`[data-stat="${k}"]`);
      if (el) el.textContent = counts[k] || 0;
    }
  };

  if (to) form.elements.name.value = to;
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const btn = $('[type=submit]', form);
    const f = new FormData(form);
    btn.disabled = true;
    note.textContent = 'Mengirim…';
    const res = await fetch(api, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ inv, name: f.get('name'), attend: f.get('attend'), msg: f.get('msg'), sticker }),
    }).catch(() => null);
    btn.disabled = false;
    if (!res?.ok) {
      note.textContent = (await res?.json().catch(() => null))?.error || 'Gagal mengirim, coba lagi.';
      return;
    }
    note.textContent = 'Terima kasih atas ucapan & doanya.';
    form.elements.msg.value = '';
    picker && $$('button', picker).forEach(x => x.setAttribute('aria-pressed', 'false'));
    sticker = '';
    await render();
    list.firstElementChild?.classList.add('fresh');
  });
  render();
}
