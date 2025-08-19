/*************************************************
 * HARD KILL of any old backend/health-check code
 *************************************************/
try { window.AIJOE_ENDPOINT = null; } catch {}
window.addEventListener("unhandledrejection", (e) => {
  // prevents old promises (health checks) from breaking the page
  console.warn("Silenced background error:", e.reason);
});

/*************************************************
 * SPEECH (robust, “butler-proof”)
 *************************************************/
function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(String(text || "").trim() || " ");
  u.lang = "en-US"; u.rate = 1; u.pitch = 1; u.volume = 1;

  const pick = () => {
    const v = speechSynthesis.getVoices();
    if (!v.length) return null;
    return v.find(x => x.lang === "en-US" && x.name.includes("Google")) ||
           v.find(x => x.lang === "en-US") ||
           v.find(x => x.lang.startsWith("en")) ||
           v[0];
  };
  const go = () => { const v = pick(); if (v) u.voice = v; speechSynthesis.speak(u); };

  if (!speechSynthesis.getVoices().length) {
    speechSynthesis.addEventListener("voiceschanged", go, { once: true });
  } else {
    go();
  }
}

// Prime audio once (mobile autoplay rules)
document.addEventListener("click", function primeOnce() {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0; speechSynthesis.speak(u);
  }
  document.removeEventListener("click", primeOnce);
}, { once: true });

/*************************************************
 * UI helpers
 *************************************************/
const $ = (id) => document.getElementById(id);
const out = $("output");
const micStatus = $("micStatus");
const wakeStatus = $("wakeStatus");
const lastHeard = $("lastHeard");

function show(text, alsoSpeak = true) {
  out.textContent = text;
  if (alsoSpeak) speak(text);
}

function withTimeout(promise, ms = 8000) {
  return Promise.race([
    promise,
    new Promise((_, rej) => setTimeout(() => rej(new Error("timeout")), ms)),
  ]);
}

/*************************************************
 * 📖 Bible Verse (no key, with fallback)
 *************************************************/
const LOCAL_VERSES = [
  "Psalm 23:1 — The Lord is my shepherd; I shall not want.",
  "Philippians 4:13 — I can do all things through Christ who strengthens me.",
  "Proverbs 3:5 — Trust in the Lord with all your heart and lean not on your own understanding.",
  "Isaiah 41:10 — Fear not, for I am with you; be not dismayed, for I am your God.",
  "John 3:16 — For God so loved the world that He gave His only Son…",
];

async function getBibleVerse() {
  const url = "https://beta.ourmanna.com/api/v1/get/?format=json";
  try {
    const res = await withTimeout(fetch(url, { cache: "no-store" }), 7000);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    const text = j?.verse?.details?.text;
    const ref  = j?.verse?.details?.reference;
    if (text) return ref ? `${text} — ${ref}` : text;
    throw new Error("bad shape");
  } catch {
    return LOCAL_VERSES[Math.floor(Math.random() * LOCAL_VERSES.length)];
  }
}

/*************************************************
 * 😂 Joke (no key, with fallback)
 *************************************************/
const LOCAL_JOKES = [
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "I tried to catch fog yesterday. Mist.",
  "What do you call cheese that isn’t yours? Nacho cheese!",
  "I told my computer I needed a break, and it said, “No problem—I’ll go to sleep.”",
  "I asked my dog what’s two minus two. He said nothing.",
];

async function getJoke() {
  const url = "https://official-joke-api.appspot.com/jokes/random";
  try {
    const res = await withTimeout(fetch(url, { cache: "no-store" }), 7000);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    const t = [j?.setup, j?.punchline].filter(Boolean).join(" … ");
    if (t) return t;
    throw new Error("bad data");
  } catch {
    return LOCAL_JOKES[Math.floor(Math.random() * LOCAL_JOKES.length)];
  }
}

/*************************************************
 * ☀️ Weather (Open-Meteo, no key)
 *************************************************/
const WCODE = {
  0:"clear sky",1:"mainly clear",2:"partly cloudy",3:"overcast",45:"fog",48:"rime fog",
  51:"light drizzle",53:"moderate drizzle",55:"dense drizzle",
  61:"light rain",63:"moderate rain",65:"heavy rain",
  71:"light snow",73:"moderate snow",75:"heavy snow",
  80:"rain showers",81:"rain showers",82:"violent rain showers",95:"thunderstorm",96:"thunderstorm with hail",99:"thunderstorm with heavy hail"
};
const cToF = (c) => Math.round(c * 9/5 + 32);

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await withTimeout(fetch(url, { cache: "no-store" }), 7000);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const d = await res.json();
  const cw = d?.current_weather;
  if (!cw) throw new Error("no current_weather");
  const desc = WCODE[cw.weathercode] || "current conditions";
  return `It's ${cToF(cw.temperature)}°F with ${desc}, wind ${Math.round(cw.windspeed)} mph.`;
}

/*************************************************
 * 📍 GPS (reverse geocode via OSM Nominatim, no key)
 *************************************************/
