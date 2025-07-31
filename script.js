// At the very top of script.js, before everything else:
window.addEventListener("DOMContentLoaded", () => {
  // 1) Preload voices so getVoices() isn’t empty later
  if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
  }

  // 2) Wire up your buttons to the functions
  document.getElementById("voice-btn")?.addEventListener("click", () => {
    // This user click unlocks audio on many browsers
    speak("Listening...");
    startVoice();
  });

  document.getElementById("ask-btn")?.addEventListener("click", () => {
    speak("What would you like to ask?");
    askAI();
  });

  // …repeat for any other buttons you want to attach…
  
  // 3) Kick off wake-word detection in the background
  initWakeWord();
});
/ script.js — revised v3.2

// 0️⃣ Make sure you load this file as a module in your HTML:
// <script type="module" src="script.js"></script>

import { PorcupineWorkerFactory } from "@picovoice/porcupine-web-en-worker";

// 1️⃣ Initialize Porcupine wake-word engine\async function initWakeWord() {
  const worker = await PorcupineWorkerFactory.create({
    keywordPaths: [ "/porcupine/porcupine_aijoe.ppn" ],
    modelPath:    "/porcupine/porcupine_params.pv",
  });

  const stream = await navigator.mediaDevices.getUserMedia({audio: true});
  const ac     = new AudioContext();
  const src    = ac.createMediaStreamSource(stream);
  const proc   = ac.createScriptProcessor(512, 1, 1);

  src.connect(proc);
  proc.connect(ac.destination);

  proc.onaudioprocess = ({ inputBuffer }) => {
    worker.postMessage({ command: "process", inputFrame: inputBuffer.getChannelData(0) });
  };

  worker.onmessage = msg => {
    if (msg.command === "ppn-keyword") {
      console.log("✅ Wake word detected!");
      // TODO: call your speaker-verification or assistant-launch here
    }
  };
}

// 2️⃣ Speech synthesis helperfunction speak(text) {
  if (!("speechSynthesis" in window)) return;

  // If we have no voices yet, wait for them to load
  const voices = speechSynthesis.getVoices();
  if (voices.length === 0) {
    // Listen once for when voices become available, then retry
    speechSynthesis.addEventListener(
      "voiceschanged",
      
}function speak(text) {
  if (!("speechSynthesis" in window)) return;

  const synth = speechSynthesis;
  const voices = synth.getVoices();
  if (!voices.length) {
    synth.addEventListener("voiceschanged", () => speak(text), { once: true });
    return;
  }

  synth.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang = "en-US";
  utt.voice = voices.find(v => v.lang === "en-US") || voices[0];
  synth.speak(utt);
}
/ 3️⃣ Display AI response
function displayAIResponse(txt) {
  let box = document.getElementById('ai-output');
  if (!box) {
    box = document.createElement('div');
    box.id = 'ai-output';
    Object.assign(box.style, {
      position: 'relative',
      zIndex: 2,
      margin: '1rem auto',
      padding: '1rem',
      maxWidth: '600px',
      background: 'rgba(0,0,0,0.7)',
      color: '#fff',
      borderRadius: '8px',
      fontSize: '1rem',
      textAlign: 'left',
    });
    document.body.appendChild(box);
  }
  box.textContent = txt;
}

// 4️⃣ Voice recognition
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    speak('Speech recognition not supported. Please type your question.');
    return askAI();
  }
  const recog = new SR();
  recog.lang = 'en-US';
  speak('Listening...');
  recog.start();

  recog.onresult = e => {
    recog.stop();
    const spoken = e.results[0][0].transcript;
    displayAIResponse(`You said: "${spoken}"`);
    askAI(spoken);
  };
  recog.onerror = err => {
    displayAIResponse('Recognition error: ' + err.error);
    speak("Sorry, didn't catch that.");
  };
}

// 5️⃣ askAI helper
async function askAI(query) {
  let q = query || prompt('What do you want to ask Joey?');
  if (!q) return;
  displayAIResponse('Thinking...');
  speak('Joey is thinking...');

  try {
    const res = await fetch('/.netlify/functions/askAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: q }),
    });
    const data = await res.json();
    if (data.reply) {
      displayAIResponse('Joey says: ' + data.reply);
      setTimeout(() => speak(data.reply), 300);
    } else {
      displayAIResponse('Error: ' + (data.error || 'No response'));
      speak('Sorry, something went wrong.');
    }
  } catch (e) {
    displayAIResponse('Network error: ' + e.message);
    speak('Network error occurred.');
  }
}

// Other helpers unchanged...
// fetchBibleVerse, getLocation, fetchWeather, trackMood, renderMood, manageList, renderList,
// callEmergency, playMusic, tellJoke, fixSomething, findPlace, toggleSection

// 0️⃣ Bootstrapping: wait for DOM
function init() {
  initWakeWord();
  // preload voices
  window.speechSynthesis && speechSynthesis.getVoices();

  // attach UI event listeners
  document.getElementById('voice-btn')?.addEventListener('click', startVoice);
  document.getElementById('bible-btn')?.addEventListener('click', fetchBibleVerse);
  document.getElementById('gps-btn')?.addEventListener('click', getLocation);
  document.getElementById('weather-btn')?.addEventListener('click', fetchWeather);
  document.getElementById('mood-tracker-btn')?.addEventListener('click', trackMood);
  document.getElementById('list-manager-btn')?.addEventListener('click', manageList);
  document.getElementById('emergency-btn')?.addEventListener('click', callEmergency);
  document.getElementById('music-btn')?.addEventListener('click', playMusic);
  document.getElementById('joke-btn')?.addEventListener('click', tellJoke);
  document.getElementById('fix-btn')?.addEventListener('click', fixSomething);
  document.getElementById('find-btn')?.addEventListener('click', findPlace);

  // dynamic inputs
  document.getElementById('mood-submit')?.addEventListener('click', () => {
    const inpt = document.getElementById('mood-input');
    const m = inpt.value.trim();
    if (!m) return;
    const arr = JSON.parse(localStorage.getItem('moods') || '[]');
    arr.push({ m, ts: Date.now() });
    localStorage.setItem('moods', JSON.stringify(arr));
    inpt.value = '';
    renderMood();
    speak('Mood saved.');
  });

  document.getElementById('list-add')?.addEventListener('click', () => {
    const inpt = document.getElementById('list-input');
    const v = inpt.value.trim();
    if (!v) return;
    const arr = JSON.parse(localStorage.getItem('listItems') || '[]');
    arr.push(v);
    localStorage.setItem('listItems', JSON.stringify(arr));
    inpt.value = '';
    renderList();
    speak('Item added to list.');
  });
}

// kick things off
window.addEventListener('DOMContentLoaded', init);
