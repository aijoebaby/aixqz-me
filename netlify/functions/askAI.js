// netlify/functions/askAI.js
exports.handler = async functions (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." })
    };
  }

  // Parse body
  let prompt = "";
  try {
    prompt = (JSON.parse(event.body || "{}").prompt || "").trim();
  } catch {}

  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: "Missing prompt." }) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, body: JSON.stringify({ error: "No API key." }) };
  }

  const payload = {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are Joey, a friendly helper dog." },
      { role: "user", content: prompt }
    ],
    max_tokens: 256,
    temperature: 0.7
  };

  try {
    const resp = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(payload)
    });

    if (!resp.ok) {
      return { statusCode: resp.status, body: JSON.stringify({ error: "OpenAI error" }) };
    }

    const data  = await resp.json();
    const reply = data.choices[0].message.content.trim();

    return { statusCode: 200, body: JSON.stringify({ reply }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: String(err) }) };
  }
};
