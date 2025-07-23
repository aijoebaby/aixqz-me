// ===============================
// AIJOE VOICE — script.js v2.3
// ===============================

// 1️⃣ Preload voices on page load
window.addEventListener("load", () => {
  if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
  }
});

// 2️⃣ Speech helper
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel(); // clear any queued speech
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
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener("voiceschanged", _speak, { once: true });
  } else {
    _speak();
  }
}

// 3️⃣ Utility to show AI response in-page
function displayAIResponse(text) {
  let c = document.getElementById("ai-output");
  if (!c) {
    c = document.createElement("div");
    c.id = "ai-output";
    c.style.cssText =
      "position:relative;z-index:2;margin:1rem auto;padding:1rem;max-width:600px;background:rgba(0,0,0,0.7);color:#fff;border-radius:8px;font-size:1rem;";
    document.body.appendChild(c);
  }
  c.textContent = text;
}

// 4️⃣ Ask AI (Joey)
async function askAI() {
  const q = prompt("What do you want to ask Joey?");
  if (!q) return;

  // Prime voice so it's unlocked after async
  speak("Joey is thinking...");
  
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: q }),
    });
    const data = await res.json();

    if (data.reply) {
      // speak the actual reply
      setTimeout(() => speak(data.reply), 300);
      displayAIResponse("Joey says: " + data.reply);
    } else {
      displayAIResponse("Error: " + (data.error || "No response"));
    }
  } catch (err) {
    displayAIResponse("Network error: " + err);
  }
}

// 5️⃣ Daily Bible Verse
async function fetchBibleVerse() {
  try {
    const r = await fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily");
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const text = j.verse.details.text.trim(),
      ref = j.verse.details.reference;
    displayAIResponse(ref + "\n\n" + text);
  } catch {
    // fallback to John 3:16
    try {
      const fb = await fetch("https://bible-api.com/John%203:16?translation=kjv");
      const d = await fb.json();
      displayAIResponse("[Fallback] " + d.reference + "\n\n" + d.text.trim());
    } catch {
      displayAIResponse("Sorry, couldn't load a verse right now.");
    }
  }
}

// 6️⃣ Real Weather Data (needs your OpenWeatherMap key)
function fetchWeather() {
  if (!navigator.geolocation) {
    displayAIResponse("Geolocation not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude,
        lon = pos.coords.longitude;
      const key = "YOUR_OPENWEATHERMAP_KEY"; // ← replace
      try {
        const r = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${key}`
        );
        if (!r.ok) throw new Error(r.status);
        const d = await r.json();
        displayAIResponse(
          `Weather in ${d.name}: ${d.weather[0].description}, ${d.main.temp}°F`
        );
      } catch (e) {
        displayAIResponse("Weather error: " + e.message);
      }
    },
    (e) => displayAIResponse("Location error: " + e.message)
  );
}

// 7️⃣ Mood Tracker UI
function trackMood() {
  toggleSection("mood-section");
  renderMood();
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
};

// 8️⃣ List Manager UI
function manageList() {
  toggleSection("list-section");
  renderList();
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
};

// 9️⃣ Section toggling helper
function toggleSection(id) {
  ["mood-section", "list-section"].forEach((sec) => {
    document.getElementById(sec).classList.toggle("visible", sec === id);
  });
}

// 🔟 Other placeholders
function startVoice() { displayAIResponse("Voice coming soon!"); }
function getLocation() { displayAIResponse("Please use the GPS button."); }
function callEmergency() { displayAIResponse("911 simulated dial."); }
function playMusic() { window.open("https://www.youtube.com/results?search_query=lofi+hip+hop"); }
function tellJoke() { displayAIResponse("Why did the AI cross the road? To optimize the chicken!"); }
function fixSomething() { displayAIResponse("Help coming soon."); }
function findPlace() { displayAIResponse("Nearby places soon."); }