async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`;
  const res = await withTimeout(fetch(url, { headers: { "Accept": "application/json" }}), 8000);
  if (!res.ok) throw new Error("HTTP " + res.status);
  const j = await res.json();
  return j?.display_name || "";
}

/*************************************************
 * BUTTONS (tap → speak)
 *************************************************/
$("btnVerse")?.addEventListener("click", async () => {
  show("Loading Bible verse…");
  const verse = await getBibleVerse();
  show(verse);
});

$("btnJoke")?.addEventListener("click", async () => {
  show("Loading a joke…");
  const joke = await getJoke();
  show(joke);
});

$("btnWeather")?.addEventListener("click", async () => {
  show("Getting your weather (allow location)…");
  if (!("geolocation" in navigator)) return show("Location not supported on this device.");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude: lat, longitude: lon } = pos.coords;
      const line = await getWeather(lat, lon);
      show(line);
    } catch {
      show("Couldn't fetch weather. Try again in a bit.");
    }
  }, () => show("Location permission denied. I can’t get weather without it."));
});

$("btnGPS")?.addEventListener("click", async () => {
  show("Getting your GPS (allow location)…");
  if (!("geolocation" in navigator)) return show("Location not supported on this device.");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude: lat, longitude: lon } = pos.coords;
    try {
      const place = await reverseGeocode(lat, lon);
      const coords = `Latitude ${lat.toFixed(5)}, Longitude ${lon.toFixed(5)}`;
      show(place ? `You are near: ${place}. (${coords})` : `Your location: ${coords}`);
    } catch {
      show(`Your location: Latitude ${lat.toFixed(5)}, Longitude ${lon.toFixed(5)}.`);
    }
  }, () => show("Location permission denied."));
});

/*************************************************
 * VOICE RECOGNITION + WAKE WORD “AIJOE”
 * (Chrome recommended; Safari support varies)
 *************************************************/
const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
let recog = null;
let voiceOn = false;
let armed = false;         // waiting for a command after “AIJOE”
let armTimer = null;

function setMicStatus(on) { micStatus.textContent = `Mic: ${on ? "On" : "Off"}`; }
function setLastHeard(t) { lastHeard.textContent = `Heard: ${t || "—"}`; }
function armFor(ms = 10000) {
  armed = true;
  wakeStatus.textContent = 'Wake word: AIJOE ✅ (Listening for a command…)';
  clearTimeout(armTimer);
  armTimer = setTimeout(() => {
    armed = false;
    wakeStatus.textContent = 'Wake word: “AIJOE”';
  }, ms);
}

function hasWakeWord(s) {
  // tolerate “ai joe”, “ai-joe”, “aijo”, “ayo”, “ai joey”, “hey ai joe”
  return /(hey\s+)?(ai\s*joe|ai\s*joey|ai\s*jo|aijo|ayo)\b/.test(s);
}

async function handleCommand(s) {
  if (/(bible|verse)/.test(s)) {
    const v = await getBibleVerse(); show(v);
  } else if (/(joke|funny)/.test(s)) {
    const j = await getJoke(); show(j);
  } else if (/(weather|temperature|forecast)/.test(s)) {
    $("btnWeather").click();
  } else if (/(gps|where am i|my location|where.*am.*i)/.test(s)) {
    $("btnGPS").click();
  } else if (/(stop|cancel|quiet)/.test(s)) {
    speechSynthesis.cancel(); show("Okay, I’ll stop.", false);
  } else {
    show('Sorry, I didn’t catch that. Say “Bible verse”, “Joke”, “Weather”, or “GPS”.', true);
  }
}

function handleTranscript(raw) {
  const t = String(raw || "").toLowerCase().replace(/[^a-z\s]/g, " ").replace(/\s+/g, " ").trim();
  if (!t) return;
  setLastHeard(t);

  if (!armed && hasWakeWord(t)) {
    armFor();
    speak("How can I help?");
    return;
  }
  if (armed) {
    armed = false; wakeStatus.textContent = 'Wake word: “AIJOE”';
    handleCommand(t);
  }
}

function startVoice() {
  if (!SR) {
    show("Voice recognition not supported in this browser. Use Chrome for best results.");
    return;
  }
  if (voiceOn) return;

  recog = new SR();
  recog.lang = "en-US";
  recog.continuous = true;
  recog.interimResults = false;

  recog.onresult = (e) => {
    const t = Array.from(e.results)
      .slice(e.resultIndex)
      .map(r => r[0]?.transcript || "")
      .join(" ");
    handleTranscript(t);
  };

  recog.onerror = (ev) => {
    console.warn("Speech error:", ev.error);
    if (ev.error === "not-allowed") {
      show("Mic permission blocked. Please allow microphone access in your browser settings.", false);
      stopVoice();
    }
  };

  recog.onend = () => {
    // Auto-restart to keep listening (Chrome sometimes stops)
    if (voiceOn) { try { recog.start(); } catch {} }
  };

  try {
    recog.start();
    voiceOn = true;
    setMicStatus(true);
    show('Voice on. Say "AIJOE".', false);
  } catch (err) {
    console.error(err);
    show("Couldn’t start mic. Try tapping 🎤 Start Voice again.", false);
  }
}

function stopVoice() {
  voiceOn = false;
  armed = false;
  try { recog && recog.stop(); } catch {}
  setMicStatus(false);
  wakeStatus.textContent = 'Wake word: “AIJOE”';
}

$("btnMic")?.addEventListener("click", startVoice);
$("btnMicStop")?.addEventListener("click", stopVoice);

// Preload voices on load
window.addEventListener("load", () => {
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
});
