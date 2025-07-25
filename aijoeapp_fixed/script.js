// AIJOE Voice — script.js v3.0
window.addEventListener("load", () => {
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
});
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  function _speak() {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    const v = speechSynthesis.getVoices();
    u.voice = v.find(x => x.lang==="en-US" && x.name.includes("Google")) || v.find(x => x.lang.startsWith("en")) || v[0];
    speechSynthesis.speak(u);
  }
  if (!speechSynthesis.getVoices().length) {
    speechSynthesis.addEventListener("voiceschanged", _speak, { once: true });
  } else { _speak(); }
}
function displayAIResponse(text) {
  let box = document.getElementById("ai-output");
  if (!box) {
    box = document.createElement("div");
    box.id = "ai-output";
    Object.assign(box.style, {
      position: "relative", zIndex: 2, margin: "1rem auto",
      padding: "1rem", maxWidth: "600px",
      background: "rgba(0,0,0,0.7)", color: "#fff",
      borderRadius: "8px", fontSize: "1rem", textAlign: "left",
    });
    document.body.appendChild(box);
  }
  box.textContent = text;
}
async function askAI() {
  console.log("askAI() fired");
  const q = prompt("What do you want to ask Joey?");
  if (!q) return;
  speak("Joey is thinking...");
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: q }),
    });
    if (!res.ok) throw new Error(`Status ${res.status}`);
    const data = await res.json();
    if (data.reply) {
      setTimeout(() => speak(data.reply), 300);
      displayAIResponse("Joey says: " + data.reply);
    } else {
      displayAIResponse("Error: " + (data.error || "No response"));
    }
  } catch (err) {
    displayAIResponse("Network error: " + err.message);
  }
}
function startVoice() {
  console.log("startVoice→askAI");
  askAI();
}
async function fetchBibleVerse() {
  try {
    const r = await fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily");
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const t = j.verse.details.text.trim(), ref = j.verse.details.reference;
    displayAIResponse(ref + "\n\n" + t);
  } catch {
    try {
      const fb = await fetch("https://bible-api.com/John%203:16?translation=kjv");
      const d = await fb.json();
      displayAIResponse("[Fallback] " + d.reference + "\n\n" + d.text.trim());
    } catch {
      displayAIResponse("Couldn’t load verse.");
    }
  }
}
function fetchWeather() {
  if (!navigator.geolocation) { displayAIResponse("Geolocation not supported."); return; }
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    const key = "YOUR_OPENWEATHERMAP_KEY"; 
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
  }, e => displayAIResponse("Location error: " + e.message));
}
function trackMood() { toggleSection("mood-section"); renderMood(); }
function renderMood() {
  const ul = document.getElementById("mood-list"); ul.innerHTML = "";
  const arr = JSON.parse(localStorage.getItem("moods") || "[]");
  arr.forEach((o,i) => {
    const li = document.createElement("li"); li.textContent = `${new Date(o.ts).toLocaleString()}: ${o.m}`;
    const btn = document.createElement("button"); btn.textContent = "✕";
    btn.onclick = () => { arr.splice(i,1); localStorage.setItem("moods",JSON.stringify(arr)); renderMood(); };
    li.appendChild(btn); ul.appendChild(li);
  });
}
document.getElementById("mood-submit").onclick = () => {
  const inpt = document.getElementById("mood-input"); const m = inpt.value.trim(); if (!m) return;
  const arr = JSON.parse(localStorage.getItem("moods")||"[]"); arr.push({m,ts:Date.now()});
  localStorage.setItem("moods", JSON.stringify(arr)); inpt.value = ""; renderMood();
};
function manageList() { toggleSection("list-section"); renderList(); }
function renderList() {
  const ul = document.getElementById("list-items"); ul.innerHTML = "";
  const arr = JSON.parse(localStorage.getItem("listItems")||"[]");
  arr.forEach((item,i) => {
    const li = document.createElement("li"); li.textContent = item;
    const btn = document.createElement("button"); btn.textContent = "✕";
    btn.onclick = () => { arr.splice(i,1); localStorage.setItem("listItems",JSON.stringify(arr)); renderList(); };
    li.appendChild(btn); ul.appendChild(li);
  });
}
document.getElementById("list-add").onclick = () => {
  const inpt = document.getElementById("list-input"); const v = inpt.value.trim(); if(!v) return;
  const arr = JSON.parse(localStorage.getItem("listItems")||"[]"); arr.push(v);
  localStorage.setItem("listItems", JSON.stringify(arr)); inpt.value = ""; renderList();
};
function toggleSection(id) {
  ["mood-section","list-section"].forEach(sec => {
    document.getElementById(sec).classList.toggle("visible", sec===id);
  });
}
function getLocation()     { displayAIResponse("Please use the GPS button."); }
function callEmergency()   { displayAIResponse("911 simulated."); }
function playMusic()       { window.open("https://www.youtube.com/results?search_query=lofi+hip+hop"); }
function tellJoke()        { displayAIResponse("Why did the AI cross the road? To optimize the chicken!"); }
function fixSomething()    { displayAIResponse("Help coming soon."); }
function findPlace()       { displayAIResponse("Nearby places soon."); }