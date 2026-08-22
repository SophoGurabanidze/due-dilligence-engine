export interface AIMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

export interface AIResponse {
  content: string;
}

interface AskOptions {
  maxTokens?: number;
  json?: boolean;
}

function extractJsonText(raw: string): string {
  let cleaned = (raw ?? "").trim();
  if (cleaned.startsWith("```")) {
    cleaned = cleaned.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/, "");
  }
  const obj = cleaned.indexOf("{");
  const arr = cleaned.indexOf("[");
  let start = -1;
  if (obj === -1) start = arr;
  else if (arr === -1) start = obj;
  else start = Math.min(obj, arr);
  return start === -1 ? cleaned : cleaned.slice(start);
}

function repairTruncatedJson(text: string): string {
  try {
    JSON.parse(text);
    return text;
  } catch {
    // continue to repair
  }

  let inString = false;
  let escaped = false;
  const stack: string[] = [];
  for (const ch of text) {
    if (inString) {
      if (escaped) escaped = false;
      else if (ch === "\\") escaped = true;
      else if (ch === '"') inString = false;
      continue;
    }
    if (ch === '"') inString = true;
    else if (ch === "{") stack.push("}");
    else if (ch === "[") stack.push("]");
    else if (ch === "}" || ch === "]") stack.pop();
  }

  let repaired = text;
  if (inString) repaired += '"';
  repaired = repaired.replace(/,\s*$/, "");
  while (stack.length) repaired += stack.pop();
  return repaired;
}

function parseJsonLoose(raw: string): unknown {
  const extracted = extractJsonText(raw);
  try {
    return JSON.parse(extracted);
  } catch {
    return JSON.parse(repairTruncatedJson(extracted));
  }
}

function unwrapParsed<T>(parsed: unknown): T {
  if (
    parsed &&
    typeof parsed === "object" &&
    !Array.isArray(parsed) &&
    Object.keys(parsed as object).length === 1 &&
    "findings" in parsed &&
    Array.isArray((parsed as { findings: unknown }).findings)
  ) {
    return (parsed as { findings: T }).findings;
  }
  return parsed as T;
}

async function callOpenRouter(
  messages: AIMessage[],
  apiKey: string,
  model: string,
  options: AskOptions = {}
): Promise<AIResponse> {
  const body: Record<string, unknown> = {
    model,
    messages,
    temperature: 0.2,
    max_tokens: options.maxTokens ?? 8192,
    reasoning: { effort: "low" },
  };
  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
      "HTTP-Referer": "https://due-diligence-engine.local",
      "X-Title": "Due Diligence Engine",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenRouter error ${res.status}: ${text}`);
  }

  const data = await res.json();
  const message = data.choices?.[0]?.message;
  const content = message?.content || message?.reasoning || "";
  return { content };
}

async function callOpenAI(
  messages: AIMessage[],
  apiKey: string,
  options: AskOptions = {}
): Promise<AIResponse> {
  const body: Record<string, unknown> = {
    model: "gpt-4o",
    messages,
    temperature: 0.2,
    max_tokens: options.maxTokens ?? 8192,
  };
  if (options.json) {
    body.response_format = { type: "json_object" };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { content: data.choices[0].message.content };
}

async function callAnthropic(
  messages: AIMessage[],
  apiKey: string,
  options: AskOptions = {}
): Promise<AIResponse> {
  const systemMsg = messages.find((m) => m.role === "system");
  const nonSystemMsgs = messages.filter((m) => m.role !== "system");

  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: options.maxTokens ?? 8192,
      system: systemMsg?.content ?? "",
      messages: nonSystemMsgs.map((m) => ({
        role: m.role,
        content: m.content,
      })),
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Anthropic error ${res.status}: ${text}`);
  }

  const data = await res.json();
  return { content: data.content[0].text };
}

export async function askAI(
  messages: AIMessage[],
  options: AskOptions = {}
): Promise<AIResponse> {
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  const openaiKey = process.env.OPENAI_API_KEY;
  const anthropicKey = process.env.ANTHROPIC_API_KEY;

  if (openRouterKey) {
    const model = process.env.OPENROUTER_MODEL || "openai/gpt-4o";
    return callOpenRouter(messages, openRouterKey, model, options);
  }
  if (openaiKey) {
    return callOpenAI(messages, openaiKey, options);
  }
  if (anthropicKey) {
    return callAnthropic(messages, anthropicKey, options);
  }
  throw new Error(
    "No AI API key configured. Set OPENROUTER_API_KEY, OPENAI_API_KEY, or ANTHROPIC_API_KEY."
  );
}

export async function askAIJson<T>(messages: AIMessage[]): Promise<T> {
  const jsonMessages: AIMessage[] = [
    ...messages,
    {
      role: "user",
      content:
        'Respond with a single compact JSON object only. If returning a list of findings, use {"findings":[...]}. No markdown, no commentary. Keep each string under 400 characters.',
    },
  ];

  const response = await askAI(jsonMessages, { json: true, maxTokens: 8192 });
  try {
    return unwrapParsed<T>(parseJsonLoose(response.content));
  } catch {
    const retry = await askAI(
      [
        ...jsonMessages,
        {
          role: "user",
          content:
            "Your previous JSON was invalid or truncated. Reply again with a much shorter complete JSON object. Max 5 findings. Each content field: 1-2 sentences.",
        },
      ],
      { json: true, maxTokens: 4096 }
    );
    return unwrapParsed<T>(parseJsonLoose(retry.content));
  }
}
