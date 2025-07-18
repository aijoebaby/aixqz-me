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
    const utter = new SpeechSynthesisUtterance(data.reply);
    utter.lang = "en-US";        // pick any voice/language installed
    speechSynthesis.speak(utter);
  }
  // --- end speech block ---

} else if (data.error) {
  alert("Joey had trouble: " + data.error);
}

  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText })
    });
    const data = await res.json();
    alert(data.reply || data.error || "No response");
  } catch (err) {
    alert("Network error: " + err);
  }
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
