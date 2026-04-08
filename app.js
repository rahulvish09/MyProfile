/* ============================================
   APP.JS — Portfolio Interactions
   ============================================ */

(function () {
  'use strict';

  // ─── Nav scroll effect ───
  var nav = document.getElementById('main-nav');
  window.addEventListener('scroll', function () {
    if (window.scrollY > 80) {
      nav.classList.add('scrolled');
    } else {
      nav.classList.remove('scrolled');
    }
  }, { passive: true });

  // ─── Active nav link on scroll ───
  var sections = document.querySelectorAll('section[id]');
  var navLinks = document.querySelectorAll('.nav-link');

  function updateActiveLink() {
    var scrollPos = window.scrollY + 200;
    sections.forEach(function (section) {
      var top = section.offsetTop;
      var height = section.offsetHeight;
      var id = section.getAttribute('id');
      if (scrollPos >= top && scrollPos < top + height) {
        navLinks.forEach(function (link) {
          link.classList.remove('active');
          if (link.getAttribute('href') === '#' + id) {
            link.classList.add('active');
          }
        });
      }
    });
  }
  window.addEventListener('scroll', updateActiveLink, { passive: true });

  // ─── Scroll reveal animations ───
  var revealElements = document.querySelectorAll(
    '.section-header, .highlight-card, .skill-category, .project-card, .experience-card, .contact-card, .about-text, .contact-text'
  );

  revealElements.forEach(function (el) {
    el.classList.add('reveal');
  });

  var observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
      }
    });
  }, { threshold: 0.1, rootMargin: '0px 0px -50px 0px' });

  revealElements.forEach(function (el) {
    observer.observe(el);
  });

  // ─── Counter animation ───
  var statNumbers = document.querySelectorAll('.stat-number');
  var statsObserver = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        var target = parseInt(entry.target.getAttribute('data-count'));
        animateCounter(entry.target, target);
        statsObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.5 });

  statNumbers.forEach(function (el) { statsObserver.observe(el); });

  function animateCounter(el, target) {
    var current = 0;
    var step = Math.max(1, Math.floor(target / 40));
    var interval = setInterval(function () {
      current += step;
      if (current >= target) {
        current = target;
        clearInterval(interval);
      }
      el.textContent = current;
    }, 30);
  }

  // ─── Smooth scroll for nav links ───
  document.querySelectorAll('a[href^="#"]').forEach(function (link) {
    link.addEventListener('click', function (e) {
      e.preventDefault();
      var targetId = this.getAttribute('href').substring(1);
      var targetEl = document.getElementById(targetId);
      if (targetEl) {
        targetEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    });
  });

  // ─── Staggered reveal for cards ───
  var cards = document.querySelectorAll('.highlight-card, .project-card, .experience-card, .contact-card');
  cards.forEach(function (card, index) {
    card.style.transitionDelay = (index % 4) * 0.1 + 's';
  });

  // ─── Analytics Tracking ───
  // Track page visit
  fetch('/api/track/visit', { method: 'POST', headers: {'Content-Type': 'application/json'} })
    .catch(err => console.error("Tracking unavailable:", err));

  // Track link clicks
  document.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', function(e) {
      if (this.getAttribute('href').startsWith('#')) return; // Ignore smooth scroll nav links
      
      const linkId = this.id || this.textContent.trim().substring(0, 20);
      const targetUrl = this.href;
      
      fetch('/api/track/click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ link_id: linkId, target_url: targetUrl }),
        keepalive: true // ensures the request is sent even if browser navigates away
      }).catch(err => console.warn("Click tracking failed:", err));
    });
  });

  // ─── Robot Voice Assistant (SUNO / Web Speech API) ───
  const robotBtn = document.getElementById('robot-btn');
  const robotModal = document.getElementById('robot-modal');
  const robotClose = document.getElementById('robot-close');
  const btnSuno = document.getElementById('btn-suno');
  const btnDoubt = document.getElementById('btn-doubt');
  const robotLog = document.getElementById('robot-log');
  
  // Toggle Robot UI
  if (robotBtn) {
    robotBtn.addEventListener('click', () => {
      robotModal.classList.add('active');
    });
    robotClose.addEventListener('click', () => {
      robotModal.classList.remove('active');
      window.speechSynthesis.cancel(); // Stop talking if closed
    });
  }

  // Voice Synthesis (SUNO Mode)
  function speak(text) {
    window.speechSynthesis.cancel(); // restart
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9; // Slightly slower for better sounding 'bot'
    window.speechSynthesis.speak(utterance);
  }

  if (btnSuno) {
    btnSuno.addEventListener('click', () => {
      robotLog.style.display = 'block';
      robotLog.style.color = 'var(--text-secondary)';
      robotLog.innerHTML = '<em>Robot is speaking...</em>';
      speak("Hello! Welcome to Rahul Vishwakarma's portfolio. Rahul is a Mechanical Engineer and currently works as a Diploma Engineer Trainee in the Quality Management System at Ratnamani Metals and Tubes. He loves building creative A. I. and I. O. T. projects. If you have any doubts, click the Doubt button and ask me!");
    });
  }

  // Speech Recognition (DOUBT Mode)
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (SpeechRecognition && btnDoubt) {
    const recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.lang = 'en-US';

    btnDoubt.addEventListener('click', () => {
      window.speechSynthesis.cancel();
      try {
        recognition.start();
        btnDoubt.classList.add('listening');
        robotLog.style.display = 'block';
        robotLog.style.color = 'var(--accent-pink)';
        robotLog.innerHTML = '<em>Listening for your doubt... (Speak now)</em>';
      } catch (e) {
        console.log("Already started", e);
      }
    });

    recognition.onresult = function(event) {
      btnDoubt.classList.remove('listening');
      const transcript = event.results[0][0].transcript.toLowerCase();
      robotLog.innerHTML = `<strong>You asked:</strong> "${transcript}"`;
      
      // The Brain / Keyword Matching
      if (transcript.includes('job') || transcript.includes('work') || transcript.includes('ratnamani')) {
        speak("Rahul currently works as a Diploma Engineer Trainee in the Quality Management System at Ratnamani Metals and Tubes Limited.");
      } else if (transcript.includes('project') || transcript.includes('build')) {
        speak("Rahul has built a Solar Integrated Water Purifier and a custom IoT Home Automation system. You can see them in the Projects section!");
      } else if (transcript.includes('contact') || transcript.includes('email') || transcript.includes('hire')) {
        speak("You can contact Rahul at his email: rahul o vishwakarma 9 at gmail dot com, or reach out via his LinkedIn.");
      } else if (transcript.includes('name') || transcript.includes('who are you')) {
        speak("I am Rahul's virtual portfolio assistant! I am here to help you navigate his work.");
      } else {
        // Unknown question fallback
        speak("I am sorry, I do not know the answer to that. Please type your email so Rahul can reply to you directly.");
        
        robotLog.innerHTML = `
          <strong>You asked:</strong> "${transcript}"<br><br>
          <div style="font-size: 0.9rem; color: var(--text-secondary); margin-bottom: 8px;">I don't know the answer! Please leave your email so the admin can reply to you:</div>
          <div style="display: flex; gap: 8px; margin-top: 5px;">
            <input type="email" id="doubt-email-input" placeholder="your@email.com" required style="flex: 1; padding: 8px; border-radius: 6px; border: 1px solid var(--border); background: rgba(0,0,0,0.5); color: white; outline: none;">
            <button id="doubt-email-submit" class="btn btn-primary" style="padding: 8px 16px; font-size: 0.85rem; border-radius: 6px; border: none; cursor: pointer;">Send</button>
          </div>
        `;
        
        document.getElementById('doubt-email-submit').addEventListener('click', () => {
          const emailInput = document.getElementById('doubt-email-input');
          const email = emailInput.value.trim();
          
          if(!email || !email.includes('@')) {
            emailInput.style.border = "1px solid red";
            return;
          }

          // Send to backend
          fetch('/api/track/question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: transcript, email: email, answered: false })
          }).catch(err => console.error("Failed to send question:", err));
          
          robotLog.innerHTML = `<strong style="color: var(--accent-blue);">Sent successfully!</strong> Admin will email you shortly.`;
          speak("Thank you, your doubt and email have been sent securely.");
        });
      }
    };

    recognition.onerror = function(event) {
      btnDoubt.classList.remove('listening');
      robotLog.innerHTML = '<em>Microphone error. Are you on localhost or HTTPS?</em>';
    };
    
    recognition.onend = function() {
      btnDoubt.classList.remove('listening');
    };
  } else if (btnDoubt) {
    btnDoubt.addEventListener('click', () => {
      alert("🎙️ Speech Recognition is not supported by your browser. Try using Chrome or Edge!");
    });
  }

})();
