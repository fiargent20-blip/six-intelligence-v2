import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI } from '@google/generative-ai';

export const maxDuration = 60; // Next.js extended timeouts

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioFile = formData.get('file') as Blob;
    
    if (!audioFile) {
      return NextResponse.json({ error: "No audio chunk received." }, { status: 400 });
    }

    const buffer = Buffer.from(await audioFile.arrayBuffer());
    
    const language = formData.get('language') as string || 'GB';
    const languageStr = language === 'US' ? 'American English' : 'strictly British English';
    
    // The Google Edge trace revealed this specific API Key has advanced preview access
    const genAI = new GoogleGenerativeAI((process.env.SCRIBE_GEMINI_API_KEY || process.env.GEMINI_API_KEY) as string);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const promptArray = [
      {
        inlineData: {
          data: buffer.toString("base64"),
          mimeType: "audio/wav"
        }
      },
      `Listen to the following audio snippet and extract a highly dense, paraphrased chronological summary of what is being discussed. Focus on key decisions, numbers, names, and strategic points. Deduplicate wordy dialogue into concise actionable bullets. Identify speakers (Speaker 1, etc.) where possible. Use exactly ${languageStr} phrasing natively. If it is purely silence or background noise without readable words, return an absolutely empty string (do not invent context). Do not append any conversational filler or introductions.`
    ];
    
    try {
      const result = await model.generateContent(promptArray);
      let text = result.response.text();
      return NextResponse.json({ text });
    } catch (primaryError: any) {
      // Automatic Architectural Failover Payload
      if (primaryError.message?.includes("503") || primaryError.message?.includes("High demand")) {
        console.warn("[System Diagnostic]: Gemini endpoint congested (503). Instantly retrying execution fallback...");
        const backupModel = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
        const backupResult = await backupModel.generateContent(promptArray);
        return NextResponse.json({ text: backupResult.response.text() });
      }
      throw primaryError; 
    }
    
  } catch (error: any) {
    console.error("Live Stream Gemini Pipeline Error:", error);
    
    // Explicit tracing locally to diagnose the Web Audio / API payload constraint natively! 
    return NextResponse.json({ text: `\n\n[System Advisory]: ${error.message || 'Stream constraint failed'}\n` }, { status: 200 }); 
  }
}
