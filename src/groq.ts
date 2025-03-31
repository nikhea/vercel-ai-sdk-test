import { groq } from "@ai-sdk/groq";
import { openrouter } from "@openrouter/ai-sdk-provider";
import { generateText, streamText } from "ai";

const result = await generateText({
  model: groq("qwen-qwq-32b"),
  providerOptions: {
    groq: { reasoningFormat: "parsed" },
  },
  prompt: 'How many "r"s are in the word "strawberry"?',
});

// console.log({ text: result.text, reasoning: result.reasoning });
// console.log(result.text);

console.log(result.reasoning);

// async function streamReasoning() {
//   const result = streamText({
//     model: groq("deepseek-r1-distill-qwen-32b"),
//     prompt: 'How many "r"s are in the word "strawberry"?',
//     providerOptions: {
//       groq: { reasoningFormat: "parsed" },
//     },
//     maxSteps: 10,

//     onStepFinish: (step) => {
//       console.log("\nStep finished:", step);
//     },
//   });

//   for await (const textPart of (await result).textStream) {
//     process.stdout.write(textPart);
//   }
// }

// streamReasoning().catch(console.error);
