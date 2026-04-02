import { NextRequest, NextResponse } from "next/server";
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

export const maxDuration = 60; // Unlock Next.js architectural timeout constraints natively

// Dedicated structural endpoint exclusively for generating intelligence from a multi-gigabyte remote Google file
export async function POST(req: NextRequest) {
  try {
    const { fileUri, mimeType, language } = await req.json();
    
    if (!fileUri) {
      return NextResponse.json({ error: "No physical file URI pointer provided" }, { status: 400 });
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
          },
          transcript: {
            type: SchemaType.ARRAY,
            items: { type: SchemaType.STRING },
            description: "A chronological timeline of key statements or paraphrased summary bullet points traversing the entire meeting."
          }
        },
        required: ["strategicSummary", "coreObjectives", "backgroundContext", "actions", "transcript"]
      }
    };

    let model = genAI.getGenerativeModel({ 
      model: "gemini-3-flash-preview", // Restored V2 designated heavy lifting endpoint
      generationConfig: schemaConfig as any
    });

    const languageStr = language === "US" ? "American English" : "strictly British English";

    const prompt = `
      You are an elite enterprise intelligence extraction architect.
      Analyze the attached raw audio meeting meticulously. Extract the exact structural data according to the native response schema structure exactly.
      Provide extremely detailed, high-fidelity synthesis spanning all core actions, holistic strategies, and risks.
      
      CRITICAL INSTRUCTIONS:
      0. Language: You MUST use ${languageStr} spelling and terminology throughout the synthesis.
      1. Complete Duration Parsing: You MUST listen to and parse the ENTIRE duration of this audio file from start to finish. Do not stop early or focus only on the beginning.
      2. Smart Transcript: Extract a structured, chronological timeline of paraphrased dialogue instead of a verbatim block. Group information functionally to avoid token limits!
      3. Actions: Use exact keys: "activity", "owner", "deadline", "status". The "deadline" must be accurate. If no date is mentioned in the meeting, you MUST set the "deadline" property to exactly "TBA". Do not invent dates!

      REQUIRED SCHEMA EXACTLY:
      {
         "strategicSummary": "string",
         "coreObjectives": ["string", "string"],
         "backgroundContext": ["string"],
         "transcript": ["string", "string"],
         "actions": [
            { "activity": "string", "owner": "string", "deadline": "string", "status": "string" }
         ]
      }
    `;

    let result;
    let retries = 3;
    
    while (retries >= 0) {
      try {
        result = await model.generateContent([
          { fileData: { fileUri, mimeType } },
          prompt
        ]);
        break;
      } catch (e: any) {
        if (retries === 0) throw e;
        console.warn(`[Diagnostics] Process File API native crash: ${e.message}. Retries remaining: ${retries}`);
        
        // Wait exponentially on 503 Server Congestion or Quota errors
        let sleepMs = 3000;
        if (e.message?.includes("503") || e.message?.includes("High demand") || e.message?.includes("quota") || e.message?.includes("429")) {
           console.warn(`Encountered severe backend congestion/limits (${e.message}). Falling back exponentially...`);
           sleepMs = 6000;
           
           if (retries <= 2) {
             console.warn("Failing explicitly down into 1.5 Pro namespace architecture...");
             model = genAI.getGenerativeModel({
               model: "gemini-1.5-pro-latest",
               generationConfig: schemaConfig as any
             });
           }
        }
        
        // Wait natively via Google File API State Propagation delays before executing the retry
        retries--;
        await new Promise(r => setTimeout(r, sleepMs));
      }
    }
    
    if (!result) throw new Error("Fallback execution matrix failed to synthesize the block");

    const cleanJson = result.response.text().replace(/```json\n?|\n?```/g, '').trim();
    console.log("[Diagnostic Edge-Layer] Gemini Raw Structural Node JSON:\n", cleanJson);
    
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
    console.error("Secure Cloud Target Synthesis Array error:", error);
    return NextResponse.json({ error: error.message || "Failed execution structurally." }, { status: 500 });
  }
}
