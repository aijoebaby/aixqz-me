/***********************
 * KILL OLD BACKEND STUFF
 * (Prevents “AIJOE not reachable / health check / AIJOE_ENDPOINT” crashes)
 ***********************/
try { window.AIJOE_ENDPOINT = null; } catch {}
window.addEventListener("unhandledrejection", e => {
  console.warn("Silenced background error:", e.reason);
});

/***********************
 * VOICE: robust helper
 ***********************/
window.addEventListener("load", () => {
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
});

function speak(text) {
  if (!("speechSynthesis" in window)) return;
  speechSynthesis.cancel();

  const u = new SpeechSynthesisUtterance(String(text || "").trim() || " ");
  u.lang   = "en-US";
  u.rate   = 1;
  u.pitch  = 1;
  u.volume = 1;

  const pick = () => {
    const v = speechSynthesis.getVoices();
    if (!v.length) return null;
    return v.find(x => x.lang === "en-US" && x.name.includes("Google"))
        || v.find(x => x.lang === "en-US")
        || v.find(x => x.lang.startsWith("en"))
        || v[0];
  };

  const go = () => { const v = pick(); if (v) u.voice = v; speechSynthesis.speak(u); };

  if (!speechSynthesis.getVoices().length) {
    speechSynthesis.addEventListener("voiceschanged", go, { once:true });
  } else {
    go();
  }
}

// Prime audio on first click (mobile autoplay rules)
document.addEventListener("click", function primeOnce() {
  if ("speechSynthesis" in window) {
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0; speechSynthesis.speak(u);
  }
  document.removeEventListener("click", primeOnce);
}, { once:true });

/***********************
 * UI helpers
 ***********************/
const $out = document.getElementById("output");
const show = (t) => { $out.textContent = t; speak(t); };

function withTimeout(promise, ms=8000) {
  return Promise.race([
    promise,
    new Promise((_,rej)=>setTimeout(()=>rej(new Error("timeout")), ms))
  ]);
}

/***********************
 * 📖 Bible Verse
 * Primary: OurManna (no key). Fallback: local list.
 ***********************/
const LOCAL_VERSES = [
  "Psalm 23:1 — The Lord is my shepherd; I shall not want.",
  "Philippians 4:13 — I can do all things through Christ who strengthens me.",
  "Proverbs 3:5 — Trust in the Lord with all your heart and lean not on your own understanding.",
  "Isaiah 41:10 — Fear not, for I am with you; be not dismayed, for I am your God.",
  "John 3:16 — For God so loved the world that He gave His only Son…"
];

async function getBibleVerse() {
  const url = "https://beta.ourmanna.com/api/v1/get/?format=json";
  try {
    const res = await withTimeout(fetch(url, { cache:"no-store" }));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const text = data?.verse?.details?.text;
    const ref  = data?.verse?.details?.reference;
    if (text) return ref ? `${text} — ${ref}` : text;
    throw new Error("unexpected shape");
  } catch {
    return LOCAL_VERSES[Math.floor(Math.random()*LOCAL_VERSES.length)];
  }
}

/***********************
 * 😂 Joke
 * Primary: Official Joke API. Fallback: local list.
 ***********************/
const LOCAL_JOKES = [
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "I tried to catch fog yesterday. Mist.",
  "What do you call cheese that isn’t yours? Nacho cheese!",
  "I told my computer I needed a break, and it said, “No problem—I’ll go to sleep.”",
  "I asked my dog what’s two minus two. He said nothing."
];

async function getJoke() {
  const url = "https://official-joke-api.appspot.com/jokes/random";
  try {
    const res = await withTimeout(fetch(url, { cache:"no-store" }));
    if (!res.ok) throw new Error("HTTP " + res.status);
    const j = await res.json();
    const t = [j?.setup, j?.punchline].filter(Boolean).join(" … ");
    if (t) return t;
    throw new Error("bad data");
  } catch {
    return LOCAL_JOKES[Math.floor(Math.random()*LOCAL_JOKES.length)];
  }
}

/***********************
 * ☀️ Weather (no key)
 * Uses Geolocation + Open-Meteo current_weather
 ***********************/
const WCODE = {
  0:"clear sky", 1:"mainly clear", 2:"partly cloudy", 3:"overcast",
  45:"fog", 48:"depositing rime fog",
  51:"light drizzle", 53:"moderate drizzle", 55:"dense drizzle",
  56:"freezing drizzle", 57:"freezing drizzle",
  61:"light rain", 63:"moderate rain", 65:"heavy rain",
  66:"freezing rain", 67:"freezing rain",
  71:"light snow", 73:"moderate snow", 75:"heavy snow",
  77:"snow grains",
  80:"rain showers", 81:"rain showers", 82:"violent rain showers",
  85:"snow showers", 86:"snow showers",
  95:"thunderstorm", 96:"thunderstorm with hail", 99:"thunderstorm with heavy hail"
};

function cToF(c){ return Math.round(c*9/5+32); }

async function getWeather(lat, lon) {
  const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true`;
  const res = await withTimeout(fetch(url, { cache:"no-store" }));
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  const cw = data?.current_weather;
  if (!cw) throw new Error("no current_weather");
  const desc = WCODE[cw.weathercode] || "current conditions";
  return `It's ${cToF(cw.temperature)}°F with ${desc}, wind ${Math.round(cw.windspeed)} mph.`;
}

/***********************
 * 📍 GPS
 * Speaks coords; tries reverse geocode (no key) with fallback.
 ***********************/
async function reverseGeocode(lat, lon) {
  const url = `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lon}&format=jsonv2`;
  const res = await withTimeout(fetch(url, { headers:{ "Accept":"application/json" } }));
  if (!res.ok) throw new Error("HTTP " + res.status);
  const j = await res.json();
  return j?.display_name || "";
}

/***********************
 * BUTTONS
 ***********************/
document.getElementById("btnVerse")?.addEventListener("click", async () => {
  show("Loading Bible verse…");
  const verse = await getBibleVerse();
  show(verse);
});

document.getElementById("btnJoke")?.addEventListener("click", async () => {
  show("Loading a joke…");
  const joke = await getJoke();
  show(joke);
});

document.getElementById("btnWeather")?.addEventListener("click", async () => {
  show("Getting your weather (allow location)…");
  if (!("geolocation" in navigator)) return show("Location not supported on this device.");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    try {
      const { latitude:lat, longitude:lon } = pos.coords;
      const line = await getWeather(lat, lon);
      show(line);
    } catch {
      show("Couldn't fetch weather. Try again in a bit.");
    }
  }, () => show("Location permission denied. I can’t get weather without it."));
});

document.getElementById("btnGPS")?.addEventListener("click", async () => {
  show("Getting your GPS (allow location)…");
  if (!("geolocation" in navigator)) return show("Location not supported on this device.");
  navigator.geolocation.getCurrentPosition(async (pos) => {
    const { latitude:lat, longitude:lon } = pos.coords;
    try {
      const place = await reverseGeocode(lat, lon);
      const coords = `Latitude ${lat.toFixed(5)}, Longitude ${lon.toFixed(5)}`;
      show(place ? `You are near: ${place}. (${coords})` : `Your location: ${coords}`);
    } catch {
      show(`Your location: Latitude ${lat.toFixed(5)}, Longitude ${lon.toFixed(5)}.`);
    }
  }, () => show("Location permission denied."));
});
