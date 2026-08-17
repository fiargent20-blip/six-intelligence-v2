import { NextResponse, NextRequest } from "next/server";

export async function GET(req: NextRequest) {
  // Enforce strict security: only browsers with the active, authenticated session cookie can fetch the key.
  const authCookie = req.cookies.get("scribe_auth_v2_active")?.value;
  
  if (authCookie !== "six_clearance_granted") {
    return NextResponse.json({ error: "Unauthorized access completely denied. Security clearance missing." }, { status: 401 });
  }

  const apiKey = process.env.SCRIBE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
  return NextResponse.json({ apiKey });
}
