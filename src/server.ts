import {
  experimental_createMCPClient as createMCPClient,
  generateText,
} from "ai";
import { groq } from "@ai-sdk/groq";

async function runRedisCommand() {
  const mcpClient = await createMCPClient({
    transport: {
      type: "sse",
      url: "https://router.mcp.so/sse/u1b691m8kplv2g",
    },
  });

  try {
    const redistools = await mcpClient.tools();

    const redisTool = Object.keys(redistools);

    if (!redisTool) {
      console.error("Redis MCP tool not found.");
      return;
    }

    const tools = { ...redistools };
    const response = await generateText({
      model: groq("deepseek-r1-distill-qwen-32b"),
      tools,
      messages: [
        {
          role: "user",
          content: `LRANGE 883764656af9425bb5fbeb537c14ab7a 0 -1`,
        },
      ],
    });

    console.log(response.text);
  } catch (error) {
    console.error("Error using Redis MCP tool:", error);
  } finally {
    await mcpClient.close();
  }
}

runRedisCommand();
