// netlify/functions/askAI.js
export async function handler(event) {
  try {
    const { prompt } = JSON.parse(event.body || '{}');

    if (!prompt) {
      return { statusCode: 400, body: JSON.stringify({ error: 'No prompt' }) };
    }

    // Call OpenAI (or whatever) here. Example placeholder:
    const reply = "Hello from Joey! You asked: " + prompt;

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
