// script.js — updated to v3.1

// 1️⃣ Preload voices
window.addEventListener("load", () =>
  "speechSynthesis" in window && speechSynthesis.getVoices()
);

// 2️⃣ Speech helper
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  function _speak() {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    const v = speechSynthesis.getVoices();
    u.voice =
      v.find((x) => x.lang === "en-US" && x.name.includes("Google")) ||
      v.find((x) => x.lang.startsWith("en")) ||
      v[0];
    speechSynthesis.speak(u);
  }
  if (!speechSynthesis.getVoices().length) {
    speechSynthesis.addEventListener("voiceschanged", _speak, { once: true });
  } else {
    _speak();
  }
}

// 3️⃣ Display helper
function displayAIResponse(text) {
  let box = document.getElementById("ai-output");
  if (!box) {
    box = document.createElement("div");
    box.id = "ai-output";
    Object.assign(box.style, {
      position: "relative",
      zIndex: 2,
      margin: "1rem auto",
      padding: "1rem",
      maxWidth: "600px",
      background: "rgba(0,0,0,0.7)",
      color: "#fff",
      borderRadius: "8px",
      fontSize: "1rem",
      textAlign: "left",
    });
    document.body.appendChild(box);
  }
  box.textContent = text;
}

// 4️⃣ Talk to AIJoe — uses voice recognition if available
function startVoice() {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    return askAI(); // text fallback
  }
  const recognition = new SpeechRecognition();
  recognition.lang = "en-US";
  speak("Listening...");
  recognition.start();
  recognition.onresult = (e) => {
    recognition.stop();
    const transcript = e.results[0][0].transcript;
    displayAIResponse(`You said: "${transcript}"`);
    askAI(transcript);
  };
  recognition.onerror = () => {
    displayAIResponse("Speech recognition error.");
    speak("Sorry, I didn’t catch that.");
  };
}

// 5️⃣ Ask AI (accepts optional spoken query)
async function askAI(query) {
  const q = query || prompt("What do you want to ask Joey?");
  if (!q) return;
  speak("Joey is thinking...");
  displayAIResponse("Thinking...");
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: q }),
    });
    const data = await res.json();
    if (data.reply) {
      displayAIResponse("Joey says: " + data.reply);
      setTimeout(() => speak(data.reply), 300);
    } else {
      displayAIResponse("Error: " + (data.error || "No response"));
      speak("I ran into an error.");
    }
  } catch (err) {
    displayAIResponse("Network error: " + err.message);
    speak("Network error occurred.");
  }
}

// 6️⃣ Daily Bible Verse
async function fetchBibleVerse() {
  displayAIResponse("Loading today’s Bible verse…");
  speak("Fetching your daily Bible verse.");
  try {
    const res = await fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily");
    if (!res.ok) throw new Error("API status " + res.status);
    const { verse: { details: { text, reference } } } = await res.json();
    const full = `${reference.trim()}\n\n${text.trim()}`;
    displayAIResponse(full);
    speak(full);
  } catch {
    try {
      const fb = await fetch("https://bible-api.com/John%203:16?translation=kjv");
      const data = await fb.json();
      const fallback = `[Fallback] ${data.reference}\n\n${data.text.trim()}`;
      displayAIResponse(fallback);
      speak(fallback);
    } catch {
      const msg = "Sorry, could not load a verse right now.";
      displayAIResponse(msg);
      speak(msg);
    }
  }
}

// 7️⃣ Weather
function fetchWeather() {
  if (!navigator.geolocation) {
    const msg = "Geolocation not supported.";
    displayAIResponse(msg);
    speak(msg);
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude;
      const lon = pos.coords.longitude;
      displayAIResponse("Fetching weather...");
      speak("Getting the weather now.");
      try {
        const key = "YOUR_OPENWEATHERMAP_KEY";
        const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${key}`);
        if (!r.ok) throw new Error(r.status);
        const d = await r.json();
        const weatherMsg = `Weather in ${d.name}: ${d.weather[0].description}, ${d.main.temp}°F`;
        displayAIResponse(weatherMsg);
        speak(weatherMsg);
      } catch (e) {
        displayAIResponse("Weather error: " + e.message);
        speak("Sorry, I couldn't get the weather.");
      }
    },
    (e) => {
      displayAIResponse("Location error: " + e.message);
      speak("Sorry, I couldn't get your location for weather.");
    }
  );
}

// 8️⃣ Mood Tracker
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
    const btn = document.createElement("button");
    btn.textContent = "✕";
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
document.getElementById("mood-submit").onclick = () => {
  const inpt = document.getElementById("mood-input");
  const m = inpt.value.trim();
  if (!m) return;
  const arr = JSON.parse(localStorage.getItem("moods") || "[]");
  arr.push({ m, ts: Date.now() });
  localStorage.setItem("moods", JSON.stringify(arr));
  inpt.value = "";
  renderMood();
  speak("Mood saved.");
};

// 9️⃣ List Manager
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
    const btn = document.createElement("button");
    btn.textContent = "✕";
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
document.getElementById("list-add").onclick = () => {
  const inpt = document.getElementById("list-input");
  const v = inpt.value.trim();
  if (!v) return;
  const arr = JSON.parse(localStorage.getItem("listItems") || "[]");
  arr.push(v);
  localStorage.setItem("listItems", JSON.stringify(arr));
  inpt.value = "";
  renderList();
  speak("Item added to list.");
};

// 🔟 Emergency Help
function callEmergency() {
  const msg = "Calling emergency services. Please stay calm.";
  displayAIResponse(msg);
  speak(msg);
}

// 1️⃣1️⃣ Find Nearby Place
function findPlace() {
  const msg = "Searching for nearby places.";
  displayAIResponse(msg);
  speak(msg);
  // real implementation can be added later
}

// 1️⃣2️⃣ Help Me Fix Something
function fixSomething() {
  const msg = "Help is on the way. What do you need?";
  displayAIResponse(msg);
  speak(msg);
}

// ✅ Section toggle helper
function toggleSection(id) {
  ["mood-section", "list-section"].forEach((sec) => {
    document.getElementById(sec).classList.toggle("visible", sec === id);
  });
}
