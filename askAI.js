// netlify/functions/askAI.js
const OPENAI_KEY = process.env.OPENAI_API_KEY;

function json(status, body) {
  return {
    statusCode: status,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  };async function onAsk() {
  const msg = input.value.trim();
  if (!msg) return;
  replyBox.textContent = "Joey is thinking… 🐾";
  try {
    const reply = await askAI(msg);
    replyBox.textContent = reply;
    speak(reply);  // 🔊 Joey talks
  } catch (e) {
    replyBox.textContent = "Network error ❌";
    console.error(e);
  }
}
}

exports.handler = async (event) => {
  try {
    const { prompt = "" } = JSON.parse(event.body || "{}");
    if (!prompt.trim()) return json(400, { error: "Missing prompt" });

    if (!OPENAI_KEY) {
      return json(200, { reply: `You said: "${prompt}". (No OPENAI_API_KEY yet.)` });
    }

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: "You are Joey, a concise, friendly assistant." },
          { role: "user", content: prompt }
        ],
        temperature: 0.6,
        max_tokens: 300
      }),
    });

    if (!r.ok) {
      const errTxt = await r.text().catch(() => r.statusText);
      return json(r.status, { error: `OpenAI error: ${errTxt}` });
    }
    const data = await r.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "I’m not sure.";
    return json(200, { reply });
  } catch (e) {
    return json(500, { error: e.message || "Server error" });
  }
};
