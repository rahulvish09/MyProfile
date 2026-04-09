/* ============================================
   QMS PAGE — INTERACTIVE LOGIC (REDESIGNED)
   ============================================ */

document.addEventListener('DOMContentLoaded', () => {

  // ─── 1. Accordion Toggle (Level Details + Concepts) ───
  document.querySelectorAll('.level-detail-header, .concept-header').forEach(header => {
    header.addEventListener('click', () => {
      const card = header.parentElement;
      const isOpen = card.classList.contains('open');
      const parent = card.parentElement;
      parent.querySelectorAll('.open').forEach(c => {
        if (c !== card) c.classList.remove('open');
      });
      card.classList.toggle('open', !isOpen);
    });
  });

  // Open first accordion in each group
  document.querySelectorAll('.level-details, .concepts-grid').forEach(group => {
    const first = group.querySelector('.level-detail-card, .concept-card');
    if (first) first.classList.add('open');
  });


  // ─── 2. Standards "Show Details" Toggle ───
  document.querySelectorAll('.std-show-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const card = btn.closest('.std-card');
      card.classList.toggle('expanded');
      const span = btn.querySelector('.btn-text');
      if (span) {
        span.textContent = card.classList.contains('expanded') ? 'Hide Details' : 'Show Details';
      }
    });
  });


  // ─── 3. Sticky TOC Active State ───
  const tocLinks = document.querySelectorAll('.qms-toc-link');
  const qmsSections = document.querySelectorAll('.qms-section');

  function updateTOC() {
    let currentId = '';
    const scrollY = window.scrollY + 200;
    qmsSections.forEach(sec => {
      if (sec.offsetTop <= scrollY) currentId = sec.id;
    });
    tocLinks.forEach(link => {
      link.classList.toggle('active', link.getAttribute('href') === `#${currentId}`);
    });
  }

  window.addEventListener('scroll', updateTOC, { passive: true });
  updateTOC();


  // ─── 4. Smooth Scroll on TOC Links ───
  tocLinks.forEach(link => {
    link.addEventListener('click', (e) => {
      e.preventDefault();
      const targetId = link.getAttribute('href').substring(1);
      const target = document.getElementById(targetId);
      if (target) {
        const offset = 130;
        const y = target.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });


  // ─── 5. Back-to-Top Button ───
  const backTopBtn = document.querySelector('.qms-back-top');
  if (backTopBtn) {
    window.addEventListener('scroll', () => {
      backTopBtn.classList.toggle('visible', window.scrollY > 600);
    }, { passive: true });
    backTopBtn.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }


  // ─── 6. Scroll Reveal Animations ───
  const reveals = document.querySelectorAll('.qms-reveal');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -40px 0px' });

  reveals.forEach(el => revealObserver.observe(el));


  // ─── 7. Pyramid → Detail Card linking ───
  document.querySelectorAll('.pyramid-level').forEach(level => {
    level.addEventListener('click', () => {
      const targetLevel = level.getAttribute('data-level');
      const detailCard = document.querySelector(`.level-detail-card[data-level="${targetLevel}"]`);
      if (detailCard) {
        document.querySelectorAll('.level-detail-card.open').forEach(c => c.classList.remove('open'));
        detailCard.classList.add('open');
        const offset = 140;
        const y = detailCard.getBoundingClientRect().top + window.scrollY - offset;
        window.scrollTo({ top: y, behavior: 'smooth' });
      }
    });
  });


  // ─── 8. Navigation scrolled state ───
  const nav = document.querySelector('.nav');
  if (nav) {
    window.addEventListener('scroll', () => {
      nav.classList.toggle('scrolled', window.scrollY > 80);
    }, { passive: true });
  }

});
