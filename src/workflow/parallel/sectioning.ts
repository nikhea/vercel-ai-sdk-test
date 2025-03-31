import { generateObject, generateText, tool, type CoreMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const model = google("gemini-2.0-flash-001");

const userMessage: CoreMessage = {
  role: "user",
  content: `
	  In this article we will cover AI Agents workflows. We hope to provide an explanation, but be aware, that in-depth explanation
    would be too long for all of them. So this time, we will focus on the idea behind workflows. In future, we can make separate articles
    and implement a more complex case, or even a working application for each of them.
  `,
};

const germanResponse = generateText({
  model,
  system:
    "You are German Translator. Your job is to translate text received from user, and translate it to German. Respond only with translation!",
  messages: [userMessage],
});

const spanishResponse = generateText({
  model,
  system:
    "You are Spanish Translator. Your job is to translate text received from user, and translate it to Spanish. Respond only with translation!",
  messages: [userMessage],
});

const polishResponse = generateText({
  model,
  system:
    "You are Polish Translator. Your job is to translate text received from user, and translate it to Polish. Respond only with translation!",
  messages: [userMessage],
});

const [german, spanish, polish] = await Promise.all([
  germanResponse,
  spanishResponse,
  polishResponse,
]);

console.log({
  german: german.text,
  spanish: spanish.text,
  polish: polish.text,
});

const aggregateResponse = await generateObject({
  model,
  system: `You are tasked with aggregating translations of an article. 
  You can provide additional tweaks and fixes to formatting or translation. 
  You will receive a message with original, and then translations done with previous agents`,
  schema: z.object({
    original_text: z.string(),
    german_translation: z.string(),
    spanish_translation: z.string(),
    polish_translation: z.string(),
  }),
  messages: [
    {
      role: "user",
      content: `
	      original: ${userMessage.content}
	      ---
	      german: ${german.text}
	      ---
	      spanish: ${spanish.text}
	      ---
	      polish: ${polish.text}
	    `,
    },
  ],
});

console.log({ translations: aggregateResponse.object });
