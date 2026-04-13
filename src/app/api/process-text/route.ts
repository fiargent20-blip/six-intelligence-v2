import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const maxDuration = 60; // Unlock Next.js architectural timeout constraints natively

// Dedicated structural endpoint exclusively for generating intelligence from a text-only payload
export async function POST(req: NextRequest) {
  try {
    const { fullTranscriptText, language } = await req.json();
    
    if (!fullTranscriptText) {
      return NextResponse.json({ error: "No transcript string provided natively" }, { status: 400 });
    }

    const apiKey = process.env.SCRIBE_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "Missing API authorization specifically" }, { status: 401 });
    }
    const genAI = new GoogleGenerativeAI(apiKey as string);
    const schemaConfig = {
      responseMimeType: "application/json",
      responseSchema: {
        type: SchemaType.OBJECT,
        properties: {
          strategicSummary: { type: SchemaType.STRING, description: "Detailed summary of the meeting." },
          coreObjectives: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING },
            description: "Array of exactly all objectives."
          },
          backgroundContext: { 
            type: SchemaType.ARRAY, 
            items: { type: SchemaType.STRING } 
          },
          actions: {
            type: SchemaType.ARRAY,
            items: {
              type: SchemaType.OBJECT,
              properties: {
                activity: { type: SchemaType.STRING },
                owner: { type: SchemaType.STRING },
                deadline: { type: SchemaType.STRING },
                status: { type: SchemaType.STRING }
              },
              required: ["activity", "owner", "deadline", "status"]
            }
          }
        },
        required: ["strategicSummary", "coreObjectives", "backgroundContext", "actions"]
      }
    };

    let model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-pro", 
      generationConfig: schemaConfig as any
    });

    const languageStr = language === "US" ? "American English" : "strictly British English";

    const prompt = `
      You are an elite enterprise intelligence extraction architect.
      Analyze the attached meeting transcript meticulously. Extract the exact structural data according to the native response schema structure exactly.
      Provide extremely detailed, high-fidelity synthesis spanning all core actions, holistic strategies, and risks.
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
      
      TRANSCRIPT TEXT:
      ${fullTranscriptText}
    `;

    let result;
    let retries = 3;
    
    while (retries >= 0) {
      try {
        result = await model.generateContent(prompt);
        break;
      } catch (e: any) {
        if (retries === 0) throw e;
        console.warn(`[Diagnostics] Process Text API native crash: ${e.message}. Retries remaining: ${retries}`);
        
        let sleepMs = 2000;
        if (e.message?.includes("503") || e.message?.includes("High demand") || e.message?.includes("quota") || e.message?.includes("429")) {
           if (retries === 3) {
             model = genAI.getGenerativeModel({ model: "gemini-2.5-flash", generationConfig: schemaConfig as any });
           } else if (retries === 2) {
             model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: schemaConfig as any });
           } else if (retries === 1) {
             model = genAI.getGenerativeModel({ model: "gemini-2.0-flash", generationConfig: schemaConfig as any });
           }
        }
        
        retries--;
        await new Promise(r => setTimeout(r, sleepMs));
      }
    }
    
    if (!result) throw new Error("Fallback execution matrix failed to synthesize the block");

    const cleanJson = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    
    let parsedData;
    try {
       parsedData = JSON.parse(cleanJson);
    } catch (parseError) {
       const match = cleanJson.match(/\{[\s\S]*\}/);
       parsedData = JSON.parse(match ? match[0] : "{}");
    }
    
    return NextResponse.json(parsedData);

  } catch (error: any) {
    console.error("Secure Text Synthesis Array error:", error);
    return NextResponse.json({ error: error.message || "Failed execution structurally." }, { status: 500 });
  }
}
