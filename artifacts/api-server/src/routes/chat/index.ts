import { Router, type IRouter } from "express";
import { db, chatMessagesTable } from "@workspace/db";
import { SendChatMessageBody } from "@workspace/api-zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { desc } from "drizzle-orm";

const router: IRouter = Router();

router.post("/chat", async (req, res): Promise<void> => {
  const parsed = SendChatMessageBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { question, code } = parsed.data;

  const prompt = `You are a professional code review assistant.
Analyze the following code carefully and answer the user's question clearly.

Code:
\`\`\`
${code}
\`\`\`

Question: ${question}

Give a clear explanation, point out issues if any, and suggest improvements.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        {
          role: "user",
          content: prompt,
        },
      ],
    });

    const answer = completion.choices[0]?.message?.content ?? "No response generated.";

    const [saved] = await db
      .insert(chatMessagesTable)
      .values({ question, code, answer })
      .returning();

    res.json({ answer, id: saved.id });
  } catch (err) {
    req.log.error({ err }, "Failed to generate AI response");
    res.status(500).json({ error: "Failed to generate AI response. Please try again." });
  }
});

router.get("/chat/history", async (req, res): Promise<void> => {
  try {
    const messages = await db
      .select()
      .from(chatMessagesTable)
      .orderBy(desc(chatMessagesTable.createdAt))
      .limit(50);

    res.json(messages.reverse());
  } catch (err) {
    req.log.error({ err }, "Failed to fetch chat history");
    res.status(500).json({ error: "Failed to fetch chat history." });
  }
});

export default router;
