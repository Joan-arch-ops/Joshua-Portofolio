/* Smooth scroller — inertial (lerp) mouse-wheel / trackpad scrolling + eased anchor & programmatic scrolling.
   No dependencies. Must load BEFORE main.js (classic script, no defer).
   Left untouched on purpose: touch scrolling, keyboard scrolling, scrollbar-thumb dragging, ctrl+wheel zoom,
   open <dialog>s and nested scrollable elements (textarea, command list…). Respects prefers-reduced-motion.

   Tweak the feel here:
     LERP   – fraction of the remaining distance covered per 60fps frame (lower = floatier, higher = snappier)
     WHEEL  – wheel distance multiplier (1 = same distance as native)
     FAR    – a jump longer than FAR × screen height is a "far jump" (see below)
     LAND   – how much of a far jump is still shown as a glide at the end (× screen height)
     DIP    – ms the page dims before a far jump repositions

   Far jumps (navbar → "Kontak" from the top, etc.) do NOT fly through every section any more: that made the project
   cards, skill cards, the Experience tab/lens and the glass layers all animate at once while rushing past.
   Instead the page dims for a moment (#warp-cover), is repositioned silently to about one screen before the
   destination, then glides the last stretch while the cover fades away. Nothing in between is ever revealed half-way.

   Events on window (used by main.js):
     smoothscroll:start     {from, to, warp}   a programmatic jump begins
     smoothscroll:teleport  {from, to, at}     (far jumps only) the page was repositioned while dimmed
     smoothscroll:end       {cancelled}        the jump finished or was interrupted by the user                     */
