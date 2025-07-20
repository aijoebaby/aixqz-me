function askAI() {
  const promptText = prompt("What do you want to ask Joey?");
  if (!promptText) return;
  // Just repeat what you typed, as Joey's reply
  speak("Joey says: " + promptText);
  alert("Joey says:\n\n" + promptText);
}
