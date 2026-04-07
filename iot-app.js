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
          body: JSON.stringify({ link_id: 'iot-page-' + (this.id || 'link'), target_url: this.href }),
          keepalive: true
        }).catch(err => console.warn("Click tracking failed:", err));
      });
    });
  
    // ─── Robot AI Logic (IoT Specific) ───
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
        speak("Welcome to Rahul's IoT Smart Home Automation System! This fantastic project uses a Node M. C. U. E. S. P. 8266 to allow you to securely control 4 separate high voltage electrical appliances from anywhere in the world using standard Wi-Fi. It is energy efficient and highly scalable. Ask me any doubts!");
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
        
        // IoT specific brain
        if (transcript.includes('board') || transcript.includes('chip') || transcript.includes('microcontroller') || transcript.includes('processor')) {
          speak("The core brain of the project is the Node M. C. U. E. S. P. 8266 IoT board.");
        } else if (transcript.includes('appliances') || transcript.includes('control') || transcript.includes('lights') || transcript.includes('fans')) {
          speak("The system uses a 4-channel relay module to securely isolate and switch high-voltage loads like fans and lights.");
        } else if (transcript.includes('future') || transcript.includes('next') || transcript.includes('voice')) {
          speak("Future plans include adding Google Assistant and Alexa voice control, advanced analytics UI, and integration with temperature sensors!");
        } else if (transcript.includes('internet') || transcript.includes('wi-fi') || transcript.includes('wifi')) {
          speak("Yes! The board connects directly to your local Wi-Fi router, allowing you to control the house remotely over the internet via mobile or web.");
        } else if (transcript.includes('who made') || transcript.includes('creator') || transcript.includes('build')) {
          speak("This Smart Home System was entirely developed and implemented by Rahul Vishwakarma using Node M. C. U. and relay based components!");
        } else {
          speak("I do not know the answer to that specific question. Custom tracking has forwarded your doubt to Rahul's admin console.");
          fetch('/api/track/question', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ question: transcript + " [IoT Project]", answered: false })
          }).catch(err => console.error(err));
        }
      };
      
      recognition.onerror = () => { btnDoubt.classList.remove('listening'); robotLog.innerHTML = '<em>Microphone error. Check HTTPS/Localhost.</em>'; };
      recognition.onend = () => { btnDoubt.classList.remove('listening'); };
    }
  
  })();
