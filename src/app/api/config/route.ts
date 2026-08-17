import { NextResponse } from "next/server";

export async function GET() {
  // Return the API key securely. In a production B2B environment, you could add session checks here.
  const apiKey = process.env.SCRIBE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  return NextResponse.json({ apiKey });
}
