import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const maxDuration = 60; // Unlock Next.js architectural timeout constraints natively

// Dedicated structural endpoint exclusively for dropping massive offline media binaries.
export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const audioBlob = formData.get("audio") as Blob;
    const language = formData.get("language") as string || "GB";
    
    if (!audioBlob) {
      return NextResponse.json({ error: "No physical binary injected" }, { status: 400 });
    }

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY as string);
    const schemaConfig = {
      responseMimeType: "application/json"
    };

    let model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      generationConfig: schemaConfig as any
    });

    const buffer = Buffer.from(await audioBlob.arrayBuffer());
    const mimeType = audioBlob.type || "audio/mp3";
    const languageStr = language === "US" ? "American English" : "strictly British English";

    const prompt = `
      You are an elite enterprise intelligence extraction architect.
      Analyze the attached raw audio meeting meticulously. Extract the exact structural data according to the native response schema structure exactly.
      Provide extremely detailed, high-fidelity synthesis spanning all core actions, holistic strategies, and a complete time-stamped transcript block.
      CRITICAL INSTRUCTIONS:
      0. Language: You MUST use ${languageStr} spelling and terminology throughout the synthesis.
      1. Actions: Use exact keys: "activity", "owner", "deadline", "status". The "deadline" must be accurate. If no date is mentioned in the meeting, you MUST set the "deadline" property to exactly "TBA". Do not invent dates!
      
      REQUIRED SCHEMA EXACTLY:
      {
         "strategicSummary": "string",
         "coreObjectives": ["string", "string"],
         "backgroundContext": ["string"],
         "actions": [
            { "activity": "string", "owner": "string", "deadline": "string", "status": "string" }
         ]
      }
    `;

    let result;
    let retries = 2;
    
    while (retries >= 0) {
      try {
        result = await model.generateContent([
          { inlineData: { data: buffer.toString("base64"), mimeType } },
          prompt
        ]);
        break;
      } catch (e: any) {
        if (retries === 0) throw e;
        console.warn(`[Diagnostics] Upload File API crashed natively: ${e.message}. Retries remaining: ${retries}`);
        
        if (e.message?.includes("503") || e.message?.includes("High demand")) {
           console.warn("Failing over to Heavy 1.5 Pro namespace instantly...");
           model = genAI.getGenerativeModel({
             model: "gemini-2.5-pro",
             generationConfig: schemaConfig as any
           });
        }
        retries--;
        await new Promise(r => setTimeout(r, 3000));
      }
    }
    
    if (!result) throw new Error("Fallback execution matrix failed to synthesize the binary");

    const cleanJson = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    
    let parsedData;
    try {
       parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
       console.warn("Syntax edge-case hit during JSON compilation. Executing fallback regex parse.");
       const match = cleanJson.match(/\{[\s\S]*\}/);
       parsedData = JSON.parse(match ? match[0] : "{}");
    }
    
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Secure Offline Drop Synthesis Array error:", error);
    return NextResponse.json({ error: error.message || "Failed execution structurally." }, { status: 500 });
  }
}
