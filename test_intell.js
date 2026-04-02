const fs = require('fs');
async function test() {
  const words = fs.readFileSync('/usr/share/dict/words', 'utf-8').split('\n');
  const payload = words.slice(0, 100000).join(' '); // A massive ~600KB text payload.
  console.log("Payload length:", payload.length, "bytes");

  try {
    const res = await fetch('http://localhost:3001/api/intelligence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ rawTranscriptText: payload, language: "GB" })
    });
    console.log("Status:", res.status);
    const json = await res.json();
    console.log("Response:", JSON.stringify(json, null, 2));
  } catch (e) {
    console.error("Fetch failed:", e);
  }
}
test();
