async function askAI(query) {
  // 1) Get the prompt text (either passed in or via prompt())
  const promptText = query || prompt("What do you want to ask Joey?");
  if (!promptText) return;

  // 2) Show and speak the “thinking” state
  displayAIResponse("Thinking...");
  speak("Joey is thinking...");

  try {
    // 3) Send to your Netlify function
    const res = await fetch("/.netlify/functions/askAI", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt: promptText }),
    });
    const data = await res.json();

    // 4) Handle the reply
    if (data.reply) {
      displayAIResponse("Joey says: " + data.reply);
      // small delay so UI updates before speaking
      setTimeout(() => speak(data.reply), 300);
    } else {
      // no `reply` field = error from your function
      const msg = data.error || "No response from Joey.";
      displayAIResponse("Error: " + msg);
      speak(msg);
    }
  } catch (err) {
    // network or JSON error
    const errMsg = "Network error talking to Joey: " + err.message;
    displayAIResponse(errMsg);
    speak("Sorry, network error.");
  }
}
