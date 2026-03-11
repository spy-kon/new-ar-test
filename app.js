/* ════════════════════════════════════════════
   app.js — AR Experience Logic
   ════════════════════════════════════════════ */

(function () {
  'use strict';

  /* ── DOM References ─────────────────────── */
  const hud           = document.getElementById('hud');
  const fab           = document.getElementById('fab');
  const locationMenu  = document.getElementById('location-menu');
  const closeMenuBtn  = document.getElementById('close-menu');
  const locationLabel = document.getElementById('location-label-text');
  const arVideoPlane  = document.getElementById('ar-video-plane');
  const locationBtns  = document.querySelectorAll('.location-btn');

  /* ── State ──────────────────────────────── */
  let targetFound   = false;
  let menuOpen      = false;
  let activeVideoId = 'video-default';

  /* ════════════════════════════════════════════
     1. A-Frame / MindAR Events
     ════════════════════════════════════════════ */

  // Ο στόχος ανιχνεύτηκε → εμφάνισε HUD + ξεκίνα βίντεο
  document.addEventListener('targetFound', (e) => {
    if (e.detail?.targetIndex !== 0) return; // φύλαξε μόνο το target #0
    targetFound = true;
    showHUD();
    playVideo(activeVideoId);
  });

  // Ο στόχος χάθηκε → κρύψε HUD + σταμάτα βίντεο
  document.addEventListener('targetLost', (e) => {
    if (e.detail?.targetIndex !== 0) return;
    targetFound = false;
    hideHUD();
    pauseAllVideos();
    closeMenu();
  });

  // Εναλλακτική μέθοδος: παρακολούθηση events μέσα από το a-entity
  window.addEventListener('DOMContentLoaded', () => {
    const sceneEl = document.getElementById('ar-scene');

    sceneEl.addEventListener('loaded', () => {
      const target = document.querySelector('[mindar-image-target]');

      if (target) {
        target.addEventListener('targetFound', () => {
          targetFound = true;
          showHUD();
          playVideo(activeVideoId);
        });

        target.addEventListener('targetLost', () => {
          targetFound = false;
          hideHUD();
          pauseAllVideos();
          closeMenu();
        });
      }
    });
  });

  /* ════════════════════════════════════════════
     2. HUD show / hide
     ════════════════════════════════════════════ */
  function showHUD() {
    hud.classList.remove('hidden');
  }

  function hideHUD() {
    hud.classList.add('hidden');
  }

  /* ════════════════════════════════════════════
     3. Video Management
     ════════════════════════════════════════════ */

  /**
   * Σταματά όλα τα βίντεο και αλλάζει το src του AR plane
   * στο επιλεγμένο βίντεο, μετά το αναπαράγει.
   * @param {string} videoId - id του <video> element
   */
  function playVideo(videoId) {
    pauseAllVideos();

    const videoEl = document.getElementById(videoId);
    if (!videoEl) {
      console.warn(`[AR] Video element not found: #${videoId}`);
      return;
    }

    // Σύνδεσε το βίντεο στο AR plane
    arVideoPlane.setAttribute('src', `#${videoId}`);

    // Αναπαραγωγή
    videoEl.play().catch((err) => {
      console.warn('[AR] Video play failed:', err);
    });

    activeVideoId = videoId;
  }

  function pauseAllVideos() {
    document.querySelectorAll('a-assets video').forEach((v) => {
      v.pause();
      v.currentTime = 0;
    });
  }

  /* ════════════════════════════════════════════
     4. FAB — toggle menu
     ════════════════════════════════════════════ */
  fab.addEventListener('click', () => {
    menuOpen ? closeMenu() : openMenu();
  });

  function openMenu() {
    menuOpen = true;
    fab.classList.add('open');
    locationMenu.classList.remove('hidden');
    // Re-trigger animation
    locationMenu.style.animation = 'none';
    requestAnimationFrame(() => {
      locationMenu.style.animation = '';
    });
  }

  function closeMenu() {
    menuOpen = false;
    fab.classList.remove('open');
    locationMenu.classList.add('hidden');
  }

  closeMenuBtn.addEventListener('click', closeMenu);

  // Κλείσε menu αν ο χρήστης πατήσει εκτός
  document.addEventListener('click', (e) => {
    if (menuOpen && !locationMenu.contains(e.target) && e.target !== fab) {
      closeMenu();
    }
  });

  /* ════════════════════════════════════════════
     5. Location buttons
     ════════════════════════════════════════════ */
  locationBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const videoId = btn.dataset.video;
      const label   = btn.dataset.label;

      // Ενημέρωσε active state
      locationBtns.forEach((b) => b.classList.remove('active'));
      btn.classList.add('active');

      // Ενημέρωσε label
      locationLabel.textContent = label;

      // Άλλαξε βίντεο (μόνο αν το target φαίνεται)
      if (targetFound) {
        playVideo(videoId);
      } else {
        // Αποθήκευσε την επιλογή — θα ξεκινήσει όταν βρεθεί το target
        activeVideoId = videoId;
      }

      closeMenu();
    });
  });

  /* ════════════════════════════════════════════
     6. Keyboard accessibility
     ════════════════════════════════════════════ */
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && menuOpen) closeMenu();
  });

  /* ════════════════════════════════════════════
     7. iOS AudioContext unlock (για autoplay)
     ════════════════════════════════════════════ */
  document.body.addEventListener(
    'touchstart',
    () => {
      document.querySelectorAll('a-assets video').forEach((v) => {
        v.play().then(() => v.pause()).catch(() => {});
      });
    },
    { once: true }
  );

})();
