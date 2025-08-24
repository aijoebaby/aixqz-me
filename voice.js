# AIJOE Voice Kit (Browser‑only, copy‑paste)

This gives you **hands‑free voice control** with a wake phrase ("AIJOE") and a super‑simple **“knows it’s John”** check using a spoken passphrase (no cloud, saved only in your browser).

Works best on **Android Chrome**. iOS Safari has limits with continuous listening.

---

## What you get

1. **Wake phrase**: say “AIJOE” → you’ll hear a *beep* → AIJOE says “Go ahead.”
2. **Command capture**: speak your command (weather, joke, music, GPS, Bible, ask AIJOE, help).
3. **“Knows me”**: AIJOE can require *your* passphrase after the wake phrase. If the phrase doesn’t match, commands won’t run.

> This passphrase method is simple and private. If you later want real **voice biometrics** or an offline wake word model (e.g., Porcupine), see the *Upgrades* at the bottom.

---

## Step 1 — Add these elements to your `index.html`

Put these **once** near the bottom of `<body>` (above your other scripts is fine). You can position/style them later with your CSS.

```html
<!-- Voice Controls (put near end of <body>) -->
<div id="voiceDock" style="position:fixed; right:12px; bottom:12px; z-index:9999; display:flex; gap:8px; align-items:center; font-family:system-ui, sans-serif;">
  <button id="btn-voice-toggle" style="padding:10px 14px; border-radius:999px; border:none; box-shadow:0 4px 12px rgba(0,0,0,.2);">🎙️ Enable Voice</button>
  <button id="btn-voice-enroll" style="padding:10px 14px; border-radius:12px; border:1px solid #ddd; background:#fff;">Enroll My Voice</button>
  <label style="display:flex; gap:6px; align-items:center; background:#fff; padding:8px 10px; border:1px solid #eee; border-radius:12px;">
    <span>Require my voice</span>
    <input type="checkbox" id="chk-require-voice" />
  </label>
  <select id="voice-select" title="Choose voice" style="padding:8px; border-radius:8px; border:1px solid #ddd;"></select>
</div>

<!-- Beep element -->
<audio id="beep" preload="auto">
  <source src="data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEAESsAACJWAAACABYAAAACAAACAGZmZmZmZmY=" type="audio/wav" />
</audio>

<!-- Hook this to your existing buttons by id (rename to match yours) -->
<!-- Examples (make sure these IDs exist on your page):
  <button id="btn-weather">Weather</button>
  <button id="btn-joke">Joke</button>
  <button id="btn-music">Music</button>
  <button id="btn-gps">GPS</button>
  <button id="btn-bible">Bible Verse</button>
  <button id="btn-help">Help</button>
  <button id="btn-askai">Ask AIJOE</button>
-->

<script src="/voice.js"></script>
```

> **Important:** Make sure your existing feature buttons use these IDs (or change the IDs in `voice.js` below to match your app).

---

## Step 2 — Create `/voice.js` and paste this code

This file handles wake phrase, command capture, speaking, and the passphrase check.

