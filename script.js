function speak(text)
/ script.js
// ——————————————————————————————————————————————————————————
// Load this as an ES module in your HTML head or body:
//   <script type="module" src="script.js"></script>
// ——————————————————————————————————————————————————————————

import { PorcupineWorkerFactory } from "@picovoice/porcupine-web-en-worker";

//
// 🚀 ENTRY POINT: On DOM ready, wire up buttons & start wake‐word
//
window.addEventListener("DOMContentLoaded", init);

function init() {
  // 1) Preload speech voices (avoids empty getVoices())
  if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
  }

  // 2) Wire up all your buttons by ID
  const wire = [
    ["voice-btn",         () => { speak("Listening..."); startVoice(); }],
    ["ask-btn",           () => { speak("What would you like to ask?"); askAI(); }],
    ["bible-btn",         fetchBibleVerse],
    ["gps-btn",           getLocation],
    ["weather-btn",       fetchWeather],
    ["joke-btn",          tellJoke],
    ["fix-btn",           fixSomething],
    ["find-btn",          findPlace],
    ["music-btn",         playMusic],
    ["mood-tracker-btn",  trackMood],
    ["list-manager-btn",  manageList],
    ["emergency-btn",     callEmergency]
  ];
  wire.forEach(([id, fn]) => {
    document.getElementById(id)?.addEventListener("click", fn);
  });

  // 3) Mood‐tracker submit
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

  // 4) List‐manager add
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

  // 5) Start wake-word detection in background
  initWakeWord();
}

//
// 1️⃣ Wake-Word Detection with Porcupine
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
  } catch (e) {
    console.error("Wake-word init failed:", e);
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
    // wait for voices to load, then retry
    synth.addEventListener("voiceschanged", () => speak(text), { once: true });
    return;
  }
  synth.cancel();
  const utt = new SpeechSynthesisUtterance(text);
  utt.lang  = "en-US";
  utt.voice = voices.find(v => v.lang === "en-US") || voices[0];
  synth.speak(utt);
}

//
// 3️⃣ On-Screen Text Output
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
// 4️⃣ Voice Recognition
//
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    speak("Speech recognition not supported.");
    return askAI();
  }
  const recog = new SR();
  recog.lang = "en-US";
  recog.interimResults  = false;
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
// 5️⃣ Ask AI (Netlify Function)
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
// 6️⃣ Daily Bible Verse
//
async function fetchBibleVerse() {
  displayAIResponse("Loading today’s Bible verse...");
  speak("Fetching your daily Bible verse.");
  try {
    const res = await fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily");
    if (!res.ok) throw new Error(res.status);
    const { verse: { details: { text, reference } } } = await res.json();
    const full = `${reference}\n\n${text}`;
    displayAIResponse(full);
    speak(full);
  } catch (e) {
    console.error("fetchBibleVerse error:", e);
    displayAIResponse("Could not load a verse right now.");
    speak("Sorry, I couldn’t load the verse.");
  }
}

//
// 7️⃣ GPS
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
      } catch (e) {
        console.error("fetchWeather error:", e);
        displayAIResponse("Weather error: " + e.message);
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
  const arr = JSON.parse(localStorage.getItem("moods") || "[]");
  arr.forEach((o, i) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(o.ts).toLocaleString()}: ${o.m}`;
    const btn = document.createElement("button"); btn.textContent = "✕";
    btn.onclick = () => {
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
  const arr = JSON.parse(localStorage.getItem("listItems") || "[]");
  arr.forEach((item, i) => {
    const li = document.createElement("li");
    li.textContent = item;
    const btn = document.createElement("button"); btn.textContent = "✕";
    btn.onclick = () => {
      arr.splice(i, 1);
      localStorage.setItem("listItems", JSON.stringify(arr));
      renderList();
      speak("Removed item.");
    };
    li.appendChild(btn);
    ul.appendChild(li);
  });
}

//
// 1️⃣1️⃣ Emergency Help
//
function callEmergency() {
  const msg = "Calling emergency services. Please stay calm.";
  displayAIResponse(msg);
  speak(msg);
  window.location.href = "tel:911";
}

//
// 1️⃣2️⃣ Music
//
function playMusic() {
  window.open("https://www.youtube.com/results?search_query=lofi+hip+hop", "_blank");
  speak("Playing music for you.");
}

//
// 1️⃣3️⃣ Joke
//
async function tellJoke() {
  const today = new Date().toISOString().split("T")[0];
  let joke = localStorage.getItem("jokeText");
  const stored = localStorage.getItem("jokeDate");
  if (stored !== today || !joke) {
    try {
      const r = await fetch("https://official-joke-api.appspot.com/random_joke");
      const d = await r.json();
      joke = `${d.setup} … ${d.punchline}`;
    } catch {
      joke = "Why did the AI cross the road? To optimize the chicken!";
    }
    localStorage.setItem("jokeDate", today);
    localStorage.setItem("jokeText", joke);
  }
  displayAIResponse(joke);
  speak(joke);
}

//
// 1️⃣4️⃣ Help Me Fix Something
//
function fixSomething() {
  const msg = "Help is on the way. What do you need?";
  displayAIResponse(msg);
  speak(msg);
}

//
// 1️⃣5️⃣ Find Nearby Place
//
function findPlace() {
  const msg = "Searching for nearby places…";
  displayAIResponse(msg);
  speak(msg);
}

//
// 🔀 Section Toggle Helper
//
function toggleSection(id) {
  ["mood-section","list-section"].forEach(sec => {
    document.getElementById(sec)?.classList.toggle("visible", sec === id);
  });
}
