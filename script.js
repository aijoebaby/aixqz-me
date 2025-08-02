// script.js
// ——————————————————————————————————————————————
// Load this as a module in your HTML:
//   <script type="module" src="script.js"></script>
// ——————————————————————————————————————————————

import { PorcupineWorkerFactory } from "@picovoice/porcupine-web-en-worker";

//
// 🚀 ENTRY POINT: on DOM ready, wire buttons & init wake-word
//
window.addEventListener("DOMContentLoaded", init);

function init() {
  // 1️⃣ Preload TTS voices
  if ("speechSynthesis" in window) speechSynthesis.getVoices();

  // 2️⃣ Wire up all buttons
  const handlers = {
    "voice-btn":        () => { speak("Listening..."); startVoice(); },
    "ask-btn":          () => { speak("What would you like to ask?"); askAI(); },
    "bible-btn":        fetchBibleVerse,
    "gps-btn":          getLocation,
    "weather-btn":      fetchWeather,
    "joke-btn":         tellJoke,
    "fix-btn":          fixSomething,
    "find-btn":         findPlace,
    "music-btn":        playMusic,
    "mood-tracker-btn": trackMood,
    "list-manager-btn": manageList,
    "emergency-btn":    callEmergency
  };

  for (const [id, fn] of Object.entries(handlers)) {
    document.getElementById(id)?.addEventListener("click", fn);
  }

  // Mood tracker “Submit”
  document.getElementById("mood-submit")?.addEventListener("click", () => {
    const input = document.getElementById("mood-input");
    const m = input.value.trim();
    if (!m) return;
    const arr = JSON.parse(localStorage.getItem("moods")||"[]");
    arr.push({ m, ts: Date.now() });
    localStorage.setItem("moods", JSON.stringify(arr));
    input.value = "";
    renderMood();
    speak("Mood saved.");
  });

  // List manager “Add”
  document.getElementById("list-add")?.addEventListener("click", () => {
    const input = document.getElementById("list-input");
    const v = input.value.trim();
    if (!v) return;
    const arr = JSON.parse(localStorage.getItem("listItems")||"[]");
    arr.push(v);
    localStorage.setItem("listItems", JSON.stringify(arr));
    input.value = "";
    renderList();
    speak("Item added to list.");
  });

  // 3️⃣ Start wake-word in background
  initWakeWord();
}

//
// 1️⃣ Wake-Word Detection (Porcupine)
//
async function initWakeWord() {
  try {
    const worker = await PorcupineWorkerFactory.create({
      keywordPaths: ["/porcupine/porcupine_aijoe.ppn"],
      modelPath:    "/porcupine/porcupine_params.pv"
    });
    const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
    const ac     = new AudioContext();
    const src    = ac.createMediaStreamSource(stream);
    const proc   = ac.createScriptProcessor(512,1,1);

    src.connect(proc);
    proc.connect(ac.destination);

    proc.onaudioprocess = ({ inputBuffer }) => {
      worker.postMessage({
        command:    "process",
        inputFrame: inputBuffer.getChannelData(0)
      });
    };

    worker.onmessage = msg => {
      if (msg.command === "ppn-keyword") {
        console.log("✅ Wake-word detected!");
        speak("Yes?");
        startVoice();
      }
    };
  } catch (e) {
    console.error("Wake-word init failed:", e);
  }
}

//
// 2️⃣ Text-to-Speech
//
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  const synth  = speechSynthesis;
  const voices = synth.getVoices();
  if (!voices.length) {
    synth.addEventListener("voiceschanged", () => speak(text), { once: true });
    return;
  }
  synth.cancel();
  const u = new SpeechSynthesisUtterance(text);
  u.lang  = "en-US";
  u.voice = voices.find(v=>v.lang==="en-US")||voices[0];
  synth.speak(u);
}

//
// 3️⃣ On-Screen Output
//
function displayAIResponse(txt) {
  let box = document.getElementById("ai-output");
  if (!box) {
    box = document.createElement("div");
    box.id = "ai-output";
    Object.assign(box.style, {
      position: "relative",
      margin:   "1rem auto",
      padding:  "1rem",
      maxWidth: "600px",
      background: "rgba(0,0,0,0.7)",
      color:    "#fff",
      borderRadius: "8px",
      fontSize: "1rem",
      textAlign: "left"
    });
    document.body.appendChild(box);
  }
  box.textContent = txt;
}

//
// 4️⃣ Speech-to-Text
//
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    speak("Speech recognition not supported.");
    return askAI();
  }
  const recog = new SR();
  recog.lang = "en-US";
  recog.interimResults = false;
  recog.maxAlternatives = 1;

  speak("Listening...");
  recog.start();

  recog.onresult = e => {
    recog.stop();
    const spoken = e.results[0][0].transcript;
    displayAIResponse(`You said: "${spoken}"`);
    askAI(spoken);
  };
  recog.onerror = err => {
    console.error("Recognition error:", err);
    displayAIResponse("Recognition error: "+err.error);
    speak("Sorry, I didn’t catch that.");
  };
}

//
// 5️⃣ Ask AI via Netlify
//
async function askAI(query) {
  const q = query||prompt("What do you want to ask Joey?");
  if (!q) return;
  displayAIResponse("Thinking...");
  speak("Joey is thinking...");
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: {"Content-Type":"application/json"},
      body: JSON.stringify({prompt:q})
    });
    const data = await res.json();
    if (data.reply) {
      displayAIResponse("Joey says: "+data.reply);
      setTimeout(()=>speak(data.reply),300);
    } else {
      const err = data.error||"No response.";
      displayAIResponse("Error: "+err);
      speak("Sorry, something went wrong.");
    }
  } catch (e) {
    console.error("askAI error:", e);
    displayAIResponse("Network error: "+e.message);
    speak("Network error occurred.");
  }
}

// …then paste your other helpers exactly as before (fetchBibleVerse, getLocation, fetchWeather, trackMood & renderMood, manageList & renderList, callEmergency, playMusic, tellJoke, fixSomething, findPlace, toggleSection)…

