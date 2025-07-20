netlify/functions/askAI.js   ← (new file)
function speak(text) {
  if (!("speechSynthesis" in window)) return;  // browser unsupported

  function _speak() {
    const utter = new SpeechSynthesisUtterance(text);
    utter.lang = "en-US";
    speechSynthesis.speak(utter);
  }

  // If voices are not yet loaded, wait for them
  if (speechSynthesis.getVoices().length === 0) {
    window.speechSynthesis.addEventListener("voiceschanged", _speak, { once: true });
  } else {
    _speak();
  }
}

/* --- inside askAI success block --- */
if (data.reply) {
  speak(data.reply);               // 🔈 speaks first
  alert("Joey says:\n\n" + data.reply);
}
netlify/functions/askAI.js

const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

exports.handler = async function (event) {
  if (event.httpMethod !== "POST") {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: "Method Not Allowed. Use POST." }),
    };
  }

  const prompt = validatePrompt(event.body);
  if (!prompt) {
    return { statusCode: 400, body: JSON.stringify({ error: "Invalid or missing prompt." }) };
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: "API key is missing from environment variables." }),
    };
  }

  const payload = buildPayload(prompt);

  try {
    const resp = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!resp.ok) {
      return {
        statusCode: resp.status,
        body: JSON.stringify({ error: `OpenAI API error: ${await resp.text()}` }),
      };
    }

    const data = await resp.json();
    return { statusCode: 200, body: JSON.stringify({ reply: data.choices[0].message.content.trim() }) };
  } catch (err) {
    return { statusCode: 500, body: JSON.stringify({ error: err.message }) };
  }
};

function validatePrompt(body) {
  try {
    return (JSON.parse(body || "{}").prompt || "").trim();
  } catch {
    return null;
  }
}

function buildPayload(prompt) {
  return {
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: "You are Joey, a friendly helper dog." },
      { role: "user", content: prompt },
    ],
    max_tokens: 256,
    temperature: 0.7,
  };
}
