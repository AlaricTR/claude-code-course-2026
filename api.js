const fs = require("node:fs"); //import needed dependencies equivalent to #include
const path = require("node:path");
const Anthropic = require("@anthropic-ai/sdk");
const { toolDefinitions, handleToolCall } = require("./tools"); //destructuring ./tools module into submodules

const MODEL = "claude-sonnet-4-6";

const MAX_ITERATIONS = 10;

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }); //this sets up the client using th API key same as "import x as y"

function loadSystemPrompt() { //this gives basic context to claude, and which tools it can use
  const base =
    "You are devlens, an AI assistant embedded in the user's project directory. " +
    "You have tools for reading files, writing files, running shell commands, " +
    "and listing directories. When the user asks a question that depends on the " +
    "contents of the codebase, use the tools — do not guess.";

  const claudeMdPath = path.resolve(process.cwd(), "CLAUDE.md");
  if (!fs.existsSync(claudeMdPath)) return base;

  const claudeMd = fs.readFileSync(claudeMdPath, "utf-8");
  return `${base}\n\n--- Project context (from CLAUDE.md) ---\n${claudeMd}`; //backticks make this the functional equivalent of an f-string
}
async function chat(userMessage, history) { //this is the loop that the user uses to chat wit claude

  const messages = [...history, { role: "user", content: userMessage }]; //appends new message to history and sends it all, does this by copying the existing history into a new array and appending the new message
  const trace = [];
  for (let i = 0; i < MAX_ITERATIONS; i++) { //iterates throughm potentially with more tools
    const response = await client.messages.create({ //this is a "Promise"
      model: MODEL,
      max_tokens: 4096,
      system: loadSystemPrompt(),
      tools: toolDefinitions, //what the agent is allowed to use
      messages, //this is the full conversation with most recent user input added
    });

    messages.push({ role: "assistant", content: response.content }); //this adds the model's response to the conversation

    for (const block of response.content) {
      if (block.type === "text") {
        trace.push({ type: "text", text: block.text });
      } else if (block.type === "tool_use") {
        trace.push({ type: "tool_use", id: block.id, name: block.name, input: block.input });
      }
    }

    const toolUses = response.content.filter((b) => b.type === "tool_use"); //this shows the user what tools claude used, if any. If none are used, just return the text block answer
    if (toolUses.length === 0) { //only if no tools are used.
      const reply = response.content
        .filter((b) => b.type === "text")
        .map((b) => b.text)
        .join("\n");
      return { reply, history: messages, trace, iterations: i + 1 };
    }

    const toolResults = []; //collects the results of tool usage
    for (const block of toolUses) {
      const result = await handleToolCall(block.name, block.input);
      toolResults.push({ type: "tool_result", tool_use_id: block.id, content: result });
      trace.push({ type: "tool_result", tool_use_id: block.id, name: block.name, content: result });
    }
    messages.push({ role: "user", content: toolResults });
  }

  return { //thus returns if the model tries to loop back more than 10 times without answering in plain text
    reply: `(Stopped after ${MAX_ITERATIONS} iterations — Claude kept asking for tools. Task may be incomplete. Raise MAX_ITERATIONS in api.js if this is expected.)`,
    history: messages,
    trace,
    iterations: MAX_ITERATIONS,
  };
}

module.exports = { chat }; //this exports the entire chat 
