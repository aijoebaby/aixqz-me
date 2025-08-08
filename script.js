// script.js
// ————————————————————————————————————————————————
// Load this as an ES module in your HTML:
//   <script type="module" src="script.js"></script>
// ————————————————————————————————————————————————

import { PorcupineWorkerFactory } from "@picovoice/porcupine-web-en-worker";

//
// 🚀 ENTRY POINT: on DOM ready, wire up buttons & init wake-word
//
window.addEventListener("DOMContentLoaded", init);

function init() {
  // 1️⃣ Preload TTS voices to avoid empty getVoices()
  if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
  }

  // 2️⃣ Wire up all controls by ID
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
    const arr = JSON.parse(localStorage.getItem("moods") || "[]");
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
    const arr = JSON.parse(localStorage.getItem("listItems") || "[]");
    arr.push(v);
    localStorage.setItem("listItems", JSON.stringify(arr));
    input.value = "";
    renderList();
    speak("Item added to list.");
  });

  // 3️⃣ Start wake-word detection in background
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
    const proc   = ac.createScriptProcessor(512, 1, 1);

    src.connect(proc);
    proc.connect(ac.destination);

    proc.onaudioprocess = ({ inputBuffer }) => {
      worker.postMessage({
        command:    "process",
        inputFrame: inputBuffer.getChannelData(0)
      });
    };

    worker.onmessage = (msg) => {
      if (msg.command === "ppn-keyword") {
        console.log("✅ Wake-word detected!");
        speak("Yes?");
        startVoice();
      }
    };
  } catch (err) {
    console.error("Wake-word init failed:", err);
  }
}

//
// 2️⃣ Text-to-Speech Helper
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
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang  = "en-US";
  utter.voice = voices.find(v => v.lang === "en-US") || voices[0];
  synth.speak(utter);
}

//
// 3️⃣ On-Screen Output Helper
//
function displayAIResponse(txt) {
  let box = document.getElementById("ai-output");
  if (!box) {
    box = document.createElement("div");
    box.id = "ai-output";
    Object.assign(box.style, {
      position:    "relative",
      margin:      "1rem auto",
      padding:     "1rem",
      maxWidth:    "600px",
      background:  "rgba(0,0,0,0.7)",
      color:       "#fff",
      borderRadius:"8px",
      fontSize:    "1rem",
      textAlign:   "left"
    });
    document.body.appendChild(box);
  }
  box.textContent = txt;
}

//
// 4️⃣ Speech-to-Text Recognition
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

  recog.onresult = (e) => {
    recog.stop();
    const spoken = e.results[0][0].transcript;
    displayAIResponse(`You said: "${spoken}"`);
    askAI(spoken);
  };

  recog.onerror = (err) => {
    console.error("Recognition error:", err);
    displayAIResponse("Recognition error: " + err.error);
    speak("Sorry, I didn’t catch that.");
  };
}

//
// 5️⃣ Ask AI via Netlify Function
//
async function askAI(query) {
  const q = query || prompt("What do you want to ask Joey?");
  if (!q) return;
  displayAIResponse("Thinking...");
  speak("Joey is thinking...");
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ prompt: q })
    });
    const data = await res.json();
    if (data.reply) {
      displayAIResponse("Joey says: " + data.reply);
      setTimeout(() => speak(data.reply), 300);
    } else {
      const errMsg = data.error || "No response.";
      displayAIResponse("Error: " + errMsg);
      speak("Sorry, something went wrong.");
    }
  } catch (err) {
    console.error("askAI error:", err);
    displayAIResponse("Network error: " + err.message);
    speak("Network error occurred.");
  }
}

//
// // 6️⃣ Daily Bible Verse
async function fetchBibleVerse() {
  // show loading state
  displayAIResponse("Loading today’s Bible verse…");
  speak("Fetching your daily Bible verse.");

  try {
    const res = await fetch(
      "https://beta.ourmanna.com/api/v1/get/?format=json&order=daily"
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    // unpack the verse
    const {
      verse: {
        details: { text, reference }
      }
    } = json;

    const full = `${reference}\n\n${text}`;
    displayAIResponse(full);
    speak(full);
  } catch (err) {
    console.error("fetchBibleVerse error:", err);
    displayAIResponse("❌ Could not load today’s verse. Try again later.");
    speak("Sorry, I couldn't fetch your Bible verse.");
  }
}
  }
}

