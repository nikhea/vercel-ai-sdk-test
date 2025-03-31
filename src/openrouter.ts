import { createOpenRouter, openrouter } from "@openrouter/ai-sdk-provider";
import { streamText } from "ai";
import { z } from "zod";
import { google } from "@ai-sdk/google";
import { ollama } from "ollama-ai-provider";
// export const openrouter = createOpenRouter({
//   apiKey: process.env.OPENROUTER_API_KEY!,
// });
// model: openrouter("qwen/qwen-2.5-72b-instruct:free"),
// model: openrouter("microsoft/phi-3-medium-128k-instruct:free"),

async function generateText() {
  const result = streamText({
    // model: ollama("llama3.2:latest"),
    // model: openrouter("meta-llama/llama-3.2-3b-instruct:free",{
    //   extraBody:{

    //   }
    // }),

    model: openrouter("google/gemini-2.0-flash-thinking-exp:free"),

    messages: [
      { role: "user", content: `How many 'a's are in the word strawberry?` },
    ],
    providerOptions: {
      openrouter: {
        reasoning: {
          max_tokens: 10,
        },
      },
    },
    // model: google("gemini-1.5-pro"),
    // prompt: `How many 'a's are in the word strawberry?`,
  });
  for await (const textPart of result.textStream) {
    process.stdout.write(textPart);
  }
}

generateText().catch(console.error);
// google/gemma-3-27b-it:free
