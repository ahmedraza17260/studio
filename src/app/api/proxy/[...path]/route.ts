import { NextRequest } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

async function handleProxy(req: NextRequest, params: { path: string[] }) {
  // Backend base URL (set in Vercel → Environment Variables)
  const backendBase = process.env.BACKEND_URL || "http://localhost:4000";

  // Construct full backend URL
  const backendUrl = `${backendBase}/${params.path.join("/")}${req.nextUrl.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    // ✅ Stream response directly (instead of converting to text)
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (err: any) {
    return new Response(JSON.stringify({ error: "Proxy error", details: err.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}
