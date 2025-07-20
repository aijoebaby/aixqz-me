async function askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;

  // Say something immediately so permission is not lost
  speak("Joey is thinking...");
  
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText })
    });
    const data = await res.json();

    if (data.reply) {
      // Cancel previous, then speak real reply
      setTimeout(() => speak(data.reply), 250);
      setTimeout(() => alert("Joey says:\n\n" + data.reply), 750);
    } else {
      alert("Joey had trouble: " + (data.error || "No response"));
    }
  } catch (err) {
    alert("Network error talking to Joey:\n" + err);
  }
}
 askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;
  // Just repeat what you typed, as Joey's reply
  speak("Joey says: " + promptText);
  alert("Joey says:\n\n" + promptText);
}
