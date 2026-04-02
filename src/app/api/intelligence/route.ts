import { NextRequest, NextResponse } from "next/server";

// CRITICAL BYPASS: Allows Next.js to keep the API connection open for up to 60 minutes.
export const maxDuration = 60;
import { GoogleGenerativeAI, SchemaType } from "@google/generative-ai";

const apiKey = process.env.SCRIBE_GEMINI_API_KEY || process.env.GEMINI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// Model: Strict JSON enforcement engine
const schemaConfig: any = { 
  responseMimeType: "application/json"
};

const modelJson = genAI.getGenerativeModel({ 
  model: "gemini-3-flash-preview",
  generationConfig: schemaConfig
});

export async function POST(req: NextRequest) {
  try {
    const data = await req.json();
    const { rawTranscriptText, language } = data;
    const languageStr = language === "US" ? "American English" : "strictly British English";
    
    if (!rawTranscriptText) {
      return NextResponse.json({ error: "No finalized streaming transcript text provided from the WebSockets." }, { status: 400 });
    }

    // Transform Raw String into Structured JSON Object
    // Instantaneous text-to-JSON generation using our specifically configured model
    const prompt2 = `
      You are an elite business analyst. Read the following raw meeting transcript and structure it into a highly precise JSON response.
      Do not include markdown blocks, just return valid JSON.

      CRITICAL INSTRUCTIONS FOR JSON SCHEMA:
      0. Language: You MUST use ${languageStr} spelling and terminology legitimately natively.
      1. Strategic Summary: Provide a 100-200 word summary (2-3 paragraphs) detailing the main considerations and next steps agreed upon.
      2. Core Objectives: Provide a list of bullet points in full sentences to give sufficient meaning and context.
      3. Key Actions: Extract explicitly assigned tasks into an array of objects utilizing the exact keys: "activity", "owner", "deadline", and "status". CRITICAL: The "deadline" value MUST remain strictly accurate to the transcript. If no specific date is mentioned in the meeting, you MUST set the "deadline" property to exactly "TBA". Do not invent or guess dates.
      4. Background, Context and Insights: Provide noteworthy facts and insights shared in the meeting. For example: key stakeholders/names, risks, product plans, budget, competitors.
      5. Conciseness: Ensure the total JSON response fits entirely within maximum LLM limits securely.

      RAW TRANSCRIPT:
      ${rawTranscriptText}
      
      Structure:
      {
        "strategicSummary": "100-200 words, 2-3 paragraphs. Main considerations and next steps.",
        "coreObjectives": [
          "Bullet point sentence 1.",
          "Bullet point sentence 2."
        ],
        "backgroundContext": [
          "Noteworthy fact, risk, or stakeholder insight 1."
        ],
        "actions": [
          { "activity": "task", "owner": "name", "deadline": "date", "status": "status" }
        ]
      }
    `;

    let result2;
    let retries2 = 2;
    let activeModel = modelJson;

    while (retries2 >= 0) {
      try {
        result2 = await activeModel.generateContent([
          { text: prompt2 }
        ]);
        break; // Success!
      } catch (e: any) {
        if (retries2 === 0) throw e;
        
        console.warn(`[System Diagnostic]: Gemini API connection dropped or congested (503). Retries remaining: ${retries2}`);
        if (e.message?.includes("503") || e.message?.includes("High demand")) {
           console.warn("Instantly failing over Intelligence formulation to 1.5 Pro architecture...");
           activeModel = genAI.getGenerativeModel({
             model: "gemini-1.5-pro-latest",
             generationConfig: schemaConfig
           });
        }
        
        retries2--;
        await new Promise(resolve => setTimeout(resolve, 3000));
      }
    }

    if (!result2) throw new Error("Gemini API failed to formulate the JSON stream cache after retries.");
    
    const responseText = result2.response.text();
    const jsonString = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (parseError) {
      console.error("Syntax edge-case hit reconstructing transcript array.", parseError);
      const match = jsonString.match(/\{[\s\S]*\}/);
      parsedData = JSON.parse(match ? match[0] : "{}");
    }

    return NextResponse.json(parsedData);
  } catch (error: any) {
    console.error("Live Stream Intelligence Pipeline Error:", error);
    return NextResponse.json({ error: error.message || "Failed to deeply process the Live Stream transcript." }, { status: 500 });
  }
}
