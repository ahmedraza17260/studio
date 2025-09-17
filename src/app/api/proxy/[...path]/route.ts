import { NextRequest } from "next/server";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(req, await params);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ path: string[] }> }
) {
  return handleProxy(req, await params);
}

async function handleProxy(req: NextRequest, params: { path: string[] }) {
  const backendBase = process.env.BACKEND_URL || "http://localhost:4000";
  const backendUrl = `${backendBase}/${params.path.join("/")}${req.nextUrl.search}`;

  try {
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: Object.fromEntries(req.headers.entries()),
      body:
        req.method !== "GET" && req.method !== "HEAD"
          ? await req.text()
          : undefined,
    });

    // ✅ Stream back response (fixes download issue)
    return new Response(response.body, {
      status: response.status,
      headers: response.headers,
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: "Proxy error", details: err.message }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
