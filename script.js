function startVoice() {
  alert("Voice assistant is not active yet.");
}
function fetchBibleVerse() {
  alert("Today's verse: 'Be strong and courageous.'");
}
function getLocation() {
  navigator.geolocation.getCurrentPosition((pos) => {
    alert("Your location: " + pos.coords.latitude + ", " + pos.coords.longitude);
  });
}
function callEmergency() {
  alert("Dialing 911 (simulated).");
}
function playMusic() {
  alert("Playing music (not implemented).");
}
function fetchWeather() {
  alert("Weather feature not set up.");
}
function trackMood() {
  alert("Tracking mood (future feature).");
}
function manageList() {
  alert("List management coming soon.");
}async function askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;const data = await res.json();
if (data.reply) {
  alert("Joey says:\n\n" + data.reply);

  // --- speech-synthesis block ---
  if ('speechSynthesis' in window) {
    const utter = new Speech
}// --- Ask AI (Joey) ---
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
      // Show Joey's reply
      alert("Joey says:\n\n" + data.reply);

      // Optional: speak reply aloud
      if ("speechSynthesis" in window) {
        const utter = new SpeechSynthesisUtterance(data.reply);
        utter.lang = "en-US";
        speechSynthesis.speak(utter);
      }
    } else if (data.error) {
      alert("Joey had trouble: " + data.error);
    } else {
      alert("No response from Joey.");
    }
  } catch (err) {
    alert("Network error talking to Joey: " + err);
  }
}

   
function tellJoke() {
  alert("Why did the AI cross the road? To optimize the chicken!");
}
function fixSomething() {
  alert("Help me fix something - coming soon.");
}
function findPlace() {
  alert("Finding nearby place - coming soon.");
}
