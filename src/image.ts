import { generateText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const result = await generateText({
  model: google("gemini-2.0-flash-exp"),
  messages: [
    {
      role: "user",
      content: [
        { type: "text", text: "can you log this meal for me?" },
        {
          type: "image",
          image: new URL(
            "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e4/Cheeseburger_%2817237580619%29.jpg/640px-Cheeseburger_%2817237580619%29.jpg"
          ),
        },
      ],
    },
  ],
  tools: {
    logFood: tool({
      description: "Log a food item",
      parameters: z.object({
        name: z.string(),
        calories: z.number(),
      }),
      execute: async ({ name, calories }) => {
        const result = {
          name,
          calories,
        };
        console.log({ result });

        return result;
      },
    }),
  },
  maxSteps: 5,
});

console.log(result);
