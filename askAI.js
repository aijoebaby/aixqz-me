export async function handler(event) {
  console.log("🚀 askAI handler invoked");
  console.log("Raw event.body:", event.body);
  try {
    const { prompt } = JSON.parse(event.body || '{}');
    console.log("Parsed prompt:", prompt);

    if (!prompt) {
      console.log("❌ No prompt supplied");
      return { statusCode: 400, body: JSON.stringify({ error: 'No prompt' }) };
    }

    // Replace with your OpenAI or AI call
    const reply = `Hello from Joey! You asked: ${prompt}`;
    console.log("Reply ready:", reply);

    return {
      statusCode: 200,
      body: JSON.stringify({ reply })
    };
  } catch (e) {
    console.error("🔥 Caught error in handler:", e);
    return { statusCode: 500, body: JSON.stringify({ error: e.message }) };
  }
}
