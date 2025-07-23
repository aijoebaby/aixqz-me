// ===============================
// AIJOE VOICE — script.js v2.2
// ===============================

// Preload voices on load
window.addEventListener("load", () => {
  if ("speechSynthesis" in window) speechSynthesis.getVoices();
});

// Speech helper
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
  } else _speak();
}

// Utility to show AI response in-page
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

// Ask AI
async function askAI() {
  const q = prompt("What do you want to ask Joey?");
  if (!q) return;
  // Prime speech
  speak("Joey is thinking...");
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: q }),
    });
    const data = await res.json();
    if (data.reply) {
      // Speak then display
      setTimeout(() => speak(data.reply), 300);
      displayAIResponse("Joey says: " + data.reply);
    } else {
      displayAIResponse("Error: " + (data.error || "No response"));
    }
  } catch (err) {
    displayAIResponse("Network error: " + err);
  }
}

// Other features unchanged...
async function fetchBibleVerse() { /*...*/ }
function fetchWeather() { /*...*/ }
function trackMood() { /*...*/ }
function manageList() { /*...*/ }
// etc...
