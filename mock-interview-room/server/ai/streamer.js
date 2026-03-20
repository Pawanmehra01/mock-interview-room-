const Groq = require('groq-sdk');
const { buildPrompt } = require('./prompts');

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

async function streamAIResponse(socket, { role, question, code, language, userQuery }) {
  try {
    const prompt = buildPrompt({ role, question, code, language, userQuery });

    const stream = await client.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [{ role: 'user', content: prompt }],
      stream: true,
      max_tokens: 512
    });

    for await (const chunk of stream) {
      const token = chunk.choices[0]?.delta?.content || '';
      if (token) {
        socket.emit('ai:stream', { token });
      }
    }

    socket.emit('ai:done');

  } catch (err) {
    console.error('AI FULL ERROR:', JSON.stringify(err, null, 2));
    socket.emit('ai:error', { message: err.message });
  }
}

module.exports = { streamAIResponse };