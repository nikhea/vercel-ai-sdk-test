import { google } from "@ai-sdk/google";
import { generateText, generateObject, tool, type CoreMessage } from "ai";
import { z } from "zod";

/* -------------------------------------------------------------------------
   Model Configuration
   ------------------------------------------------------------------------- */
// Instantiate Gemini models.
// geminiModel is used for general tasks, and geminiModelSearch (with search grounding)
// is used for research and planning.
// const geminiModel = google("gemini-2.0-flash-thinking-exp-01-21");
// const geminiModelSearch = google("gemini-2.0-flash-thinking-exp-01-21", {
//   useSearchGrounding: true,
// });
const geminiModel = google("gemini-2.0-flash-001");
const geminiModelSearch = google("gemini-2.0-flash-001", {
  useSearchGrounding: true,
});

/* -------------------------------------------------------------------------
   Tool Definitions
   ------------------------------------------------------------------------- */
// Weather Forecast Tool: Returns current weather details and forecast.
const weatherTool = tool({
  description: "Get current weather and forecast details for a location",
  parameters: z.object({
    location: z.string().describe("City name and optionally country"),
    days: z
      .number()
      .optional()
      .describe("Number of days for forecast (default is 3)"),
  }),
  execute: async ({ location, days = 3 }) => {
    // This is a placeholder; in production, call a real weather API.
    console.log(`Fetching weather for ${location} for ${days} day(s)...`);
    return {
      location,
      current: {
        temperature: 72,
        conditions: "Partly Cloudy",
        humidity: 65,
        windSpeed: 8,
      },
      forecast: Array.from({ length: days }, (_, i) => ({
        day: i + 1,
        highTemp: 70 + Math.floor(Math.random() * 10),
        lowTemp: 55 + Math.floor(Math.random() * 10),
        conditions: ["Sunny", "Partly Cloudy", "Rainy", "Cloudy"][
          Math.floor(Math.random() * 4)
        ],
      })),
    };
  },
});

// Research Tool: Gathers information on a given topic.
const researchTool = tool({
  description: "Research a specific topic and provide detailed information",
  parameters: z.object({
    query: z.string().describe("The topic or question to research"),
    depth: z
      .enum(["basic", "detailed", "comprehensive"])
      .optional()
      .describe("Level of detail required"),
  }),
  execute: async ({ query, depth = "detailed" }) => {
    console.log(`Researching "${query}" at a ${depth} level...`);
    // Use the Gemini model with search grounding to simulate a research call.
    const research = await generateText({
      model: geminiModelSearch,
      system: `You are a research assistant. Provide ${depth} information about the query. Cite sources if applicable.`,
      prompt: query,
    });
    return {
      query,
      depth,
      results: research.text,
      sources: ["[Placeholder for real sources]"],
    };
  },
});

// Problem Solver Tool: Provides a step-by-step solution for analytical tasks.
const solverTool = tool({
  description: "Solve a given problem with detailed, step-by-step reasoning",
  parameters: z.object({
    problem: z.string().describe("The problem statement"),
    type: z
      .enum(["mathematical", "logical", "analytical"])
      .optional()
      .describe("Type of problem"),
  }),
  execute: async ({ problem, type = "mathematical" }) => {
    console.log(`Solving ${type} problem: ${problem}`);
    // Use the standard Gemini model for problem-solving.
    const solution = await generateText({
      model: geminiModel,
      system: `You are an expert in ${type} problem-solving. Provide a clear, step-by-step solution.`,
      prompt: problem,
    });
    const solutionLines = solution.text.split("\n");
    const summary = solutionLines.slice(-2).join("\n");
    return {
      problem,
      type,
      stepByStepSolution: solution.text,
      summary,
    };
  },
});

/* -------------------------------------------------------------------------
   Agent Definitions
   ------------------------------------------------------------------------- */
// Each specialized agent has a set of tools and a system prompt.
// WeatherForecaster and Solver use the standard Gemini model, while Researcher uses the grounded model.
const weatherAgent = {
  name: "WeatherForecaster",
  description: "Provides current weather data and forecasts",
  model: geminiModel,
  tools: { getWeather: weatherTool },
  system:
    "You are a weather expert. Use your tools to analyze weather data and provide accurate forecasts.",
};

const researchAgent = {
  name: "Researcher",
  description: "Gathers and synthesizes information on a wide range of topics",
  model: geminiModelSearch,
  tools: { research: researchTool },
  system:
    "You are a research specialist. Use available tools to gather, verify, and organize information.",
};

const solverAgent = {
  name: "Solver",
  description: "Breaks down complex problems and solves them step-by-step",
  model: geminiModel,
  tools: { solve: solverTool },
  system:
    "You are a problem-solving expert. Use your tools to provide detailed and logical solutions to the given problems.",
};

/* -------------------------------------------------------------------------
   Orchestrator Setup
   ------------------------------------------------------------------------- */
// The orchestrator coordinates the specialized agents. Its system prompt outlines each agent's role.
const orchestratorSystem = `
You are the orchestrator agent. Your job is to:
1. Understand the user's query.
2. Decide which specialized agents (WeatherForecaster, Researcher, Solver) should be involved.
3. Formulate clear, detailed tasks for each selected agent.
4. Specify if tasks should run sequentially or in parallel.
Provide a summary of your understanding, list the agents to involve, outline specific tasks with parameters, and explain your reasoning.
`;

/* -------------------------------------------------------------------------
   Multi-Agent Workflow Execution
   ------------------------------------------------------------------------- */
