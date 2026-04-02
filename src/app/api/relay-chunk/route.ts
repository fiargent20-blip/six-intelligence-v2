import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const uploadUrl = req.headers.get('x-upload-url');
    const offset = req.headers.get('x-upload-offset');
    const command = req.headers.get('x-upload-command');

    if (!uploadUrl || !offset || !command) {
      return NextResponse.json({ error: "Missing required relay headers" }, { status: 400 });
    }

    const binaryChunk = await req.arrayBuffer();

    // Safely pipe the physical chunk straight from Node into Google's Engine
    const pushRes = await fetch(uploadUrl, {
      method: "PUT",
      headers: {
        "X-Goog-Upload-Offset": offset,
        "X-Goog-Upload-Command": command,
      },
      // IMPORTANT: In Node environments, binary formats transmit flawlessly to Google APIs via standard ArrayBuffers
      body: binaryChunk
    });

    if (!pushRes.ok) {
      const txt = await pushRes.text();
      return NextResponse.json({ error: `Google Target Relay Error: ${txt}` }, { status: 500 });
    }

    if (command.includes("finalize")) {
      const data = await pushRes.json();
      return NextResponse.json(data);
    }

    return NextResponse.json({ success: true });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
