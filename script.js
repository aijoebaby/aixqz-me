function testJoeyVoice() {
  if (!('speechSynthesis' in window)) {
    alert("Speech not supported in this browser.");
    return;
  }
  speechSynthesis.cancel();
  function _speak() {
    const utter = new SpeechSynthesisUtterance("Hi, this is Joey! Testing, one, two, three.");
    utter.lang = "en-US";
    // Try to use a Google voice for better quality if available
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
  alert("Did you hear Joey say 'Hi, this is Joey!'? If yes, speech is working!");
}