//
// 7️⃣ GPS Location
//
function getLocation() {
  displayAIResponse("Getting location...");
  speak("Fetching your location.");
  if (!navigator.geolocation) {
    displayAIResponse("Geolocation not supported.");
    speak("Geolocation not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const msg = `Latitude: ${lat}, Longitude: ${lon}.`;
      displayAIResponse(msg);
      speak(msg);
    },
    (err) => {
      console.error("getLocation error:", err);
      displayAIResponse("Error getting location: " + err.message);
      speak("Unable to get your location.");
    }
  );
}

//
// 8️⃣ Weather
//
async function fetchWeather() {
  displayAIResponse("Fetching weather...");
  speak("Getting the weather now.");
  if (!navigator.geolocation) {
    displayAIResponse("Geolocation not supported.");
    speak("Geolocation not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      try {
        const key = "YOUR_OPENWEATHERMAP_KEY"; // ← replace with your key
        const r = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${key}`
        );
        if (!r.ok) throw new Error(r.status);
        const d = await r.json();
        const msg = `Weather in ${d.name}: ${d.weather[0].description}, ${d.main.temp}°F`;
        displayAIResponse(msg);
        speak(msg);
      } catch (err) {
        console.error("fetchWeather error:", err);
        displayAIResponse("Weather error: " + err.message);
        speak("Sorry, I couldn’t get the weather.");
      }
    },
    (err) => {
      console.error("fetchWeather geolocation error:", err);
      displayAIResponse("Location error: " + err.message);
      speak("Unable to get location for weather.");
    }
  );
}

//
// 9️⃣ Mood Tracker
//
function trackMood() {
  toggleSection("mood-section");
  renderMood();
  speak("Opening mood tracker.");
}
function renderMood() {
  const ul = document.getElementById("mood-list");
  ul.innerHTML = "";
  JSON.parse(localStorage.getItem("moods") || "[]").forEach((o, i) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(o.ts).toLocaleString()}: ${o.m}`;
    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.onclick = () => {
      const arr = JSON.parse(localStorage.getItem("moods") || "[]");
      arr.splice(i, 1);
      localStorage.setItem("moods", JSON.stringify(arr));
      renderMood();
      speak("Removed mood entry.");
    };
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

//
// 🔟 List Manager
//
function manageList() {
  toggleSection("list-section");
  renderList();
  speak("Opening list manager.");
}
function renderList() {
  const ul = document.getElementById("list-items");
  ul.innerHTML = "";
  JSON.parse(localStorage.getItem("listItems") || "[]").forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = item;
    const btn = document.createElement("button");
    btn.textContent = "✕";
    btn.onclick = () => {
      const arr = JSON.parse(localStorage.getItem("listItems") || "[]");
      arr.splice(i, 1);
      localStorage.setItem("list
/* ==== FULL-SCREEN BACKGROUND + OVERLAY (override) ==== */

/* Keep page basics */
body {
  font-family: 'Segoe UI', sans-serif;
  min-height: 100vh;
  margin: 0;
  position: relative;
}

/* Big background photo that fills the screen */
body::before {
  content: "";
  position: fixed;   /* stays put while you scroll */
  inset: 0;
  background: url('joey-bg.png') center/cover no-repeat;  /* ← change filename if needed */
  z-index: 0;        /* behind everything */
}

/* Slight dark overlay so buttons/text are readable */
.overlay {
  position: fixed;
  inset: 0;
  background: rgba(0,0,0,0.45); /* adjust 0.35–0.6 darker/lighter */
  z-index: 1;        /* above the photo, below content */
}

/* Make all your UI sit on top of the overlay */
h1, .controls, .feature-section, #ai-output, .avatar {
  position: relative;
  z-index: 2;
}

/* Buttons layout on top of the image */
.controls {
  position: relative;    /* needed for the translucent card below */
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: 1rem;
  padding: 1rem;
  margin: 1.5rem auto 2.5rem;
  max-width: 900px;
}

/* Optional translucent card behind the buttons for extra contrast */
.controls::before {
  content: "";
  position: absolute;
  inset: -0.5rem;
  background: rgba(0,0,0,0.25);
  border-radius: 16px;
  z-index: -1; /* sits behind the buttons */
}

/* Button styling (feel free to keep your existing ones) */
.controls button {
  background: #4CAF50;
  color: #fff;
  border: none;
  border-radius: 10px;
  padding: 0.8rem 1.2rem;
  font-size: 1rem;
  cursor: pointer;
  box-shadow: 0 2px 8px rgba(0,0,0,0.35);
}

/* If you want to hide the small avatar (optional) */
/* .avatar { display: none; } */
