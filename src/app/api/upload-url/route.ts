import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { displayName, mimeType, size } = await req.json();
    if (!displayName || !mimeType || !size) {
      return NextResponse.json({ error: "Missing metadata for Google Protocol" }, { status: 400 });
    }

    const API_KEY = process.env.SCRIBE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!API_KEY) {
      return NextResponse.json({ error: "No SCRIBE_GEMINI_API_KEY or GEMINI_API_KEY Configured" }, { status: 500 });
    }

    // Ping Google directly to initiate a highly-secure Resumable Upload session.
    // The resulting Session URI allows the frontend to stream gigabytes of raw binary without authentication keys.
    const initRes = await fetch(`https://generativelanguage.googleapis.com/upload/v1beta/files?uploadType=resumable&key=${API_KEY}`, {
      method: "POST",
      headers: {
        "X-Goog-Upload-Protocol": "resumable",
        "X-Goog-Upload-Command": "start",
        "X-Goog-Upload-Header-Content-Length": size.toString(),
        "X-Goog-Upload-Header-Content-Type": mimeType,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({ file: { displayName } })
    });

    if (!initRes.ok) {
      const text = await initRes.text();
      return NextResponse.json({ error: `Google Backend Protocol Error: ${text}` }, { status: 500 });
    }

    const uploadUrl = initRes.headers.get("x-goog-upload-url");
    if (!uploadUrl) {
      return NextResponse.json({ error: "Google did not provide a secure upload URL" }, { status: 500 });
    }

    return NextResponse.json({ uploadUrl });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
