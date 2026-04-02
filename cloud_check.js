const { loadEnvConfig } = require('@next/env');
loadEnvConfig(process.cwd());
const { GoogleAIFileManager } = require("@google/generative-ai/server");

async function check() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) { console.error("No API KEY"); return; }
  const fileManager = new GoogleAIFileManager(apiKey);
  try {
    const res = await fileManager.listFiles();
    if (!res.files || res.files.length === 0) {
      console.log("NO FILES IN CLOUD. IT IS FINISHED.");
    } else {
      for (const f of res.files) {
        console.log(`[STATE: ${f.state}] - ${f.displayName || f.name} - Created: ${f.createTime}`);
      }
    }
  } catch(e) { console.error(e); }
}
check();