```javascript
// /voice.js — AIJOE Voice Kit
// Works best in Chrome. Uses the Web Speech API (SpeechRecognition + SpeechSynthesis).

// -------- Utilities --------
const isChrome = /Chrome\//.test(navigator.userAgent) && !/Edg\//.test(navigator.userAgent);
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;

function $(id){ return document.getElementById(id); }
function sleep(ms){ return new Promise(r=>setTimeout(r, ms)); }

function speak(text){
  if (!("speechSynthesis" in window)) return;
  const utter = new SpeechSynthesisUtterance(String(text));
  utter.lang = "en-US";

  // try to pick a clear male-ish English voice if available
  const voices = speechSynthesis.getVoices();
  const prefer = [
    'Google US English', 'Microsoft Guy Online (Natural)', 'Microsoft David',
    'Alex', 'Daniel', 'English United States'
  ];
  utter.voice = voices.find(v => prefer.some(p => (v.name||'').includes(p)))
               || voices.find(v => (v.lang||'').startsWith('en'))
               || voices[0];
  speechSynthesis.cancel();
  speechSynthesis.speak(utter);
}

// Populate the voice dropdown
window.addEventListener('load', () => {
  if (!("speechSynthesis" in window)) return;
  function fill(){
    const sel = $('voice-select'); if (!sel) return;
    sel.innerHTML = '';
    const vs = speechSynthesis.getVoices();
    vs.forEach((v,i)=>{
      const o=document.createElement('option');
      o.value=i; o.textContent = `${v.name} (${v.lang})`;
      sel.appendChild(o);
    });
  }
  fill();
  speechSynthesis.addEventListener('voiceschanged', fill);
  $('voice-select')?.addEventListener('change', (e)=>{
    const idx = Number(e.target.value);
    const vs = speechSynthesis.getVoices();
    // Set a sample so user hears selection
    const u = new SpeechSynthesisUtterance('Voice selected.');
    u.voice = vs[idx];
    speechSynthesis.cancel();
    speechSynthesis.speak(u);
  });
});

function playBeep(){ $('beep')?.play().catch(()=>{}); }

// -------- Wake phrase + Commands --------
const VoiceState = {
  enabled: false,
  listeningWake: false,
  requireMyVoice: JSON.parse(localStorage.getItem('requireMyVoice') || 'false'),
  passphrase: localStorage.getItem('voicePass') || '',
  recognizer: null,
  lastPartial: ''
};

function saveRequireFlag(){ localStorage.setItem('requireMyVoice', JSON.stringify(VoiceState.requireMyVoice)); }

function ensureRecognizer(){
  if (!SR) return null;
  if (VoiceState.recognizer) return VoiceState.recognizer;
  const r = new SR();
  r.lang = 'en-US';
  r.continuous = true;     // keep listening
  r.interimResults = true; // get partials
  r.maxAlternatives = 1;

  r.onresult = (evt) => {
    let transcript = '';
    for (let i = evt.resultIndex; i < evt.results.length; i++) {
      transcript += evt.results[i][0].transcript + ' ';
    }
    VoiceState.lastPartial = transcript.toLowerCase();

    if (VoiceState.listeningWake) {
      if (heardWake(transcript)) {
        VoiceState.listeningWake = false;
        playBeep();
        speak('Go ahead');
        listenForCommand();
      }
    }
  };

  r.onend = () => {
    if (VoiceState.enabled) {
      // auto-restart if user left it on
      try { r.start(); } catch {}
    }
  };

  return (VoiceState.recognizer = r);
}

function heardWake(text){
  const t = String(text).toLowerCase();
  // common ways users say it
  const phrases = ['ai joe','hey ai joe','aijoe','ai-joe','ai joe help','hey joe','hey ai joe hey'];
  return phrases.some(p => t.includes(p));
}

async function listenOnce(timeoutMs=6000){
  // temporary one-shot recognizer for command/passphrase
  if (!SR) return '';
  return new Promise((resolve) => {
    const r = new SR();
    r.lang='en-US'; r.continuous=false; r.interimResults=false; r.maxAlternatives=1;
    let done = false;
    const finish = (text) => { if (done) return; done=true; try{ r.stop(); }catch{} resolve(text||''); };
    r.onresult = (e)=> finish(e.results[0][0].transcript || '');
    r.onerror = ()=> finish('');
    r.onend = ()=> finish('');
    try { r.start(); } catch { finish(''); }
    setTimeout(()=> finish(''), timeoutMs);
  });
}

async function listenForCommand(){
  // If we require John’s voice, ask for his passphrase first
  if (VoiceState.requireMyVoice && VoiceState.passphrase) {
    speak('John, please say your passphrase.');
    const heard = (await listenOnce(6000)).toLowerCase().trim();
    if (!heard || !heard.includes(VoiceState.passphrase.toLowerCase())){
      speak("Sorry, that didn't match.");
      await sleep(800);
      startWakeLoop();
      return;
    }
  }

  speak('Listening.');
  const cmd = (await listenOnce(7000)).toLowerCase();
  if (!cmd){ speak("I didn't catch that."); return startWakeLoop(); }
  handleCommand(cmd);
  startWakeLoop();
}

function clickOrRun(id, fallback){
  const el = document.getElementById(id);
  if (el) el.click();
  if (fallback) fallback();
}

function handleCommand(t){
  // You can expand these intents anytime
  if (/weather|forecast|temperature/.test(t)) {
    speak('Opening weather.');
    clickOrRun('btn-weather');
  }
  else if (/joke|make me laugh/.test(t)) {
    speak('Here is a joke.');
    clickOrRun('btn-joke');
  }
  else if (/bible|verse/.test(t)) {
    speak('Bible verse coming up.');
    clickOrRun('btn-bible');
  }
  else if (/music|song|youtube/.test(t)) {
    speak('Opening music.');
    clickOrRun('btn-music', ()=> window.open('https://youtube.com','_blank'));
  }
  else if (/(gps|maps|directions|where am i)/.test(t)) {
    speak('Opening maps.');
    clickOrRun('btn-gps');
  }
  else if (/(help|emergency|call 911)/.test(t)) {
    speak('If this is an emergency say Call Nine One One.');
    clickOrRun('btn-help');
  }
  else if (/(talk|ask|ai joe|ask ai)/.test(t)) {
    speak('Ask me anything.');
    clickOrRun('btn-askai');
  }
  else {
    speak("Sorry, I don't have a skill for that yet.");
  }
}

// -------- Enrollment (simple passphrase = “knows it’s John”) --------
async function enrollPassphrase(){
  let phrase = prompt('Type a short phrase you will always say (example: purple pineapple)');
  if (!phrase) return;
  phrase = phrase.trim();
  speak('Please say: ' + phrase);
  const heard = (await listenOnce(6000)).toLowerCase();
  if (!heard.includes(phrase.toLowerCase())){
    speak("That didn't match. Try again.");
    return;
  }
  localStorage.setItem('voicePass', phrase);
  VoiceState.passphrase = phrase;
  speak('Saved. I will ask for that phrase after the wake word.');
}

// -------- Controls / wiring --------
async function startWakeLoop(){
  if (!SR){ speak('Sorry, this browser does not support voice recognition.'); return; }
  const r = ensureRecognizer();
  VoiceState.listeningWake = true;
  try { r.start(); } catch {}
}

function stopWakeLoop(){
  VoiceState.listeningWake = false;
  try { VoiceState.recognizer && VoiceState.recognizer.stop(); } catch {}
}

function toggleVoice(){
  VoiceState.enabled = !VoiceState.enabled;
  if (VoiceState.enabled){
    $('btn-voice-toggle').textContent = '🎙️ Voice ON';
    // Ask for mic permission with a one-shot listen
    speak('Voice enabled. Say AIJOE to wake me.');
    startWakeLoop();
  } else {
    $('btn-voice-toggle').textContent = '🎙️ Enable Voice';
    stopWakeLoop();
    speak('Voice disabled.');
  }
}

// Remember the checkbox state
window.addEventListener('load', ()=>{
  const chk = $('chk-require-voice');
  if (chk){ chk.checked = VoiceState.requireMyVoice; chk.addEventListener('change', ()=>{ VoiceState.requireMyVoice = chk.checked; saveRequireFlag(); }); }
  $('btn-voice-toggle')?.addEventListener('click', toggleVoice);
  $('btn-voice-enroll')?.addEventListener('click', enrollPassphrase);
});
```

