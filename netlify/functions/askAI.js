async console.log("askAI raw data:", data);
 askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;

  // Keep speech permission alive
  speak("Joey is thinking...");
  
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText })
    });
    const data = await res.json();

    // Wait a moment to let browser keep speech permission
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
