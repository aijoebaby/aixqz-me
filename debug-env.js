// netlify/functions/debug-env.js
exports.handler = async () => {
  return {
    statusCode: 200,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      context: process.env.CONTEXT,
      has_OPENAI_API_KEY: !!process.env.OPENAI_API_KEY,
      has_NETLIFY_PICOVOICE_KEY: !!process.env.NETLIFY_PICOVOICE_KEY
    })
  };
};
