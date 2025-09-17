import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

export async function POST(req: NextRequest, { params }: { params: { path: string[] } }) {
  return handleProxy(req, params);
}

async function handleProxy(req: NextRequest, params: { path: string[] }) {
  try {
    // build backend URL
    const backendBase = process.env.BACKEND_URL || "https://studio-backend.duckdns.org";
    const backendUrl = `${backendBase}/${params.path.join("/")}${req.nextUrl.search}`;

    // const backendBase = "http://95.217.218.224:4000"; // your server
    // const backendUrl = `${backendBase}/${params.path.join("/")}${req.nextUrl.search}`;

    // forward request
    const response = await fetch(backendUrl, {
      method: req.method,
      headers: {
        "Content-Type": "application/json",
      },
      body: req.method !== "GET" && req.method !== "HEAD" ? await req.text() : undefined,
    });

    // return backend response
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err: any) {
    return NextResponse.json({ error: "Proxy failed", details: err.message }, { status: 500 });
  }
}
