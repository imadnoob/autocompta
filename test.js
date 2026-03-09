const fs = require('fs');
const path = require('path');

const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^#\s]+)\s*=\s*(.*)$/);
        if (match) {
            const key = match[1].trim();
            const value = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
            process.env[key] = value;
        }
    });
}

const key = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

async function run() {
    const response = await fetch('https://generativelanguage.googleapis.com/v1beta/models?key=' + key);
    const data = await response.json();
    if (data.error) {
        console.error("API error:", data.error);
        return;
    }
    const embedModels = data.models.filter(m => m.supportedGenerationMethods.includes('embedContent'));
    console.log("Embed models available:");
    console.log(embedModels.map(m => m.name));
}
run();
