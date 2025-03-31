import { generateObject, generateText } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const geminiModel = google("gemini-2.0-flash-001");

const firstResponse = await generateObject({
  model: geminiModel,
  system:
    "You are a first point of contact for a loan company. Your job is to turn client conversation into loan application.",
  schema: z.object({
    name: z.string(),
    loan_amount: z.number(),
    loan_time_in_months: z.number(),
    monthly_income: z.number(),
  }),
  messages: [
    {
      role: "user",
      content: `
    Hi! My name is Kewin. 
    I'd like to ask for a loan. 
    I need 2000$. 
    I can pay it back in a year. 
    My salary is 3000$ a month
    `,
    },
  ],
});

console.log(firstResponse.object);

const gateResponse = await generateObject({
  model: geminiModel,
  system:
    "You are a loan specialist. Based on the given json file with client data, your job is to decide if a client can be further processed.",
  schema: z.object({
    is_client_accepted: z.boolean(),
    denial_reason: z
      .string()
      .optional()
      .describe("If client is rejected, you need to give a reason."),
  }),
  messages: [{ role: "user", content: JSON.stringify(firstResponse.object) }],
});

console.log(gateResponse.object);

if (gateResponse.object.is_client_accepted === true) {
  const summaryResponse = await generateText({
    model: geminiModel,
    system:
      "You are a finicial specialist you job is to create an in depth summary of the user details",

    messages: [
      {
        role: "user",
        content: `${JSON.stringify(firstResponse.object)} ${JSON.stringify(
          gateResponse.object
        )}`,
      },
    ],
  });
  console.log(summaryResponse.text);
}
