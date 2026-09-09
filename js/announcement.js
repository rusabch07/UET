// Homepage announcement only: no route data, GPS, or shuttle rendering lives here.
(() => {
  let shown = false;
  let savedScroll = null;
  let returnFocus = null;

  function closeAnnouncement(openShuttle = false) {
    const modal = document.getElementById('ksk-announcement');
    if (!modal || modal.hidden) return;
    if (activeAccessibleLayer?.root === modal) closeAccessibleLayer(false);
    modal.hidden = true;
    modal.inert = true;
    shown = false;
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
    const effectiveDate = new Date(2026, 8, 14);
    const description = document.getElementById('ksk-announcement-description');
    if (description) {
      description.textContent = new Date() >= effectiveDate
        ? 'Hourly shuttle service is now available between UET Main Campus and New Campus (KSK).'
        : 'Hourly shuttle service will be available between UET Main Campus and New Campus (KSK) from 14 September 2026.';
    }
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
    // Open as soon as the modal elements and initial page state are available.
    showAnnouncement();
  });
})();
