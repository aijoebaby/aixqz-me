function speak(text) {
  if (!('speechSynthesis' in window)) return;
  speechSynthesis.cancel();
  function _speak() {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    const voices = speechSynthesis.getVoices();
    utter.voice = voices.find(v => v.lang === "en-US" && v.name.includes("Google")) ||
                  voices.find(v => v.lang.startsWith("en")) || voices[0];
    speechSynthesis.speak(utter);
  }
  if (speechSynthesis.getVoices().length === 0) {
    speechSynthesis.addEventListener("voiceschanged", _speak, { once: true });
  } else {
    _speak();
  }
}async function askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;

  // Prime speech engine (so browser doesn’t block it)
  speak("Joey is thinking...");

  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText })
    });
    const data = await res.json();

    // Speak answer AFTER fetch finishes
    setTimeout(() => {
      if (data.reply) {
        speak(data.reply);
        alert("Joey says:\n\n" + data.reply);
      } else {
        alert("Joey had trouble: " + (data.error || "No response"));
      }
    }, 200);
  } catch (err) {
    alert("Network error talking to Joey:\n" + err);
  }
}
