import dotenv from "dotenv";
import { z } from "zod";
import { streamText, generateText, generateObject } from "ai";
import { google } from "@ai-sdk/google";
import { createInterface } from "readline";

dotenv.config();

const schema = z.object({
  input: z
    .string()
    .describe("The raw user query input provided for blog post planning."),
  output: z
    .string()
    .optional()
    .describe("The final generated blog post after editing."),
  topic: z
    .string()
    .optional()
    .describe(
      "A concise topic extracted from the user query for the blog post."
    ),

  notes: z
    .array(z.string())
    // .optional()
    .describe("List of extracted user concerns or instructions"),
  plan: z
    .string()
    .optional()
    .describe(
      "A detailed content plan for the blog post, outlining structure and key points."
    ),
  draft: z
    .string()
    .optional()
    .describe("The initial draft of the blog post before final editing."),
  error: z
    .string()
    .optional()
    .describe(
      "Error message if the input query doesn’t make sense or needs clarification"
    ),
});

const geminiModel = google("gemini-2.0-flash-thinking-exp-01-21");

const geminiModelSearch = google("gemini-2.0-flash-thinking-exp-01-21", {
  useSearchGrounding: true,
});

const geminiModelSearchx = google("gemini-2.0-flash-001");

export type TBlogschema = z.infer<typeof schema>;

async function preprocess(state: TBlogschema) {
  console.log("\n\nGenerating title post...");

  const { object: parsed } = await generateObject({
    model: geminiModelSearchx,
    schema: schema.pick({ topic: true, notes: true }),
    prompt: state.input,
    schemaName: "Blog",
    schemaDescription: "Schema for blog post planning and generation.",
    system: `Rewrite the user query into a clear and focused blog post topic while considering past context. Notes contain user complaints or additional guidance.
             - **Previous Topic:** ${state.topic || "N/A"}
             - **Previous Notes:** ${state.notes.join(", ") || "N/A"}
             - **User Query:** ${state.input || "empty"}

            ### **Instructions:**
            - **Derive a single, concise blog topic** from the user query.
            - **Maintain relevance** to any past topic (if applicable).
            - **Extract key concerns** from notes to refine the topic.

            ### **Expected Output (Valid JSON Format):**

            {
               "topic": "A single, well-defined blog post topic",
                "notes": ["List of additional instructions or guidance extracted from the input."]
            } `,

    maxRetries: 5,
  });

  if ("error" in parsed) {
    return { ...state, output: parsed.error };
  }

  console.log("\n\nfinihed Generating title post...", { topic: parsed.topic });

  return { ...state, notes: parsed.notes ?? [], topic: parsed.topic };
}

async function planner(state: TBlogschema) {
  //   console.log(state, state.topic);
  console.log("\n\nGenerating planner content...");

  const { text: plan } = await generateText({
    model: geminiModelSearch,
    prompt: `You are a Content Planner. Write a content plan for "${
      state.topic
    }" in Markdown format.
        Objectives:
        1. Prioritize latest trends, key players, and noteworthy news.
        2. Identify target audience, considering interests and pain points.
        3. Develop a detailed content outline including introduction, key points, and call to action.
        4. Include SEO keywords and relevant sources.

        Notes: ${state.notes.join(", ")}

        Provide a structured output covering the mentioned sections.`,
    maxSteps: 5,
  });
  console.log("\n\nfinished Generating planner content...", { plan });

  return { ...state, plan };
}

async function writer(state: TBlogschema) {
  console.log("\n\nGenerating writing content...");

  const { text: draft } = await generateText({
    model: geminiModel,
    prompt: `You are a Content Writer. Write a compelling blog post based on this plan:
    ${state.plan}

    Objectives:
    - Engaging introduction
    - Insightful body paragraphs (2-3 per section)
    - Properly named sections/subtitles
    - Summarizing conclusion
    - Format: Markdown

    Notes: ${state.notes.join(", ")}

    Ensure the content flows naturally, incorporates SEO keywords, and is well-structured.`,
  });

  console.log("\n\nfinished Generating writing content...", { draft });

  return { ...state, draft };
}

// async function editor(state) {
//   const { text: output } = await generateText({
//     model: geminiModel,
//     prompt: `You are an Editor. Transform this draft blog post to a final version:
//     ${state.draft}

//     Objectives:
//     - Fix grammatical errors
//     - Apply journalistic best practices

//     Notes: ${state.notes.join(", ")}

//     IMPORTANT: The final version must not contain any editor's comments.`,
//   });

//   return { ...state, output };
// }

async function editor(state: TBlogschema) {
  console.log("\n\nGenerating editor transformation...");

  const { textStream, text } = streamText({
    model: geminiModel,
    prompt: `You are an Editor. Transform this draft blog post to a final version:
      ${state.draft}
  
      Objectives:
      - Fix grammatical errors
      - Apply journalistic best practices
  
      Notes: ${state.notes.join(", ")}
  
      IMPORTANT: The final version must not contain any editor's comments.`,
  });

  let output = "";
  for await (const chunk of textStream) {
    process.stdout.write(chunk); // Print each chunk as it arrives
    output += chunk; // Accumulate the full text
  }
  console.log(); // Add a newline after streaming
  //   return { ...state, text };
  // Return the complete text to store in state.output
}

async function blogWriterWorkflow(input: any, previousState: any) {
  let state: any = {
    input,
    notes: previousState?.notes || [],
    topic: previousState?.topic,
  };

  state = await preprocess(state);
  if (state.output) return state;

  state = await planner(state);
  state = await writer(state);
  state = await editor(state);

  return state;
}

async function main() {
  const rl = createInterface({
    input: process.stdin,
    output: process.stdout,
  });

  let previousState;

  while (true) {
    const input: string = await new Promise((resolve) =>
      rl.question('Enter your query (or "exit" to quit): ', resolve)
    );

    if (input.toLowerCase() === "exit") break;

    console.log("Processing your request...");

    const stream = streamText({
      model: geminiModel,
      prompt: input,
      onChunk: (chunk: any) => {
        if (chunk.type === "text-delta") {
          process.stdout.write(chunk.text);
        }
      },
    });

    console.log("\n\nGenerating blog post...");

    const result = await blogWriterWorkflow(input, previousState);
    // previousState = result;

    console.log("\nFinal Blog Post:");
    // console.log(result);
  }

  rl.close();
}

main().catch(console.error);
