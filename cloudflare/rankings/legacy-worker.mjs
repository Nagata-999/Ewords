export default {
  async fetch(request, env) {

    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type"
        }
      });
    }

    try {

      const body = await request.json();

      const word = body.word || "";
      const parts = body.parts || [];

      const prompt = `
You are an English etymology validator.

Word: ${word}
Parts: ${parts.join(" + ")}

Return ONLY JSON.

{
  "valid": true,
  "word": "${word}",
  "ja": "Japanese meaning",
  "confidence": 0.95,
  "reason": "short explanation"
}
`;

      const openaiResponse = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `Bearer ${env.OPENAI_API_KEY}`
          },
          body: JSON.stringify({
            model: "gpt-5-mini",
            messages: [
              {
                role: "user",
                content: prompt
              }
            ],
            temperature: 0.2
          })
        }
      );

      const result = await openaiResponse.json();

      const content =
        result?.choices?.[0]?.message?.content || "{}";

      return new Response(content, {
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*"
        }
      });

    } catch (err) {

      return new Response(
        JSON.stringify({
          valid: false,
          error: err.message
        }),
        {
          status: 500,
          headers: {
            "Content-Type": "application/json",
            "Access-Control-Allow-Origin": "*"
          }
        }
      );

    }
  }
};

