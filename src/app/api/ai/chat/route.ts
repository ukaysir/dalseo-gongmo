import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

type ChatMessage = {
  role: "system" | "user" | "assistant" | "tool";
  content: string;
};

type ChatBody = {
  model?: string;
  stream?: boolean;
  messages?: ChatMessage[];
  keyProfile?: "admin" | "user-default";
  [key: string]: unknown;
};

const defaultBaseUrl = process.env.OPENAI_BASE_URL ?? "https://api.openai.com/v1";
const defaultModel = process.env.OPENAI_MODEL ?? "deepseek-v4-flash-free";

export async function POST(request: NextRequest) {
  let payload: ChatBody;
  try {
    payload = (await request.json()) as ChatBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const apiKey = selectApiKey(payload.keyProfile)?.trim();
  const baseUrl = trimTrailingSlash(defaultBaseUrl);

  if (!apiKey) {
    return NextResponse.json(
      {
        error: "OPENAI API key is not configured",
        details:
          "set OPENAI_API_KEY, OPENAI_API_KEY_ADMIN, or OPENAI_API_KEY_USER_DEFAULT",
      },
      { status: 500 },
    );
  }

  const messages = Array.isArray(payload.messages) ? payload.messages : [];
  if (messages.length === 0) {
    return NextResponse.json({ error: "messages are required" }, { status: 400 });
  }

  const upstreamBody = {
    ...payload,
    model: payload.model ?? defaultModel,
  };

  let response: Response;

  try {
    response = await fetch(`${baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(upstreamBody),
      cache: "no-store",
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: "AI upstream request failed",
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 502 },
    );
  }

  if (!response.ok) {
    const details = await response.text();
    return NextResponse.json(
      {
        error: "AI upstream request failed",
        status: response.status,
        details,
      },
      { status: 502 },
    );
  }

  if (payload.stream) {
    return new NextResponse(response.body, {
      status: 200,
      headers: {
        "Content-Type": "text/event-stream",
        "Cache-Control": "no-store",
      },
    });
  }

  const result = await response.json();
  return NextResponse.json(result);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

function selectApiKey(profile?: "admin" | "user-default") {
  if (profile === "admin" && process.env.OPENAI_API_KEY_ADMIN) {
    return process.env.OPENAI_API_KEY_ADMIN;
  }

  if (
    profile === "user-default" &&
    process.env.OPENAI_API_KEY_USER_DEFAULT
  ) {
    return process.env.OPENAI_API_KEY_USER_DEFAULT;
  }

  return (
    process.env.OPENAI_API_KEY ??
    process.env.OPENAI_API_KEY_USER_DEFAULT ??
    process.env.OPENAI_API_KEY_ADMIN
  );
}
