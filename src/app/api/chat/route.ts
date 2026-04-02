import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.SCRIBE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "");
const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, contextObj } = body;

    if (!message) return NextResponse.json({ error: "Missing message" }, { status: 400 });

    const prompt = `
      You are the Six Intelligence Analysis Bot. Answer the user's question based strictly on the following meeting context.
      Context:
      ${JSON.stringify(contextObj)}
      
      User Question: ${message}
    `;

    const result = await model.generateContent(prompt);
    
    return NextResponse.json({ reply: result.response.text() });
  } catch (error: any) {
    return NextResponse.json({ error: "Chatbot error" }, { status: 500 });
  }
}
