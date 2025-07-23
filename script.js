async function askAI() {
  const input = document.getElementById('askai-input');
  const userText = input ? input.value : '';
  setStatus("Joey is thinking...");

  try {
    const res = await fetch('/.netlify/functions/askAI', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: userText })
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || `HTTP ${res.status}`);

    setStatus("");
    showAnswer(data.reply);
    // Text-to-speech
    if ('speechSynthesis' in window) {
      const utter = new SpeechSynthesisUtterance(data.reply);
      utter.rate = 1;
      window.speechSynthesis.speak(utter);
    }
  } catch (err) {
    console.error("Front-end error:", err);
    setStatus("Error: " + err.message);
  }
}

// Attach to button (make sure your button has id="askai-btn")
document.getElementById('askai-btn').addEventListener('click', askAI);

// Helper functions
function setStatus(msg) {
  const statusEl = document.getElementById('status');
  if (statusEl) statusEl.textContent = msg;
}
function showAnswer(text) {
  const answerEl = document.getElementById('answer');
  if (answerEl) answerEl.textContent = text;
}
