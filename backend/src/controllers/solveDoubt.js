const OpenAI = require("openai");

const client = new OpenAI({
  apiKey: process.env.OPENROUTER_API_KEY,
  baseURL: "https://openrouter.ai/api/v1",
  defaultHeaders: {
    "HTTP-Referer": process.env.CLIENT_URL_AI,  
    "X-Title": process.env.APP_NAME || "LeetCode Clone AI",
  },
});

const solveDoubt = async (req, res) => {
  try {
    const { messages, title, description, testCases, startCode } = req.body;

    // ✅ Sanitize messages (OpenAI-compatible)
    const normalizedMessages = messages
      .filter(
        (m) => typeof m.content === "string" && m.content.trim().length > 0
      )
      .map((m) => ({
        role: m.role === "assistant" ? "assistant" : "user",
        content: m.content.trim(),
      }));

    if (normalizedMessages.length === 0) {
      return res.status(400).json({ message: "Empty message" });
    }

    // ✅ Structured SYSTEM PROMPT (ported from Gemini version)
    const systemPrompt = `
You are an expert Data Structures and Algorithms (DSA) tutor.
Your role is strictly limited to helping with the CURRENT coding problem.

========================
CURRENT PROBLEM CONTEXT
========================
PROBLEM TITLE:
${title}

PROBLEM DESCRIPTION:
${description}

EXAMPLES / TEST CASES:
${testCases}

STARTER CODE:
${startCode}

========================
YOUR CAPABILITIES
========================
1. Hint Provider:
   - Give step-by-step hints
   - Do NOT reveal the full solution unless explicitly asked

2. Code Reviewer:
   - Identify logical bugs
   - Suggest improvements
   - Explain WHY something is wrong

3. Solution Guide (ONLY if asked):
   - Explain approach first
   - Provide clean, well-commented code
   - Include time & space complexity

4. Complexity Analyzer:
   - Compare brute-force vs optimized
   - Explain trade-offs clearly

5. Approach Suggester:
   - Discuss multiple approaches if applicable
   - Mention when each approach is useful

6. Test Case Helper:
   - Suggest edge cases
   - Explain tricky inputs

========================
INTERACTION RULES
========================
- Stay strictly within this problem
- Do NOT answer unrelated questions
- Do NOT switch to other problems
- If question is unrelated, reply:
  "I can only help with the current DSA problem."

========================
RESPONSE STYLE
========================
- Clear and concise
- Structured explanations
- Point-wise when appropriate
- Simple language
- Relate every answer to the current problem

========================
TEACHING PHILOSOPHY
========================
- Encourage understanding over memorization
- Explain the WHY behind solutions
- Build problem-solving intuition
- Promote best coding practices
`;

    const completion = await client.chat.completions.create({
      model: process.env.OPENROUTER_MODEL,
      messages: [
        { role: "system", content: systemPrompt },
        ...normalizedMessages,
      ],
      temperature: 0.4,
    });

    res.status(200).json({
      message: completion.choices[0].message.content,
    });
  } catch (err) {
    console.error("AI ERROR:", err);
    res.status(500).json({ message: "AI failed" });
  }
};

module.exports = solveDoubt;