(() => {
  'use strict';

  const LERP = 0.1;
  const WHEEL = 1;
  const FAR = 1.75;
  const LAND = 0.9;
  const DIP = 240;

  const root = document.documentElement;
  const mqTouch = matchMedia('(hover:none)'); // touch-first devices keep their native momentum scrolling
  const mqReduce = matchMedia('(prefers-reduced-motion:reduce)');
  const enabled = () => !mqTouch.matches && !mqReduce.matches;

  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  const maxScroll = () => Math.max(0, root.scrollHeight - root.clientHeight);
  const easeInOutCubic = (p) => (p < 0.5 ? 4 * p * p * p : 1 - Math.pow(-2 * p + 2, 3) / 2);
  const easeOutCubic = (p) => 1 - Math.pow(1 - p, 3);

  let cur = window.scrollY,
    tgt = cur,
    lastSet = cur; // current / target / last position written by us
  let raf = 0,
    last = 0,
    tween = null;

  // ---- jump bookkeeping ------------------------------------------------------------------------------------------
  let jumping = false,
    jumpId = 0,
    timers = [],
    cover = null;

  const emit = (name, detail) => {
    try {
      window.dispatchEvent(new CustomEvent(name, { detail }));
    } catch {
      /* very old browsers */
    }
  };
  const later = (fn, ms) => {
    const id = jumpId;
    const t = setTimeout(() => {
      if (id === jumpId && jumping) fn();
    }, ms);
    timers.push(t);
  };
  function coverTo(on) {
    if (!cover) {
      if (!on) return;
      cover = document.createElement('div');
      cover.id = 'warp-cover';
      cover.setAttribute('aria-hidden', 'true');
      document.body.appendChild(cover);
      void cover.offsetWidth; // make sure the first fade-in actually transitions
    }
    cover.classList.toggle('on', on);
  }
  function startJump(from, to, warp) {
    jumping = true;
    root.classList.add('is-jumping');
    emit('smoothscroll:start', { from, to, warp });
  }
  function endJump(cancelled, silent) {
    if (!jumping) return;
    jumping = false;
    jumpId++;
    timers.forEach(clearTimeout);
    timers = [];
    root.classList.remove('is-jumping');
    coverTo(false);
    if (!silent) emit('smoothscroll:end', { cancelled: !!cancelled });
  }

  const stop = () => {
    if (raf) cancelAnimationFrame(raf);
    raf = 0;
    tween = null;
  };

  const apply = (y) => {
    const dpr = window.devicePixelRatio || 1;
    lastSet = Math.round(y * dpr) / dpr; // snap to device pixels: no sub-pixel shimmer
    window.scrollTo({ top: lastSet, behavior: 'instant' });
  };

  function frame(t) {
    raf = 0;
    const dt = clamp(t - last, 1, 64);
    last = t;
    let finished = false;

    if (tween) {
      // eased jump (anchor links, command palette…)
      const p = clamp((t - tween.t0) / tween.dur, 0, 1);
      cur = tween.from + (tween.to - tween.from) * (tween.ease || easeInOutCubic)(p);
      if (p >= 1) {
        cur = tgt = tween.to;
        tween = null;
        finished = true;
      }
    } else {
      // wheel glide, frame-rate independent
      tgt = clamp(tgt, 0, maxScroll());
      cur += (tgt - cur) * (1 - Math.pow(1 - LERP, dt / 16.667));
      if (Math.abs(tgt - cur) < 0.25) cur = tgt;
    }

    apply(cur);
    if (finished) endJump(false);
    if (tween || cur !== tgt) raf = requestAnimationFrame(frame);
  }

  const kick = () => {
    if (!raf) {
      last = performance.now();
      raf = requestAnimationFrame(frame);
    }
  };

  // ---- wheel ----------------------------------------------------------------------------------------------------
  function nestedScroller(el, dy) {
    // an inner element that can still scroll in this direction?
    for (; el && el !== document.body && el !== root; el = el.parentElement) {
      const oy = getComputedStyle(el).overflowY;
      if ((oy === 'auto' || oy === 'scroll') && el.scrollHeight > el.clientHeight + 1) {
        if (dy < 0 ? el.scrollTop > 0 : el.scrollTop + el.clientHeight < el.scrollHeight - 1)
          return true;
      }
    }
    return false;
  }

  addEventListener(
    'wheel',
    (e) => {
      if (e.defaultPrevented || e.ctrlKey || !enabled()) return; // ctrl+wheel / pinch = browser zoom
      let dy = e.deltaY;
      if (!dy || Math.abs(e.deltaX) > Math.abs(dy)) return; // horizontal gesture
      if (document.querySelector('dialog[open]')) return; // command palette etc.
      if (nestedScroller(e.target, dy)) return;

      const max = maxScroll();
      if (max <= 0) return;
      if (!raf && !jumping && (dy < 0 ? window.scrollY <= 0 : window.scrollY >= max - 1)) return; // already at the edge: leave the native bounce alone

      if (e.deltaMode === 1)
        dy *= 40; // lines  -> px
      else if (e.deltaMode === 2) dy *= window.innerHeight; // pages  -> px

      e.preventDefault();
      if (!raf) cur = tgt = lastSet = window.scrollY; // idle: start from the real position (lastSet too, so a late scroll event of an older move isn't mistaken for a new one)
      if (tween) tgt = cur; // the user takes over from where the jump currently is, not from its destination
      tween = null; // the user takes over from any running jump
      endJump(true); // …including a far jump that is still dimming the page
      tgt = clamp(tgt + dy * WHEEL, 0, max);
      kick();
    },
    { passive: false },
  );

  // anything else that moves the page (keyboard, scrollbar thumb drag, find-in-page…) wins and re-syncs us
  addEventListener(
    'scroll',
    () => {
      const y = window.scrollY;
      if (Math.abs(y - lastSet) > 2) {
        stop();
        cur = tgt = lastSet = y;
        if (enabled()) endJump(true); // someone else is scrolling: a running jump gives way
      }
    },
    { passive: true },
  );
  // finger on the screen = the user is in charge again
  addEventListener('touchstart', () => endJump(true), { passive: true });

  // ---- programmatic scrolling -----------------------------------------------------------------------------------
  function resolve(target, offset) {
    if (typeof target === 'number') return target + offset;
    const el = typeof target === 'string' ? document.querySelector(target) : target;
    if (!el) return null;
    const pad = parseFloat(getComputedStyle(root).scrollPaddingTop) || 0; // same landing spot as native scrollIntoView
    const mar = parseFloat(getComputedStyle(el).scrollMarginTop) || 0;
    return el.getBoundingClientRect().top + window.scrollY - pad - mar + offset;
  }

  // far jump: dim → silently reposition one screen before the destination → glide the rest while the dim fades
  function warpTo(y, from) {
    const vh = window.innerHeight,
      dir = Math.sign(y - from),
      mid = clamp(y - dir * Math.min(vh * LAND, Math.abs(y - from) - 8), 0, maxScroll());
    stop();
    startJump(from, y, true);
    coverTo(true);
    later(() => {
      stop();
      cur = tgt = mid;
      apply(mid);
      emit('smoothscroll:teleport', { from, to: y, at: mid });
      if (enabled()) {
        tween = {
          from: mid,
          to: y,
          t0: performance.now(),
          dur: clamp(520 + Math.abs(y - mid) * 0.3, 700, 980),
          ease: easeOutCubic,
        };
        kick();
      } else {
        window.scrollTo({ top: y, behavior: 'smooth' });
        later(() => endJump(false), 1100);
      }
      requestAnimationFrame(() => coverTo(false));
    }, DIP);
  }

  function to(target, opt = {}) {
    let y = resolve(target, opt.offset || 0);
    if (y == null) return;
    y = clamp(y, 0, maxScroll());
    const was = jumping;
    endJump(true, true); // a new jump replaces whatever was running (silently: its replacement announces itself)
    const noJump = () => {
      if (was) emit('smoothscroll:end', { cancelled: true }); // nobody else will tell listeners the old jump is over
    };

    if (mqReduce.matches) {
      stop();
      window.scrollTo({ top: y, behavior: 'auto' });
      cur = tgt = lastSet = y;
      noJump();
      return;
    }
    if (opt.immediate) {
      stop();
      cur = tgt = y;
      apply(y);
      noJump();
      return;
    }

    const from = enabled() ? (raf ? cur : window.scrollY) : window.scrollY;
    const dist = y - from;
    if (Math.abs(dist) < 1) {
      stop();
      cur = tgt = y;
      if (enabled()) apply(y);
      noJump();
      return;
    }
    if (!opt.noWarp && Math.abs(dist) > window.innerHeight * FAR) {
      warpTo(y, from);
      return;
    }

    if (!enabled()) {
      startJump(from, y, false);
      window.scrollTo({ top: y, behavior: 'smooth' });
      later(() => endJump(false), clamp(500 + Math.abs(dist) * 0.35, 650, 1500) + 200);
      return;
    }

    if (!raf) cur = lastSet = window.scrollY;
    tgt = y;
    startJump(cur, y, false);
    tween = {
      from: cur,
      to: y,
      t0: performance.now(),
      dur: clamp(500 + Math.abs(y - cur) * 0.35, 650, 1500),
    };
    kick();
  }

  // in-page links (#proyek, #tentang, …) glide instead of jumping
  document.addEventListener('click', (e) => {
    if (
      e.defaultPrevented ||
      e.button ||
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      mqReduce.matches
    )
      return;
    const a = e.target.closest && e.target.closest('a[href^="#"]');
    if (!a || (a.target && a.target !== '_self')) return;
    let id = a.getAttribute('href').slice(1);
    try {
      id = decodeURIComponent(id);
    } catch {
      /* keep raw */
    }
    const el = id ? document.getElementById(id) : null;
    if (id && !el) return; // unknown target: let the browser decide
    e.preventDefault();
    to(el || 0);
    if (id) {
      try {
        history.pushState(null, '', '#' + id);
      } catch {
        /* file:// or sandboxed */
      }
    }
  });

  // while active, the CSS `scroll-behavior:smooth` must be off, otherwise every scrollTo() above would be animated twice
  const sync = () => {
    root.classList.toggle('smooth-scroll', enabled());
    if (!enabled()) stop();
  };
  mqTouch.addEventListener('change', sync);
  mqReduce.addEventListener('change', sync);
  sync();

  window.SmoothScroll = {
    to,
    stop,
    get enabled() {
      return enabled();
    },
    get jumping() {
      return jumping;
    },
  };
})();
