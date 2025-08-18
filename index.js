/**************
 * VOICE HELPERS
 **************/

// Preload voices on page load (some browsers need this)
window.addEventListener("load", () => {
  if ("speechSynthesis" in window) {
    speechSynthesis.getVoices();
  }
});

// Speak a string out loud (robust + “butler-proof”)
function speak(text) {
  if (!("speechSynthesis" in window)) return;

  // Cancel anything already speaking
  speechSynthesis.cancel();

  const utter = new SpeechSynthesisUtterance(text);
  utter.lang = "en-US";
  utter.rate = 1;   // speed: 0.5–2
  utter.pitch = 1;  // tone: 0–2
  utter.volume = 1; // 0–1

  // Pick a good en-US voice if available
  const pickVoice = () => {
    const voices = speechSynthesis.getVoices();
    if (!voices || !voices.length) return null;
    return (
      voices.find(v => v.lang === "en-US" && v.name.includes("Google")) ||
      voices.find(v => v.lang === "en-US") ||
      voices.find(v => v.lang.startsWith("en")) ||
      voices[0]
    );
  };

  const trySpeak = () => {
    const v = pickVoice();
    if (v) utter.voice = v;
    speechSynthesis.speak(utter);
  };

  // If voices aren’t loaded yet, wait once
  if (!speechSynthesis.getVoices().length) {
    speechSynthesis.addEventListener("voiceschanged", trySpeak, { once: true });
  } else {
    trySpeak();
  }
}

/**************
 * UI HELPERS
 **************/
const output = document.getElementById("output");

function show(text) {
  output.textContent = text;
  // Also speak it
  speak(text);
}

/**************
 * FETCH HELPERS (with timeout + fallback)
 **************/
function withTimeout(promise, ms = 6000) {
  return Promise.race([
    promise,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ]);
}

/**************
 * BIBLE VERSE (API + fallback)
 **************
 * Primary: OurManna (simple “verse of the day” JSON)
 * Fallback: local verse list
 */
const LOCAL_VERSES = [
  "Psalm 23:1 — The Lord is my shepherd; I shall not want.",
  "Philippians 4:13 — I can do all things through Christ who strengthens me.",
  "Proverbs 3:5 — Trust in the Lord with all your heart and lean not on your own understanding.",
  "Isaiah 41:10 — Fear not, for I am with you.",
  "John 3:16 — For God so loved the world…",
];

async function getBibleVerse() {
  // OurManna JSON endpoint (no key). If this ever changes, the fallback still works.
  const url = "https://beta.ourmanna.com/api/v1/get/?format=json";
  try {
    const res = await withTimeout(fetch(url, { cache: "no-store" }), 7000);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    // Different shapes exist; cover common ones safely:
    const text =
      data?.verse?.details
        ? `${data.verse.details.text} — ${data.verse.details.reference}`
        : data?.verse
        ? `${data.verse.verse} — ${data.verse.details?.reference || ""}`.trim()
        : "";
    if (text) return text;
    throw new Error("Unexpected response");
  } catch {
    // Fallback to a random local verse
    const v = LOCAL_VERSES[Math.floor(Math.random() * LOCAL_VERSES.length)];
    return v;
  }
}

/**************
 * JOKE (API + fallback)
 **************
 * Primary: Official Joke API
 * Fallback: local list
 */
const LOCAL_JOKES = [
  "Why did the scarecrow win an award? Because he was outstanding in his field!",
  "I tried to catch fog yesterday. Mist.",
  "I told my computer I needed a break, and it said ‘No problem—I’ll go to sleep.’",
  "What do you call cheese that isn’t yours? Nacho cheese!",
  "I asked my dog what’s two minus two. He said nothing."
];

async function getJoke() {
  const url = "https://official-joke-api.appspot.com/jokes/random";
  try {
    const res = await withTimeout(fetch(url, { cache: "no-store" }), 7000);
    if (!res.ok) throw new Error("HTTP " + res.status);
    const data = await res.json();
    const text = [data?.setup, data?.punchline].filter(Boolean).join(" … ");
    if (text) return text;
    throw new Error("Unexpected response");
  } catch {
    // Fallback to a random local joke
    return LOCAL_JOKES[Math.floor(Math.random() * LOCAL_JOKES.length)];
  }
}

/**************
 * BUTTON WIRING
 **************/
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

/**************
 * OPTIONAL: FIRST USER GESTURE NUDGE
 * Some mobile browsers only allow audio after a tap.
 * The first click triggers speech; afterwards you’re good.
 **************/
document.addEventListener("click", function primeAudioOnce() {
  if ("speechSynthesis" in window) {
    // A tiny, silent utterance to “unlock” audio on strict browsers
    const u = new SpeechSynthesisUtterance(" ");
    u.volume = 0;
    speechSynthesis.speak(u);
  }
  document.removeEventListener("click", primeAudioOnce);
}, { once: true });
