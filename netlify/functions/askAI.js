// net
Indent size

Line wrap mode

Editing askAI.js file contents
1
2
3
4
5
6
7
8
9
10
11
12
13
14
15
16
17
18
19
20
21
22
23
24
25
26
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

ify/functions/askAI.js
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
