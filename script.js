// script.js — revised v3.1

// 1️⃣ Preload voices
window.addEventListener("load", () =>
  "speechSynthesis" in window && speechSynthesis.getVoices()
);

// 2️⃣ speak helper
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();
  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  const voices = speechSynthesis.getVoices();
  utter.voice =
    voices.find((v) => v.lang === "en-US" && v.name.includes("Google")) ||
    voices.find((v) => v.lang.startsWith("en")) ||
    voices[0];
  speechSynthesis.speak(utter);
}

// 3️⃣ display helper
function displayAIResponse(txt) {
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
  box.textContent = txt;
}

// 4️⃣ startVoice with real recognition
function startVoice() {
  const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SR) {
    speak("Speech recognition not supported. Please type your question.");
    return askAI();
  }
  const recog = new SR();
  recog.lang = "en-US";
  speak("Listening...");
  recog.start();

  recog.onresult = (e) => {
    recog.stop();
    const spoken = e.results[0][0].transcript;
    displayAIResponse(`You said: "${spoken}"`);
    askAI(spoken);
  };
  recog.onerror = (err) => {
    displayAIResponse("Recognition error: " + err.error);
    speak("Sorry, I didn't catch that.");
  };
}

// 5️⃣ askAI (with optional query)
async function askAI(query) {
  let q = query;
  if (!q) {
    q = prompt("What do you want to ask Joey?");
    if (!q) return;
  }
  displayAIResponse("Thinking...");
  speak("Joey is thinking...");
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
      speak("Sorry, something went wrong.");
    }
  } catch (e) {
    displayAIResponse("Network error: " + e.message);
    speak("Network error occurred.");
  }
}

// 6️⃣ Daily Bible Verse
async function fetchBibleVerse() {
  displayAIResponse("Loading today’s Bible verse…");
  speak("Fetching your daily Bible verse.");
  try {
    const r = await fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily");
    if (!r.ok) throw new Error(r.status);
    const { verse: { details: { text, reference } } } = await r.json();
    const full = `${reference}\n\n${text}`;
    displayAIResponse(full);
    speak(full);
  } catch {
    displayAIResponse("Could not load a verse right now.");
    speak("Sorry, I couldn't load the verse.");
  }
}

// 7️⃣ GPS
function getLocation() {
  if (!navigator.geolocation) {
    displayAIResponse("Geolocation not supported.");
    speak("Geolocation not supported.");
    return;
  }
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude: lat, longitude: lon } = pos.coords;
      const msg = `Your location is Latitude: ${lat}, Longitude: ${lon}.`;
      displayAIResponse(msg);
      speak(msg);
    },
    (err) => {
      displayAIResponse("Error getting location: " + err.message);
      speak("Unable to get your location.");
    }
  );
}

// 8️⃣ Weather
async function fetchWeather() {
  displayAIResponse("Fetching weather…");
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
        const key = "YOUR_OPENWEATHERMAP_KEY"; // ← add your key
        const r = await fetch(
          `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&units=imperial&appid=${key}`
        );
        if (!r.ok) throw new Error(r.status);
        const d = await r.json();
        const msg = `Weather in ${d.name}: ${d.weather[0].description}, ${d.main.temp}°F`;
        displayAIResponse(msg);
        speak(msg);
      } catch (e) {
        displayAIResponse("Weather error: " + e.message);
        speak("Sorry, I couldn't get the weather.");
      }
    },
    (err) => {
      displayAIResponse("Location error: " + err.message);
      speak("Unable to get location for weather.");
    }
  );
}

// 9️⃣ Mood Tracker
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

// 🔟 List Manager
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

// 1️⃣1️⃣ Emergency Help
function callEmergency() {
  const msg = "Calling emergency services. Please stay calm.";
  displayAIResponse(msg);
  speak(msg);
}

// 1️⃣2️⃣ Music
function playMusic() {
  window.open("https://www.youtube.com/results?search_query=lofi+hip+hop", "_blank");
  speak("Playing music for you.");
}

// 1️⃣3️⃣ Joke
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

// 1️⃣4️⃣ Help Me Fix Something
function fixSomething() {
  const msg = "Help is on the way. What do you need?";
  displayAIResponse(msg);
  speak(msg);
}

// 1️⃣5️⃣ Find Nearby Place
function findPlace() {
  const msg = "Searching for nearby places…";
  displayAIResponse(msg);
  speak(msg);
}

// ✅ Section toggle helper
function toggleSection(id) {
  ["mood-section", "list-section"].forEach((sec) => {
    document.getElementById(sec).classList.toggle("visible", sec === id);
  });
}
// === FORCE the correct AIJOE endpoint everywhere ===
const AIJOE_ENDPOINT = "https://aixqz.life/.netlify/functions/askAI";

// Monkey-patch fetch to redirect any calls to /.netlify/functions/askAI
(function () {
  const originalFetch = window.fetch.bind(window);
  window.fetch = (input, init) => {
    try {
      let url = typeof input === "string" ? input : input.url;
      // If code uses a relative path or an old host, normalize it:
      if (url.includes("/.netlify/functions/askAI")) {
        url = AIJOE_ENDPOINT;
        if (typeof input !== "string") {
          // Rebuild the Request with the corrected URL
          input = new Request(url, input);
        } else {
          input = url;
        }
      }
      return originalFetch(input, init);
    } catch (e) {
      return originalFetch(input, init);
    }
  };
})();

// Optional: a helper you can call directly from your UI
async function askAI(userText) {
  const res = await fetch(AIJOE_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ text: userText }),
  });
  if (!res.ok) throw new Error("Bad response " + res.status);
  const data = await res.json();
  return data.reply || "(no reply)";
}

// Optional: quick health check on load (see console)
fetch(AIJOE_ENDPOINT, { method: "GET" })
  .then(r => r.json())
  .then(j => console.log("AIJOE health:", j))
  .catch(e => console.warn("AIJOE not reachable:", e));
