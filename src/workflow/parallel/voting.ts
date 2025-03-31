import { generateObject, type CoreMessage } from "ai";
import { google } from "@ai-sdk/google";
import { z } from "zod";

const model = google("gemini-2.0-flash-001");

// Original user message
const userMessage: CoreMessage = {
  role: "user",
  content: `
    In this article we will cover AI Agents workflows. We hope to provide an explanation, but be aware, that in-depth explanation
    would be too long for all of them. So this time, we will focus on the idea behind workflows. In future, we can make separate articles
    and implement a more complex case, or even a working application for each of them.
  `,
};

// Define schema for sentiment output
const sentimentSchema = z.object({
  sentiment: z.enum(["positive", "negative", "neutral"]),
});

// Define multiple system prompts for sentiment analysis
const systemPrompts = [
  "Determine the sentiment of the following text. Respond with 'positive', 'negative', or 'neutral'.",
  "Analyze the emotional tone of the text below. Classify it as 'positive', 'negative', or 'neutral'.",
  "What is the overall sentiment expressed in this text? Choose from 'positive', 'negative', or 'neutral'.",
];

// Create promises for each sentiment analysis task
const sentimentPromises = systemPrompts.map((system) =>
  generateObject({
    model,
    system,
    messages: [userMessage],
    schema: sentimentSchema,
  })
);

// Await all sentiment analysis results
const sentimentResults = await Promise.all(sentimentPromises);

// Extract sentiments from results
const sentiments = sentimentResults.map((result) => result.object.sentiment);
console.log({ sentiments });

// Count occurrences of each sentiment
const sentimentCounts = sentiments.reduce((acc, sentiment) => {
  acc[sentiment] = (acc[sentiment] || 0) + 1;
  return acc;
}, {} as Record<string, number>);

// Determine the final sentiment based on majority vote
const finalSentiment = Object.entries(sentimentCounts).reduce((a, b) =>
  b[1] > a[1] ? b : a
)[0];

console.log("Voting Result - Final Sentiment:", finalSentiment);
console.log("Sentiment Counts:", sentimentCounts);
