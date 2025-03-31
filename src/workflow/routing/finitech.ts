import { generateObject, generateText, tool } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";
import { getAllUser } from "../../tools/users.tools";
import { SearchGoogle } from "../../tools/search.tools";

const model = google("gemini-2.0-flash-001");

const agentTypes = [
  "technical",
  "account",
  "finance",
  "search",
  "unknown",
] as const;

// what is the current trending accounting apps add the date of there launch of each apps.
// Hi! I want to cancel my subscription now! I am very unhappy and mad and internet is bad how do we fix it
const prompt = `
	      Hi! I want to cancel my subscription now! I am very unhappy and mad and internet is bad how do we fix it, get all users and list them out 

      `;

const agents = {
  technical: {
    system:
      "You are a tech specialist. Clients call you with technical problems.",
    tools: { getAllUser },
  },
  account: {
    system:
      "You are an account manager. Clients call you with topics related to their account.",
    tools: { getAllUser },
  },
  finance: {
    system:
      "You are finance specialist. Clients call you with finance related topics.",
    tools: { getAllUser },
  },
  search: {
    system:
      "You Get real-time results based on the provided query recent technical, account, finance related topics on .",
    tools: { SearchGoogle },
  },
};

const routingResponse = await generateObject({
  model,
  system: `You are the initial customer support contact point.
  Your job is to correctly categorize customer issues and route them to the appropriate department.
  Analyze the customer's message carefully to determine which department would be best equipped to handle their issue. check your confidence level between 1 to 10 for the right agents, and the customer sentiment ["positive", "neutral", "negative", "urgent"].
  `,
  schema: z.object({
    agent_type: z.enum(agentTypes),
    confidence: z.number().min(1).max(10),
    customer_sentiment: z.enum(["positive", "neutral", "negative", "urgent"]),
  }),
  messages: [
    {
      role: "user",
      content: prompt,
    },
  ],
});

console.log(routingResponse.object);

if (routingResponse.object.agent_type === "unknown") {
  console.log(
    "I couldn't determine how to handle your request. Could you provide more details?"
  );

  process.exit(1);
}

console.log(agents[routingResponse.object.agent_type]);

const response = await generateText({
  model,
  system: agents[routingResponse.object.agent_type].system,
  messages: [
    {
      role: "user",
      content: prompt,
    },
  ],
  tools: agents[routingResponse.object.agent_type].tools,
  maxSteps: 5,
  maxRetries: 5,
});

console.log(response.text);