---

## Step 3 — Make sure your feature buttons have IDs

Match these to your app so voice can “press” them for you:

* Weather → `btn-weather`
* Joke → `btn-joke`
* Music/YouTube → `btn-music`
* GPS/Maps → `btn-gps`
* Bible verse → `btn-bible`
* Emergency/Help → `btn-help`
* Ask AIJOE / Chat → `btn-askai`

(Or rename the IDs inside `handleCommand()` to whatever you already use.)

---

## How to use (super simple)

1. Open your site on **Android Chrome**.
2. Tap **🎙️ Enable Voice** once and allow the microphone.
3. Say **“AIJOE”** → *beep* → AIJOE says *“Go ahead.”*
4. Speak your command (e.g., “weather” or “play music”).
5. To make it “know you,” click **Enroll My Voice**, choose a short phrase, and say it. Turn on **Require my voice**.

---

## Troubleshooting

* **It keeps stopping** → Chrome sometimes ends sessions; the kit auto‑restarts. Keep the screen on.
* **No mic prompt** → Tap 🎙️ again. Browser needs a user gesture first.
* **It doesn’t hear ‘AIJOE’** → Try “Hey AI JOE” or “AI JOE help.” You can add more phrases in `heardWake()`.
* **Wrong voice** → Pick a voice in the dropdown.
* **iPhone** → iOS Safari limits background recognition; use tap‑to‑talk for now.

---

## Upgrades (when you’re ready)

* **Real wake word model (offline, accurate)**: Use Picovoice **Porcupine Web** with a custom “AIJOE” keyword. You’ll generate a `.ppn` file and initialize the Porcupine worker; it runs fully in the browser audio thread.
* **Real speaker verification**: Add a lightweight on‑device voiceprint (MFCC) check via WebAudio + feature extraction (e.g., Meyda), comparing embeddings with cosine similarity. This avoids cloud biometrics and keeps audio local. I can wire this in next if you want.
* **Offline speech‑to‑text**: Use Vosk (WebAssembly). Heavier download but works without internet.

---

**You can copy/paste this exactly.** If any button IDs differ, just tweak them inside `handleCommand()`.
