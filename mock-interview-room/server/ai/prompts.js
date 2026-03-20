function buildPrompt({ role, question, code, language, userQuery }) {

  const base = `You are an AI co-pilot inside a live coding interview room.
Programming language: ${language}
Interview question: ${question}
Current candidate code:
\`\`\`${language}
${code || 'No code written yet'}
\`\`\`
`;

  if (role === 'candidate') {
    return base + `
You are helping the CANDIDATE. Follow these rules strictly:
- NEVER give the full solution or working code
- Give conceptual hints only — for example "think about using a hashmap here"
- Point out edge cases they might be missing
- Comment on time and space complexity of their current approach
- If they are stuck, ask a Socratic question to guide their thinking
- Keep your response under 80 words — they are in a live interview
- Be encouraging but concise

Candidate's question: ${userQuery}`;
  }

  if (role === 'interviewer') {
    return base + `
You are helping the INTERVIEWER. Provide exactly this structure:
1. SCORE: Rate the solution out of 10 for correctness, efficiency, and code quality
2. ANALYSIS: What the candidate did well and what is wrong or missing
3. FOLLOW-UP QUESTIONS: 2-3 smart questions to probe deeper
4. OPTIMAL SOLUTION: The best solution with explanation (this is hidden from candidate)

Be concise and structured. 
Interviewer's request: ${userQuery}`;
  }
}

module.exports = { buildPrompt };