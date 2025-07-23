// ===============================
// AIJOE VOICE — script.js  v2.1
// ===============================

// ——— Preload voices on page load ———
window.addEventListener("load", () => {
 async function askAI() {
  const userText = document.getElementById('askai-input').value;
  setStatus("Joey is thinking...");
  try {
    const res = await fetch('/.netlify/functions/askAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userText })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Request failed');
    setStatus(""); // clear status
    showAnswer(data.reply);
    speakText(data.reply); // text-to-speech function
  } catch (err) {
    setStatus("Error: " + err.message);
  }
}
async function askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;

  // Prime the engine so it's unlocked for later
  speak("Joey is thinking...");

  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText }),
    });
    const data = await res.json();

    if (data.reply) {
      // Speak the actual reply immediately
      speak(data.reply);

      // Show the text after a short delay
      setTimeout(() => {
        alert("Joey says:\n\n" + data.reply);
      }, 200);
    } else {
      alert("Joey had trouble: " + (data.error || "No response"));
    }
  } catch (err) {
    alert("Network error talking to Joey:\n" + err);
  }
}

// ——— Daily Bible Verse ———
async function fetchBibleVerse() {
  try {
    const r = await fetch(
      "https://beta.ourmanna.com/api/v1/get/?format=json&order=daily"
    );
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const t = j.verse.details.text.trim(),
      ref = j.verse.details.reference;
    alert(ref + "\n\n" + t);
  } catch {
    try {
      const fb = await fetch("https://bible-api.com/John%203:16?translation=kjv");
      const d = await fb.json();
      alert("[Fallback] " + d.reference + "\n\n" + d.text.trim());
    } catch {
      alert("Sorry, couldn't load a verse right now.");
    }
  }
}

// ——— Real Weather Data ———
function fetchWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    async (pos) => {
      const lat = pos.coords.latitude,
        lon = pos.coords.longitude;
      const key = "YOUR_OPENWEATHERMAP_KEY"; // ← replace this!
      try {
        const r = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${key}`
        );
        if (!r.ok) throw new Error(r.status);
        const d = await r.json();
        alert(
          `Weather in ${d.name}: ${d.weather[0].description}, ${d.main.temp}°F`
        );
      } catch (e) {
        alert("Weather error: " + e.message);
      }
    },
    (e) => alert("Location error: " + e.message)
  );
}

// ——— Mood Tracker UI ———
function trackMood() {
  toggleSection("mood-section");
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

// ——— List Manager UI ———
function manageList() {
  toggleSection("list-section");
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

// ——— Section toggling helper ———
function toggleSection(id) {
  ["mood-section", "list-section"].forEach((sec) => {
    document.getElementById(sec).classList.toggle("visible", sec === id);
  });
}

// ——— Other Buttons ———
function startVoice() { alert("Voice coming soon!"); }
function getLocation() { alert("Please use the GPS button above."); }
function callEmergency() { alert("911 simulated dial."); }
function playMusic() { window.open("https://www.youtube.com/results?search_query=lofi+hip+hop"); }
function tellJoke() { alert("Why did the AI cross the road? To optimize the chicken!"); }
function fixSomething() { alert("Help coming soon."); }
function findPlace() { alert("Nearby places soon."); }
