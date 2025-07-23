async function askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;

  speak("Joey is thinking...");

  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText }),
    });
    const data = await res.json();

    if (data.reply) {
      speak(data.reply);
      setTimeout(() => {
        alert("Joey says:\n\n" + data.reply);
      }, 500);
    } else {
      alert("Joey had trouble: " + (data.error || "No response"));
    }
  } catch (err) {
    alert("Network error talking to Joey:\n" + err);
  }
}
