/* Tej Quote Orb - floating voice-first quote assistant */
(function () {
  const QUOTE_ENDPOINT = '/api/quote';
  const MASCOT_IMAGE = 'tej.png';
  const WHATSAPP_NUMBER = '917358615527';

  const LANGUAGES = {
    'en': { code: 'en-IN', start: 'Start quote', mic: 'Speak', skip: 'Skip', back: 'Back' },
    'ta': { code: 'ta-IN', start: 'Quote start', mic: 'Pesunga', skip: 'Skip', back: 'Back' },
    'hi': { code: 'hi-IN', start: 'Quote start', mic: 'Boliyega', skip: 'Skip', back: 'Back' },
    'te': { code: 'te-IN', start: 'Quote start', mic: 'Speak', skip: 'Skip', back: 'Back' },
    'ml': { code: 'ml-IN', start: 'Quote start', mic: 'Speak', skip: 'Skip', back: 'Back' },
    'kn': { code: 'kn-IN', start: 'Quote start', mic: 'Speak', skip: 'Skip', back: 'Back' }
  };

  const QUESTION_FLOW = [
    {
      key: 'language',
      face: 'happy',
      text: 'I can build a quick website quote. Which language should I use?',
      options: [
        { label: 'English', value: 'en' },
        { label: 'Tamil', value: 'ta' },
        { label: 'Hindi', value: 'hi' },
        { label: 'Telugu', value: 'te' },
        { label: 'Malayalam', value: 'ml' },
        { label: 'Kannada', value: 'kn' }
      ]
    },
    {
      key: 'businessType',
      text: 'What kind of business is this for?',
      placeholder: 'Example: clinic, logistics, coaching, restaurant'
    },
    {
      key: 'projectType',
      text: 'Are we creating a new website or upgrading an existing one?',
      options: [
        { label: 'New website', value: 'new' },
        { label: 'Redesign', value: 'redesign' },
        { label: 'Speed fix', value: 'speed' },
        { label: 'Web app', value: 'app' }
      ]
    },
    {
      key: 'pages',
      text: 'How many pages do you roughly need?',
      options: [
        { label: '1 page', value: '1' },
        { label: '3-5 pages', value: '5' },
        { label: '6-10 pages', value: '10' },
        { label: '10+ pages', value: '15' }
      ]
    },
    {
      key: 'features',
      text: 'Pick the features you need.',
      multiple: true,
      options: [
        { label: 'Contact forms', value: 'forms' },
        { label: 'Booking', value: 'booking' },
        { label: 'Payments', value: 'payments' },
        { label: 'CMS/blog', value: 'cms' },
        { label: 'SEO setup', value: 'seo' },
        { label: 'Dashboard', value: 'dashboard' },
        { label: 'Multilingual', value: 'multilingual' },
        { label: 'Maintenance', value: 'maintenance' }
      ]
    },
    {
      key: 'timeline',
      text: 'How soon do you want it live?',
      options: [
        { label: '1 week', value: 'urgent' },
        { label: '2-3 weeks', value: 'normal' },
        { label: '1 month+', value: 'relaxed' }
      ]
    },
    {
      key: 'budget',
      text: 'Do you already have a budget range?',
      options: [
        { label: 'Under 25k', value: 'under25' },
        { label: '25k-60k', value: '25to60' },
        { label: '60k-1.2L', value: '60to120' },
        { label: '1.2L+', value: '120plus' },
        { label: 'Not sure', value: 'unknown' }
      ]
    },
    {
      key: 'contact',
      text: 'Last bit: your name and WhatsApp/email, so Troyflex can follow up.',
      placeholder: 'Example: Akash, 98765 43210'
    }
  ];

  let currentStep = 0;
  let answers = {};
  let selectedMulti = new Set();
  let recognition = null;
  let isListening = false;
  let hasUserInteracted = false;
  let canSpeak = false;

  function init() {
    injectWidget();
    setupSpeechRecognition();
    bindBaseEvents();
    setTimeout(showNudge, 20000);
  }

  function injectWidget() {
    let root = document.getElementById('tej-widget-root');
    if (!root) {
      root = document.createElement('div');
      root.id = 'tej-widget-root';
      document.body.appendChild(root);
    }

    root.innerHTML = `
      <section id="tej-orb-widget" class="tej-orb-idle" aria-live="polite">
        <div id="tej-speech-pop" class="tej-speech-pop">
          <button id="tej-pop-close" class="tej-pop-close" aria-label="Dismiss Tej">×</button>
          <p id="tej-pop-text">Want a quick website quote? I can estimate it in 60 seconds.</p>
          <button id="tej-pop-start" class="tej-mini-cta">Start quote</button>
        </div>

        <button id="tej-orb" class="tej-orb" aria-label="Start Troyflex quote assistant">
          <span class="tej-orb-shadow"></span>
          <span id="tej-face" class="tej-face tej-face-idle">
            <span class="tej-eye tej-eye-left"></span>
            <span class="tej-eye tej-eye-right"></span>
            <span class="tej-mouth"></span>
          </span>
          <img src="${MASCOT_IMAGE}" alt="" class="tej-orb-image" />
        </button>

        <div id="tej-quote-flow" class="tej-quote-flow" role="dialog" aria-label="Troyflex quote assistant">
          <div class="tej-flow-top">
            <div>
              <span class="tej-flow-kicker">Tej quote engine</span>
              <h3>Website estimate</h3>
            </div>
            <button id="tej-flow-close" class="tej-icon-btn" aria-label="Close quote assistant">×</button>
          </div>
          <div class="tej-progress"><span id="tej-progress-bar"></span></div>
          <div id="tej-flow-body" class="tej-flow-body"></div>
          <div class="tej-flow-actions">
            <button id="tej-back" class="tej-secondary-btn">Back</button>
            <button id="tej-mic" class="tej-secondary-btn">Speak</button>
            <button id="tej-next" class="tej-primary-btn">Next</button>
          </div>
        </div>
      </section>
    `;
  }

  function bindBaseEvents() {
    document.addEventListener('click', () => {
      hasUserInteracted = true;
    }, { once: true });

    document.getElementById('tej-orb').addEventListener('click', openFlow);
    document.getElementById('tej-pop-start').addEventListener('click', openFlow);
    document.getElementById('tej-pop-close').addEventListener('click', hideNudge);
    document.getElementById('tej-flow-close').addEventListener('click', closeFlow);
    document.getElementById('tej-back').addEventListener('click', goBack);
    document.getElementById('tej-next').addEventListener('click', goNext);
    document.getElementById('tej-mic').addEventListener('click', toggleVoice);
  }

  function showNudge() {
    if (sessionStorage.getItem('tej_quote_dismissed') === 'true') return;
    document.getElementById('tej-orb-widget').classList.add('tej-orb-nudging');
    speak('Want a quick website quote? Tap me and I will estimate it.');
  }

  function hideNudge() {
    sessionStorage.setItem('tej_quote_dismissed', 'true');
    document.getElementById('tej-orb-widget').classList.remove('tej-orb-nudging');
  }

  function openFlow() {
    hasUserInteracted = true;
    canSpeak = true;
    hideNudge();
    document.getElementById('tej-orb-widget').classList.add('tej-flow-open');
    renderStep();
  }

  function closeFlow() {
    document.getElementById('tej-orb-widget').classList.remove('tej-flow-open');
    stopVoice();
    window.speechSynthesis?.cancel();
  }

  function renderStep() {
    const step = QUESTION_FLOW[currentStep];
    const body = document.getElementById('tej-flow-body');
    const progress = ((currentStep + 1) / QUESTION_FLOW.length) * 100;
    const langUi = LANGUAGES[answers.language || 'en'] || LANGUAGES.en;

    setFace(step.face || 'idle');
    document.getElementById('tej-progress-bar').style.width = `${progress}%`;
    document.getElementById('tej-back').disabled = currentStep === 0;
    document.getElementById('tej-mic').textContent = langUi.mic;
    document.getElementById('tej-back').textContent = langUi.back;
    document.getElementById('tej-next').textContent = step.multiple ? 'Done' : 'Next';

    let control = '';
    if (step.options) {
      control = `<div class="tej-option-grid ${step.multiple ? 'tej-option-grid-multi' : ''}">
        ${step.options.map(option => {
          const active = step.multiple
            ? selectedMulti.has(option.value) || (answers[step.key] || []).includes(option.value)
            : answers[step.key] === option.value;
          return `<button class="tej-option ${active ? 'active' : ''}" data-value="${option.value}">${option.label}</button>`;
        }).join('')}
      </div>`;
    } else {
      control = `<textarea id="tej-free-answer" class="tej-free-answer" rows="3" placeholder="${escapeHtml(step.placeholder || '')}">${escapeHtml(answers[step.key] || '')}</textarea>`;
    }

    body.innerHTML = `
      <div class="tej-question-count">Question ${currentStep + 1} of ${QUESTION_FLOW.length}</div>
      <p class="tej-question">${step.text}</p>
      ${control}
    `;

    body.querySelectorAll('.tej-option').forEach(button => {
      button.addEventListener('click', () => selectOption(button.dataset.value));
    });

    const freeAnswer = document.getElementById('tej-free-answer');
    if (freeAnswer) {
      freeAnswer.focus();
      freeAnswer.addEventListener('input', () => {
        answers[step.key] = freeAnswer.value.trim();
      });
    }

    speak(step.text);
  }

  function selectOption(value) {
    const step = QUESTION_FLOW[currentStep];
    if (step.multiple) {
      if (selectedMulti.has(value)) selectedMulti.delete(value);
      else selectedMulti.add(value);
      answers[step.key] = Array.from(selectedMulti);
      renderStep();
      return;
    }
    answers[step.key] = value;
    if (step.key === 'language') setRecognitionLanguage();
    setTimeout(goNext, 120);
  }

  function goNext() {
    const step = QUESTION_FLOW[currentStep];
    const freeAnswer = document.getElementById('tej-free-answer');
    if (freeAnswer) answers[step.key] = freeAnswer.value.trim();
    if (step.multiple) answers[step.key] = Array.from(selectedMulti);

    if (!answers[step.key] || (Array.isArray(answers[step.key]) && answers[step.key].length === 0)) {
      pulseQuestion();
      return;
    }

    if (currentStep < QUESTION_FLOW.length - 1) {
      currentStep += 1;
      selectedMulti = new Set(answers[QUESTION_FLOW[currentStep].key] || []);
      renderStep();
    } else {
      generateQuote();
    }
  }

  function goBack() {
    if (currentStep === 0) return;
    currentStep -= 1;
    selectedMulti = new Set(answers[QUESTION_FLOW[currentStep].key] || []);
    renderStep();
  }

  function pulseQuestion() {
    const body = document.getElementById('tej-flow-body');
    body.classList.remove('tej-shake');
    void body.offsetWidth;
    body.classList.add('tej-shake');
  }

  async function generateQuote() {
    setFace('thinking');
    const body = document.getElementById('tej-flow-body');
    body.innerHTML = `
      <div class="tej-thinking">
        <span></span><span></span><span></span>
      </div>
      <p class="tej-question">Calculating the quote. Tiny spreadsheet brain is awake.</p>
    `;
    document.getElementById('tej-next').disabled = true;
    document.getElementById('tej-mic').disabled = true;

    try {
      const response = await fetch(QUOTE_ENDPOINT, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers })
      });
      const data = response.ok ? await response.json() : buildLocalQuote(answers);
      renderQuote(data);
    } catch (error) {
      renderQuote(buildLocalQuote(answers));
    }
  }

  function renderQuote(data) {
    setFace('happy');
    const quote = data.quote || data;
    const body = document.getElementById('tej-flow-body');
    const message = encodeURIComponent(`Hi Troyflex, Tej estimated my project at ${quote.range}. Business: ${answers.businessType || ''}. Can we discuss?`);
    body.innerHTML = `
      <div class="tej-result-card">
        <span class="tej-result-label">${escapeHtml(quote.packageName)}</span>
        <h4>${escapeHtml(quote.range)}</h4>
        <p>${escapeHtml(quote.summary)}</p>
        <div class="tej-result-meta">
          <span>${escapeHtml(quote.timeline)}</span>
          <span>${escapeHtml(quote.confidence)}</span>
        </div>
      </div>
      <div class="tej-result-actions">
        <a class="tej-primary-btn" href="https://wa.me/${WHATSAPP_NUMBER}?text=${message}" target="_blank" rel="noopener">Send to WhatsApp</a>
        <button id="tej-restart" class="tej-secondary-btn">Restart</button>
      </div>
    `;
    document.getElementById('tej-next').style.display = 'none';
    document.getElementById('tej-mic').style.display = 'none';
    document.getElementById('tej-restart').addEventListener('click', restart);
    speak(`${quote.packageName}. Estimated range ${quote.range}. ${quote.summary}`);
  }

  function restart() {
    currentStep = 0;
    answers = {};
    selectedMulti = new Set();
    document.getElementById('tej-next').disabled = false;
    document.getElementById('tej-mic').disabled = false;
    document.getElementById('tej-next').style.display = '';
    document.getElementById('tej-mic').style.display = '';
    renderStep();
  }

  function buildLocalQuote(input) {
    const pageCount = Number(input.pages || 1);
    const features = input.features || [];
    let base = 15000;
    let packageName = 'Launchpack';

    if (input.projectType === 'app' || features.includes('dashboard')) {
      base = 120000;
      packageName = 'Elite';
    } else if (pageCount >= 6 || features.includes('cms') || features.includes('payments')) {
      base = 65000;
      packageName = 'Growth';
    } else if (pageCount > 1 || input.projectType === 'redesign') {
      base = 35000;
      packageName = 'Growth Lite';
    }

    const addOns = {
      booking: 10000,
      payments: 15000,
      cms: 15000,
      seo: 10000,
      dashboard: 40000,
      multilingual: 12000,
      maintenance: 8000
    };
    const addOnTotal = features.reduce((sum, feature) => sum + (addOns[feature] || 0), 0);
    const urgency = input.timeline === 'urgent' ? 1.18 : 1;
    const low = Math.round(((base + addOnTotal) * urgency) / 1000) * 1000;
    const high = Math.round((low * 1.28) / 1000) * 1000;

    return {
      quote: {
        packageName,
        range: `₹${low.toLocaleString('en-IN')} - ₹${high.toLocaleString('en-IN')}`,
        timeline: input.timeline === 'urgent' ? '7-10 days' : input.timeline === 'relaxed' ? '3-5 weeks' : '2-3 weeks',
        confidence: 'Initial estimate',
        summary: `For a ${input.businessType || 'business'} project, this looks like a ${packageName} build with ${features.length ? features.join(', ') : 'core website'} included.`
      }
    };
  }

  function setupSpeechRecognition() {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) return;
    recognition = new SpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;
    setRecognitionLanguage();
    recognition.onstart = () => {
      isListening = true;
      setFace('listening');
      document.getElementById('tej-mic').classList.add('listening');
    };
    recognition.onend = stopVoice;
    recognition.onerror = stopVoice;
    recognition.onresult = event => {
      const transcript = event.results[0][0].transcript;
      const freeAnswer = document.getElementById('tej-free-answer');
      if (freeAnswer) {
        freeAnswer.value = transcript;
        answers[QUESTION_FLOW[currentStep].key] = transcript.trim();
      }
    };
  }

  function setRecognitionLanguage() {
    if (!recognition) return;
    const lang = LANGUAGES[answers.language || navigator.language?.slice(0, 2) || 'en'] || LANGUAGES.en;
    recognition.lang = lang.code;
  }

  function toggleVoice() {
    if (!recognition) return;
    hasUserInteracted = true;
    if (isListening) recognition.stop();
    else {
      window.speechSynthesis?.cancel();
      recognition.start();
    }
  }

  function stopVoice() {
    isListening = false;
    document.getElementById('tej-mic')?.classList.remove('listening');
    setFace('idle');
  }

  function speak(text) {
    if (!canSpeak || !hasUserInteracted || !window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    const utterance = new SpeechSynthesisUtterance(text.replace(/[₹*]/g, ''));
    const lang = LANGUAGES[answers.language || 'en'] || LANGUAGES.en;
    utterance.lang = lang.code;
    utterance.rate = 1.02;
    utterance.pitch = 1.05;
    window.speechSynthesis.speak(utterance);
  }

  function setFace(mode) {
    const face = document.getElementById('tej-face');
    if (!face) return;
    face.className = `tej-face tej-face-${mode}`;
  }

  function escapeHtml(value) {
    return String(value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
