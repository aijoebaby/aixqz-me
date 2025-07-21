/* ===============================
   AIJOE VOICE — script.js  v2.0
   =============================== */

// ——— Speech helper — priming & speaking reliably
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  function _speak() {
    const u = new SpeechSynthesisUtterance(text);
    u.lang = "en-US";
    const v = speechSynthesis.getVoices();
    u.voice = v.find(x => x.lang==="en-US"&&x.name.includes("Google"))
           || v.find(x => x.lang.startsWith("en")) || v[0];
    speechSynthesis.speak(u);
  }
  if (!speechSynthesis.getVoices().length) {
    speechSynthesis.addEventListener("voiceschanged", _speak, { once: true });
  } else _speak();
}

// ——— Ask AI (Joey)
async function askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;

  speak("Joey is thinking...");
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method:"POST",
      headers:{ "Content-Type":"application/json" },
      body: JSON.stringify({ prompt: promptText })
    });
    const data = await res.json();
    setTimeout(() => {
      if (data.reply) {
        speak(data.reply);
        alert("Joey says:\n\n" + data.reply);
      } else {
        alert("Error: " + (data.error||"No response"));
      }
    }, 400);
  } catch(e) {
    alert("Network error talking to Joey:\n"+e);
  }
}

// ——— Daily Bible Verse
async function fetchBibleVerse() {
  try {
    const r = await fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily");
    if (!r.ok) throw new Error(r.status);
    const j = await r.json();
    const t = j.verse.details.text.trim(), ref = j.verse.details.reference;
    alert(ref + "\n\n" + t);
  } catch {
    try {
      const fb = await fetch("https://bible-api.com/John%203:16?translation=kjv");
      const d = await fb.json();
      alert("[Fallback] "+ d.reference + "\n\n"+ d.text.trim());
    } catch {
      alert("Could not load verse.");
    }
  }
}

// ——— Real Weather Data
function fetchWeather() {
  if (!navigator.geolocation) {
    alert("Geolocation not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition(async pos => {
    const lat = pos.coords.latitude, lon = pos.coords.longitude;
    // ← REPLACE with your OpenWeatherMap key
    const key = "YOUR_OPENWEATHERMAP_KEY";
    try {
      const r = await fetch(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${key}`);
      if (!r.ok) throw new Error(r.status);
      const d = await r.json();
      alert(`Weather in ${d.name}: ${d.weather[0].description}, ${d.main.temp}°F`);
    } catch(e) {
      alert("Weather error: "+e.message);
    }
  }, e => alert("Location error: "+e.message));
}

// ——— Mood Tracker UI
function trackMood() {
  toggleSection("mood-section");
}
function renderMood() {
  const ul = document.getElementById("mood-list");
  ul.innerHTML = "";
  const arr = JSON.parse(localStorage.getItem("moods")||"[]");
  arr.forEach((o,i) => {
    const li = document.createElement("li");
    li.textContent = `${new Date(o.ts).toLocaleString()}: ${o.m}`;
    const btn= document.createElement("button");
    btn.textContent="✕";
    btn.onclick =()=>{ arr.splice(i,1); localStorage.setItem("moods",JSON.stringify(arr)); renderMood();};
    li.appendChild(btn);
    ul.appendChild(li);
  });
}
document.getElementById("mood-submit").onclick = () => {
  const inpt = document.getElementById("mood-input");
  const m = inpt.value.trim(); if(!m) return;
  const arr= JSON.parse(localStorage.getItem("moods")||"[]");
  arr.push({m,ts:Date.now()});
  localStorage.setItem("moods",JSON.stringify(arr));
  inpt.value=""; renderMood();
};

// ——— List Manager UI
function manageList() {
  toggleSection("list-section");
}
function renderList() {
  const ul = document.getElementById("list-items");
  ul.innerHTML = "";
  const arr= JSON.parse(localStorage.getItem("listItems")||"[]");
  arr.forEach((item,i) => {
    const li = document.createElement("li");
    li.textContent = item;
    const btn= document.createElement("button");
    btn.textContent="✕";
    btn.onclick =()=>{ arr.splice(i,1); localStorage.setItem("listItems",JSON.stringify(arr)); renderList();};
    li.appendChild(btn);
    ul.appendChild(li);
  });
}
document.getElementById("list-add").onclick = () => {
  const inpt = document.getElementById("list-input");
  const v = inpt.value.trim(); if(!v) return;
  const arr= JSON.parse(localStorage.getItem("listItems")||"[]");
  arr.push(v);
  localStorage.setItem("listItems",JSON.stringify(arr));
  inpt.value=""; renderList();
};

// ——— Section toggling helper
function toggleSection(id) {
  ["mood-section","list-section"].forEach(sec=>{
    document.getElementById(sec).classList.toggle("visible", sec===id);
  });
}

// ——— Other buttons
function startVoice()      { alert("Voice coming soon!"); }
function getLocation()     { alert("Please use the GPS button above."); }
function callEmergency()   { alert("911 simulated dial."); }
function playMusic()       { window.open("https://www.youtube.com/results?search_query=lofi+hip+hop"); }
function tellJoke()        { alert("Why did the AI cross the road? To optimize the chicken!"); }
function fixSomething()    { alert("Help coming soon."); }
function findPlace()       { alert("Nearby places soon."); }
