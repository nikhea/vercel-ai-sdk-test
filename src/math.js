import { google } from "@ai-sdk/google";
import { generateText, tool } from "ai";
import "dotenv/config";
import { z } from "zod";

import * as mathjs from "mathjs";

const { toolCalls } = await generateText({
  model: google("gemini-2.0-flash-lite-preview-02-05", {
    structuredOutputs: true,
  }),
  tools: {
    calculate: tool({
      description:
        "A tool for evaluating mathematical expressions. Example expressions: " +
        "'1.2 * (2 + 4.5)', '12.7 cm to inch', 'sin(45 deg) ^ 2'.",
      parameters: z.object({ expression: z.string() }),
      execute: async ({ expression }) => mathjs.evaluate(expression),
    }),
    // answer tool: the LLM will provide a structured answer
    answer: tool({
      description: "A tool for providing the final answer.",
      parameters: z.object({
        steps: z.array(
          z.object({
            calculation: z.string(),
            reasoning: z.string(),
          })
        ),
        answer: z.string(),
      }),
      // no execute function - invoking it will terminate the agent
    }),
  },
  toolChoice: "required",
  maxSteps: 10,
  system:
    "You are solving math problems. " +
    "Reason step by step. " +
    "Use the calculator when necessary. " +
    "The calculator can only do simple additions, subtractions, multiplications, and divisions. " +
    "When you give the final answer, provide an explanation for how you got it.",
  prompt:
    "A taxi driver earns $9461 per 1-hour work. " +
    "If he works 12 hours a day and in 1 hour he uses 14-liters petrol with price $134 for 1-liter. " +
    "How much money does he earn in one day?",
});

console.log(`FINAL TOOL CALLS: ${JSON.stringify(toolCalls, null, 2)}`);
