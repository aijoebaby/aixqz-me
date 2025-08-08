async function askAI(query) {
  const q = query || prompt("What do you want to ask Joey?");
  if (!q) return;

  displayAIResponse("Thinking...");
  speak("Joey is thinking...");

  // 1) try the serverless function
  try {
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: q })
    });
    const data = await res.json();
    if (data && data.reply) {
      displayAIResponse("Joey says: " + data.reply);
      setTimeout(() => speak(data.reply), 300);
      return;
    }
  } catch (e) {
    // ignore and fall back
  }

  // 2) fallback to static JSON
  try {
    const r = await fetch("/data/reply.json");
    const j = await r.json();
    const text =
      j.reply ||
      (Array.isArray(j.replies) ? j.replies[Math.floor(Math.random() * j.replies.length)] : null) ||
      j.message || j.text || "Hello from Joey.";
    displayAIResponse("Joey says: " + text);
    setTimeout(() => speak(text), 300);
  } catch (e) {
    displayAIResponse("Could not get a reply. Please try again.");
    speak("Sorry, I couldn't get a reply.");
  }
}
