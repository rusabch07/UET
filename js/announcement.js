// Homepage announcement only: no route data, GPS, or shuttle rendering lives here.
(() => {
  const storageKey = 'uet_ksk_announcement_seen';
  let shown = false;
  let savedScroll = null;
  let returnFocus = null;

  function closeAnnouncement(openShuttle = false) {
    const modal = document.getElementById('ksk-announcement');
    if (!modal || modal.hidden) return;
    if (activeAccessibleLayer?.root === modal) closeAccessibleLayer(false);
    modal.hidden = true;
    modal.inert = true;
    modal.setAttribute('aria-hidden', 'true');
    document.documentElement.classList.remove('ksk-announcement-open');
    document.body.classList.remove('ksk-announcement-open');
    document.body.style.removeProperty('--ksk-announcement-scroll-top');
    if (savedScroll) window.scrollTo({left:savedScroll.x, top:savedScroll.y, behavior:'instant'});
    savedScroll = null;
    if (openShuttle) {
      navigateToPage('shuttle');
      document.querySelector('#page-shuttle .shuttle-view')?.focus({preventScroll:true});
    } else {
      const target = returnFocus?.isConnected && returnFocus !== document.body
        ? returnFocus : document.getElementById('theme-toggle-btn');
      target?.focus({preventScroll:true});
    }
  }

  function showAnnouncement() {
    const modal = document.getElementById('ksk-announcement');
    if (shown || !modal || appState.activePage !== 'home' || activeAccessibleLayer) return;
    try {
      if (sessionStorage.getItem(storageKey)) return;
      // Mark on display so refreshing an open popup cannot repeat it this session.
      sessionStorage.setItem(storageKey, '1');
    } catch (_) { /* Storage may be disabled; the in-memory flag still prevents repeats. */ }
    shown = true;
    returnFocus = document.activeElement;
    savedScroll = {x:window.scrollX, y:window.scrollY};
    document.body.style.setProperty('--ksk-announcement-scroll-top', `-${savedScroll.y}px`);
    document.documentElement.classList.add('ksk-announcement-open');
    document.body.classList.add('ksk-announcement-open');
    modal.hidden = false;
    openAccessibleLayer(modal, document.getElementById('ksk-announcement-view'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    const modal = document.getElementById('ksk-announcement');
    if (!modal) return;
    document.getElementById('ksk-announcement-view').addEventListener('click', () => closeAnnouncement(true));
    document.getElementById('ksk-announcement-later').addEventListener('click', () => closeAnnouncement());
    document.getElementById('ksk-announcement-close').addEventListener('click', () => closeAnnouncement());
    modal.addEventListener('click', event => { if (event.target === modal) closeAnnouncement(); });
    // Handle only this popup's Escape; the shared helper still provides its Tab trap.
    document.addEventListener('keydown', event => {
      if (!modal.hidden && event.key === 'Escape') {
        event.preventDefault();
        event.stopImmediatePropagation();
        closeAnnouncement();
      }
    }, true);
    // Run after the existing initial hash routing and scroll restoration.
    setTimeout(showAnnouncement, 0);
  });
})();