async function runMultiAgentSystem(userInput: string) {
  console.log("User Query:", userInput);

  // Step 1: Orchestrator generates an execution plan using the grounded Gemini model.
  const orchestrationPlan = await generateObject({
    model: geminiModelSearch,
    system: orchestratorSystem,
    schema: z.object({
      understanding: z.string().describe("Summary of the user query"),
      agents_to_use: z
        .array(z.enum(["WeatherForecaster", "Researcher", "Solver"]))
        .describe("Agents selected for this task"),
      tasks: z.array(
        z.object({
          agent: z.enum(["WeatherForecaster", "Researcher", "Solver"]),
          task_description: z.string(),
          required_parameters: z.record(z.string()).optional(),
        })
      ),
      execution_plan: z
        .enum(["sequential", "parallel", "conditional"])
        .describe("Execution strategy for tasks"),
      reason: z.string().describe("Reasoning behind the orchestration plan"),
    }),
    prompt: userInput,
  });

  console.log(
    "Orchestration Plan:",
    JSON.stringify(orchestrationPlan.object, null, 2)
  );

  // Step 2: Execute tasks based on the orchestration plan.
  const results: Record<string, any> = {};
  if (orchestrationPlan.object.execution_plan === "parallel") {
    const taskPromises = orchestrationPlan.object.tasks.map(async (task) => {
      return executeAgentTask(task, userInput);
    });
    const taskResults = await Promise.all(taskPromises);
    orchestrationPlan.object.tasks.forEach((task, index) => {
      results[task.agent] = taskResults[index];
    });
  } else {
    for (const task of orchestrationPlan.object.tasks) {
      results[task.agent] = await executeAgentTask(task, userInput);
    }
  }

  // Step 3: Synthesize a final response by integrating outputs from all agents.
  const finalResponse = await generateText({
    model: geminiModelSearch,
    system: `
      You are a synthesis agent. Your task is to integrate results from multiple specialized agents
      into a comprehensive and coherent answer for the user.
    `,

    messages: [
      {
        role: "user",
        content: `
          Original Query: ${userInput}
          Orchestration Plan: ${JSON.stringify(
            orchestrationPlan.object,
            null,
            2
          )}
          Agent Outputs: ${JSON.stringify(results, null, 2)}
          Please synthesize these details into a final, clear response.
        `,
      },
    ],
  });

  return {
    orchestrationPlan: orchestrationPlan.object,
    agentResults: results,
    finalResponse: finalResponse.text,
  };
}

/* -------------------------------------------------------------------------
   Helper: Execute Task for a Specific Agent
   ------------------------------------------------------------------------- */
async function executeAgentTask(task: any, originalUserQuery: string) {
  console.log(`Executing task for ${task.agent}: ${task.task_description}`);
  let agent;
  switch (task.agent) {
    case "WeatherForecaster":
      agent = weatherAgent;
      break;
    case "Researcher":
      agent = researchAgent;
      break;
    case "Solver":
      agent = solverAgent;
      break;
    default:
      throw new Error(`Unknown agent: ${task.agent}`);
  }

  // The agent plans which tool to use.
  const agentPlan = await generateObject({
    model: agent.model,
    system: `${
      agent.system
    } Plan your response by selecting an appropriate tool from: ${Object.keys(
      agent.tools
    ).join(", ")}.`,
    schema: z.object({
      tool_to_use: z.string().describe("The chosen tool for this task"),
      parameters: z.record(z.any()).describe("Parameters to pass to the tool"),
      reasoning: z.string().describe("Rationale for the chosen approach"),
    }),
    messages: [
      {
        role: "user",
        content: `
          Original Query: ${originalUserQuery}
          Task Description: ${task.task_description}
          Available Tools: ${Object.keys(agent.tools).join(", ")}
          Provide your tool selection and parameters.
        `,
      },
    ],
  });

  console.log(`${task.agent} Plan:`, JSON.stringify(agentPlan.object, null, 2));

  // Execute the chosen tool.
  const toolName = agentPlan.object.tool_to_use;
  // @ts-ignore
  const selectedTool = agent.tools[toolName];
  if (!selectedTool) {
    throw new Error(`Tool ${toolName} not found for agent ${agent.name}`);
  }
  const toolResult = await selectedTool.execute(agentPlan.object.parameters);

  // Interpret and summarize the tool's results.
  const interpretation = await generateText({
    model: agent.model,
    system: agent.system,
    messages: [
      { role: "user", content: task.task_description },
      {
        role: "assistant",
        content: `I will use the ${toolName} tool to address the task.`,
      },
      {
        role: "user",
        content: `
          Here are the tool results:
          ${JSON.stringify(toolResult, null, 2)}
          Interpret these results and provide your final response for the task.
        `,
      },
    ],
  });

  return {
    tool_used: toolName,
    tool_parameters: agentPlan.object.parameters,
    tool_result: toolResult,
    agent_interpretation: interpretation.text,
  };
}

/* -------------------------------------------------------------------------
   Entry Point: Handle User Query
   ------------------------------------------------------------------------- */
export async function handleUserQuery(userQuery: string) {
  try {
    const result = await runMultiAgentSystem(userQuery);
    return {
      success: true,
      response: result.finalResponse,
      details: {
        plan: result.orchestrationPlan,
        results: result.agentResults,
      },
    };
  } catch (error) {
    console.error("Error in multi-agent system:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

// await handleUserQuery("Solve the equation: 3x^2 + 7x - 2 = 0");

(async () => {
  const result = await handleUserQuery(
    "Weather in Paris and top 3 attractions?"
  );
  console.log(result.response);
})();
// Example queries (uncomment to test):
// "What's the weather in New York today and should I bring an umbrella?"
// "Research the impact of climate change on coastal cities and explain which cities might be at risk in the next 20 years"
// "Solve the equation: 3x^2 + 7x - 2 = 0"
// "Plan a trip to Tokyo next week: provide the weather forecast and three must-see attractions"
