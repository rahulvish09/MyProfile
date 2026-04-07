(function () {
    'use strict';
  
    // ─── Scroll reveal animations ───
    var revealElements = document.querySelectorAll('.reveal');
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
  
    // ─── Analytics Tracking ───
    fetch('/api/track/visit', { method: 'POST', headers: {'Content-Type': 'application/json'} })
        .catch(err => console.error("Tracking unavailable:", err));
  
    document.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', function(e) {
        if (this.getAttribute('href').startsWith('#')) return; 
        fetch('/api/track/click', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ link_id: 'solar-page-' + (this.id || 'link'), target_url: this.href }),
          keepalive: true
        }).catch(err => console.warn("Click tracking failed:", err));
      });
    });
  
    // ─── Robot AI Logic (Solar Specfic) ───
    const robotBtn = document.getElementById('robot-btn');
    const robotModal = document.getElementById('robot-modal');
    const robotClose = document.getElementById('robot-close');
    const btnSuno = document.getElementById('btn-suno');
    const btnDoubt = document.getElementById('btn-doubt');
    const robotLog = document.getElementById('robot-log');
    
    if (robotBtn) {
      robotBtn.addEventListener('click', () => {
        robotModal.classList.add('active');
      });
      robotClose.addEventListener('click', () => {
        robotModal.classList.remove('active');
        window.speechSynthesis.cancel();
      });
    }
  
    function speak(text) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.95;
      window.speechSynthesis.speak(utterance);
    }
  
    if (btnSuno) {
      btnSuno.addEventListener('click', () => {
        robotLog.style.display = 'block';
        robotLog.style.color = 'var(--text-secondary)';
        robotLog.innerHTML = '<em>Robot is speaking...</em>';
        speak("Welcome to Rahul's Solar Water Purifier! This innovative project uses renewable 24-volt solar energy to drive a multi-stage filtration and U. V. sterilization process to provide safe drinking water. Ask me any doubts!");
      });
    }
  
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
          robotLog.innerHTML = '<em>Listening for your doubt...</em>';
        } catch (e) {
          console.log(e);
        }
      });
  
      recognition.onresult = function(event) {
        btnDoubt.classList.remove('listening');
        const transcript = event.results[0][0].transcript.toLowerCase();
        robotLog.innerHTML = `<strong>You asked:</strong> "${transcript}"`;
        
        // Solar specific brain
        if (transcript.includes('how much') || transcript.includes('capacity') || transcript.includes('liters')) {
          speak("The system has a total water capacity of 20 liters.");
        } else if (transcript.includes('power') || transcript.includes('battery') || transcript.includes('electricity') || transcript.includes('solar')) {
          speak("It is powered entirely by solar panels utilizing a 24 Volt energy storage battery and a P. W. M. charge controller.");
        } else if (transcript.includes('filter') || transcript.includes('clean') || transcript.includes('stages')) {
          speak("The water goes through a 3-stage mechanical filtration process to remove dirt and odor, followed by a U. V. sterilization chamber to kill bacteria.");
        } else if (transcript.includes('cost') || transcript.includes('price')) {
          speak("It is highly cost-effective and designed for rural and remote areas where grid power is unavailable.");
        } else {
          speak("I do not know the answer to that specific question. Custom tracking has forwarded your doubt to Rahul's admin console.");
          fetch('/api/track/question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: transcript + " [Solar Project]", answered: false })
          }).catch(err => console.error(err));
        }
      };
      
      recognition.onerror = () => { btnDoubt.classList.remove('listening'); robotLog.innerHTML = '<em>Microphone error. Check HTTPS/Localhost.</em>'; };
      recognition.onend = () => { btnDoubt.classList.remove('listening'); };
    }
  
  })();
