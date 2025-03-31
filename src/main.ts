import { google } from "@ai-sdk/google";
import { streamText } from "ai";
import { createUsers, getUserByEmail, getAllUser } from "./tools/users.tools";
import readline from "readline";
import fs from "fs";
import path from "path";
import { SearchGoogle } from "./tools/search.tools";

// Create readline interface
const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

// Initialize model
const model = google("gemini-2.0-flash-001");

// Memory management
interface Memory {
  conversations: Array<{
    role: "user" | "assistant";
    content: string;
    timestamp: string;
  }>;
  lastUpdated: string;
}

// File path for storing memory
const MEMORY_FILE = path.join(process.cwd(), "assistant-memory.json");

// Initialize or load memory
const initMemory = (): Memory => {
  try {
    if (fs.existsSync(MEMORY_FILE)) {
      const data = fs.readFileSync(MEMORY_FILE, "utf8");
      return JSON.parse(data);
    }
  } catch (error) {
    console.log("\n⚠️ Could not load memory file, creating new memory");
  }

  return {
    conversations: [],
    lastUpdated: new Date().toISOString(),
  };
};

let memory = initMemory();

// Save memory to file
const saveMemory = () => {
  memory.lastUpdated = new Date().toISOString();
  try {
    fs.writeFileSync(MEMORY_FILE, JSON.stringify(memory, null, 2));
  } catch (error: any) {
    console.error("\n❌ Error saving memory:", error.message || error);
  }
};

// Add conversation to memory
const addToMemory = (role: "user" | "assistant", content: string) => {
  memory.conversations.push({
    role,
    content,
    timestamp: new Date().toISOString(),
  });
  saveMemory();
};

// Get recent conversation history formatted for AI context
const getContextForPrompt = (limit = 10) => {
  const recentConversations = memory.conversations
    .slice(-limit)
    .map((c) => `${c.role === "user" ? "User" : "Assistant"}: ${c.content}`)
    .join("\n\n");

  return recentConversations
    ? `Here's our recent conversation history:\n\n${recentConversations}\n\nPlease consider this context in your response.`
    : "";
};

// Process prompt with memory
const processPrompt = async (prompt: string) => {
  console.log("\n🔄 Processing your request...\n");

  // Add user input to memory
  addToMemory("user", prompt);

  try {
    // Get context from memory
    const context = getContextForPrompt();
    const contextualPrompt = context
      ? `${context}\n\nNew request: ${prompt}`
      : prompt;

    const result = streamText({
      model,
      prompt: contextualPrompt,
      tools: { createUsers, getUserByEmail, getAllUser, SearchGoogle },
      maxSteps: 5, // allow up to 5 steps
    });

    let fullResponse = "";
    for await (const chunk of result.textStream) {
      process.stdout.write(chunk);
      fullResponse += chunk;
    }

    // Add assistant response to memory
    addToMemory("assistant", fullResponse);

    // console.log(result);

    (await result.steps).map((step) => {
      const { toolCalls, toolResults } = step;
      if (Array.isArray(toolCalls) && Array.isArray(toolResults)) {
        toolCalls.forEach((toolCall, index) => {
          console.log(`Tool Call ${index + 1}:`, toolCall);
          const toolResult = toolResults[index];
          if (toolResult) {
            // console.log(`Tool Result ${index + 1}:`, toolResult);
          } else {
            // console.log(`No result found for Tool Call ${index + 1}`);
          }
        });
      } else {
        console.log("No tool calls or results found in this step.");
      }
    });

    return fullResponse;
  } catch (error: any) {
    console.error("\n❌ Error:", error.message || error);
    return null;
  }
};

// Memory commands
const handleMemoryCommands = (input: string): boolean => {
  if (input.toLowerCase() === "clear memory") {
    memory.conversations = [];
    saveMemory();
    console.log("\n🧹 Memory cleared successfully");
    return true;
  }

  if (input.toLowerCase() === "show memory") {
    console.log("\n📜 Memory Contents:");
    if (memory.conversations.length === 0) {
      console.log("  Memory is empty");
    } else {
      memory.conversations.forEach((item, index) => {
        const shortContent =
          item.content.length > 50
            ? `${item.content.substring(0, 50)}...`
            : item.content;
        console.log(`  ${index + 1}. ${item.role}: ${shortContent}`);
      });
      console.log(`\n  Total entries: ${memory.conversations.length}`);
      console.log(`  Last updated: ${memory.lastUpdated}`);
    }
    return true;
  }

  return false;
};

// Main app
const startApp = () => {
  console.log("\n✨✨✨ AI Assistant Terminal App ✨✨✨");
  console.log("Type 'exit' or 'quit' to close the application");
  console.log("Type 'help' for available commands\n");

  const promptUser = () => {
    rl.question("\n👤 > ", async (input) => {
      if (input.toLowerCase() === "exit" || input.toLowerCase() === "quit") {
        console.log("\n👋 Goodbye! Closing the application...");
        rl.close();
        return;
      }

      if (input.toLowerCase() === "help") {
        console.log("\n📚 Available commands:");
        console.log("  • create user <email> <password> : Create a new user");
        console.log("  • clear memory : Erase conversation history");
        console.log("  • show memory : Display conversation history");
        console.log("  • exit/quit : Close the application");
        console.log("  • help : Show this help menu");
        console.log("  • Any other text will be processed as a general prompt");
        promptUser();
        return;
      }

      // Handle memory commands
      if (handleMemoryCommands(input)) {
        promptUser();
        return;
      }

      // Handle user creation
      if (input.toLowerCase().startsWith("create user")) {
        const parts = input.split(" ");
        if (parts.length >= 4) {
          const email = parts[2];
          const password = parts[3];
          console.log(`\n👥 Creating user: ${email}`);
          await processPrompt(
            `create a new user with email ${email} and password ${password}`
          );
        } else {
          console.log("\n⚠️ Usage: create user <email> <password>");
        }
        promptUser();
        return;
      }

      // Process general prompts
      if (input.trim()) {
        await processPrompt(input);
      }
      promptUser();
    });
  };

  promptUser();
};

startApp();
