  } catch (err) {// ===============================
// AIJOE VOICE — script.js  v1.4
// ===============================

// --- Speech helper: waits for voices, picks a Google voice if available ---
function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel(); // Cancel any queued speech

  function _speak() {
    const utter = new SpeechSynthesisUtterance(text);
    const voices = speechSynthesis.getVoices();
    utter.lang = "en-US";
    // Prefer Google US English (Android/Chrome)
    utter.voice = voices.find(v => v.lang === "en-US" && v.name.includes("Google")) ||
                  voices.find(v => v.lang.startsWith("en")) || voices[0];
    speechSynthesis.speak(utter);
  }
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener("voiceschanged", _speak, { once: true });
  } else {
    _speak();
  }
}

// --- Main AI button ---
async function askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;

  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText })
    });

    const data = await res.json();
    if (data.reply) {
      speak(data.reply); // Speak first
      alert("Joey says:\n\n" + data.reply); // Then alert
    } else {
      alert("Joey had trouble: " + (data.error || "No response"));
    }
  } catch (err) {
    alert("Network error talking to Joey:\n" + err);
  }
}

// --- Bible Verse button ---
async function fetchBibleVerse() {
  try {
    const res = await fetch("https://beta.ourmanna.com/api/v1/get/?format=json&order=daily");
    if (!res.ok) throw new Error("Verse API error " + res.status);
    const j   = await res.json();
    const text= j?.verse?.details?.text?.trim()      || "(no verse)";
    const ref = j?.verse?.details?.reference?.trim() || "(reference?)";
    alert(ref + "\n\n" + text);
  } catch (err) {
    // fallback
    try {
      const fb = await fetch("https://bible-api.com/John%203:16?translation=kjv");
      const d  = await fb.json();
      alert("[Fallback] " + d.reference + "\n\n" + d.text.trim());
    } catch {
      alert("Sorry, couldn't load a verse right now.");
    }
  }
}

// --- Other buttons ---
function startVoice()      { alert("Voice feature coming soon!"); }
function getLocation()     { 
  if (!navigator.geolocation) { alert("Geolocation not supported."); return; }
  navigator.geolocation.getCurrentPosition(
    p => alert(`Latitude: ${p.coords.latitude}\nLongitude: ${p.coords.longitude}`), 
    e => alert(e.message)
  );
}
function callEmergency()   { alert("Dialing 911 (simulated)."); }
function playMusic()       { window.open("https://www.youtube.com/results?search_query=lofi+hip+hop", "_blank"); }
function fetchWeather()    { alert("Weather feature coming soon!"); }
function trackMood()       { alert("Mood tracker coming soon!"); }
function manageList()      { alert("List manager coming soon!"); }
function tellJoke()        { alert("Why did the AI cross the road? To optimize the chicken!"); }
function fixSomething()    { alert("Let's fix it! Feature coming soon."); }
function findPlace()       { alert("Nearby places feature coming soon."); }
    alert('Network error talking to Joey:\n' + err);
  }
}

/* ---------- Bible Verse ---------- */
async function fetchBibleVerse() {
  try {
    const res = await fetch('https://beta.ourmanna.com/api/v1/get/?format=json&order=daily');
    if (!res.ok) throw new Error('Verse API error ' + res.status);
    const j   = await res.json();
    const text= j?.verse?.details?.text?.trim()      || '(no verse)';
    const ref = j?.verse?.details?.reference?.trim() || '(ref?)';
    alert(ref + '\n\n' + text);
  } catch (err) {
    try {
      const fb = await fetch('https://bible-api.com/John%203:16?translation=kjv');
      const d  = await fb.json();
      alert('[Fallback] ' + d.reference + '\n\n' + d.text.trim());
    } catch {
      alert('Sorry, couldn\'t load a verse now.');
    }
  }
}

/* ---------- Other button placeholders ---------- */
function startVoice()      { alert('Voice feature coming soon!'); }
function getLocation()     { navigator.geolocation?.getCurrentPosition(p => alert(`Lat ${p.coords.latitude}\nLon ${p.coords.longitude}`), e=>alert(e.message)); }
function callEmergency()   { alert('Dialing 911 (simulated).'); }
function playMusic()       { window.open('https://www.youtube.com/results?search_query=lofi+hip+hop', '_blank'); }
function fetchWeather()    { alert('Weather feature coming soon!'); }
function trackMood()       { alert('Mood tracker coming soon!'); }
function manageList()      { alert('List manager coming soon!'); }
function tellJoke()        { alert('Why did the AI cross the road? To optimize the chicken!'); }
function fixSomething()    { alert("Let's fix it! Feature coming soon."); }
function findPlace()       { alert('Nearby places feature coming soon.'); }

/* ---------- helper: speak text if available ---------- */
function speak(text) {
  if (!('speechSynthesis' in window)) return;

  function _speak() {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = 'en-US';
    speechSynthesis.speak(utter);
  }

  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener('voiceschanged', _speak, { once: true });
  } else {
    _speak();
  }
}

/* ---------- Ask AI (Joey) ---------- */
async function askAI() {
  const promptText = prompt('What do you want to ask Joey?');
  if (!promptText) return;

  try {
    const res = await fetch('/.netlify/functions/askAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: promptText })
    });

    const data = await res.json();

    if (data.reply) {
      speak(data.reply);                       // 🗣️ speak first
      alert('Joey says:\n\n' + data.reply);  // 📝 then show alert
    } else {
      alert('Joey had trouble: ' + (data.error || 'No response'));
    }
  } catch (err) {
    alert('Network error talking to Joey:\n' + err);
  }
}

/* ---------- Bible Verse ---------- */
async function fetchBibleVerse() {
  try {
    const res = await fetch('https://beta.ourmanna.com/api/v1/get/?format=json&order=daily');
    if (!res.ok) throw new Error('Verse API error ' + res.status);
    const j   = await res.json();
    const text= j?.verse?.details?.text?.trim()      || '(no verse)';
    const ref = j?.verse?.details?.reference?.trim() || '(ref?)';
    alert(ref + '\n\n' + text);
  } catch (err) {
    try {
      const fb = await fetch('https://bible-api.com/John%203:16?translation=kjv');
      const d  = await fb.json();
      alert('[Fallback] ' + d.reference + '\n\n' + d.text.trim());
    } catch {
      alert('Sorry, couldn\'t load a verse now.');
    }
  }
}

/* ---------- Other button placeholders ---------- */
function startVoice()      { alert('Voice feature coming soon!'); }
function getLocation()     { navigator.geolocation?.getCurrentPosition(p => alert(`Lat ${p.coords.latitude}\nLon ${p.coords.longitude}`), e=>alert(e.message)); }
function callEmergency()   { alert('Dialing 911 (simulated).'); }
function playMusic()       { window.open('https://www.youtube.com/results?search_query=lofi+hip+hop', '_blank'); }
function fetchWeather()    { alert('Weather feature coming soon!'); }
function trackMood()       { alert('Mood tracker coming soon!'); }
function manageList()      { alert('List manager coming soon!'); }
function tellJoke()        { alert('Why did the AI cross the road? To optimize the chicken!'); }
function fixSomething()    { alert("Let's fix it! Feature coming soon."); }
function findPlace()       { alert('Nearby places feature coming soon.'); }
