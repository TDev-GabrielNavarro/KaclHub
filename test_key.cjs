const fs = require('fs');
const path = require('path');
const { GoogleGenAI } = require('@google/genai');

try {
  const envPath = path.join(__dirname, '.env');
  const envContent = fs.readFileSync(envPath, 'utf8');
  const match = envContent.match(/GEMINI_API_KEY\s*=\s*["']?([^"'\s]+)["']?/);
  const apiKey = match ? match[1] : null;

  console.log('Testing API key:', apiKey ? apiKey.substring(0, 7) + '...' : 'undefined');

  if (!apiKey) {
    console.error('No GEMINI_API_KEY found in .env');
    process.exit(1);
  }

  const ai = new GoogleGenAI({ apiKey });

  console.log('Sending test request to gemini-2.5-flash...');
  ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Responde de forma muy breve: "Sí, la clave es válida y funciona."',
  })
  .then(response => {
    console.log('--- SUCCESS ---');
    console.log('Gemini Response:', response.text.trim());
  })
  .catch(err => {
    console.log('--- FAILURE ---');
    console.error('Gemini Error:', err.message || err);
  });
} catch (err) {
  console.error('Script Error:', err);
}
