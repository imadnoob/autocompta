import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Manual quick-load of .env.local
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^#\s]+)\s*=\s*(.*)$/);
        if (match) {
            const key = match[1].trim();
            let value = match[2].trim();
            value = value.replace(/^['"](.*)['"]$/, '$1'); // Remove quotes
            process.env[key] = value;
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY!;

if (!supabaseUrl || !supabaseKey || !geminiApiKey) {
    console.error('Missing environment variables. Make sure .env.local contains NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY, and GEMINI_API_KEY');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);
// Using the standard text embedding model that is widely available
const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });

async function main() {
    const dataPath = path.join(process.cwd(), 'comptes', 'pcm_data.json');
    if (!fs.existsSync(dataPath)) {
        console.error('pcm_data.json not found in comptes/');
        return;
    }

    const accounts = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));
    console.log(`Loaded ${accounts.length} accounts to ingest.`);

    let successCount = 0;
    let errorCount = 0;

    for (let i = 0; i < accounts.length; i++) {
        const acc = accounts[i];
        try {
            // Add rich semantic text for embedding: Code + Libellé
            const textToEmbed = `Compte ${acc.code} : ${acc.name}`;

            // 1. Generate Embedding
            const result = await embedModel.embedContent(textToEmbed);
            const embedding = result.embedding.values;

            // 2. Insert into Supabase
            const { error: dbError } = await supabase
                .from('pcm_accounts')
                .upsert({
                    code: acc.code,
                    name: acc.name,
                    description: textToEmbed, // Raw description for now
                    embedding: embedding
                }, { onConflict: 'code' });

            if (dbError) throw dbError;

            successCount++;
            if (i % 50 === 0 && i > 0) {
                console.log(`Processed ${i} / ${accounts.length}...`);
            }

            // Small delay to avoid API rate limits
            await new Promise(res => setTimeout(res, 200));

        } catch (error: any) {
            console.error(`Error processing account ${acc.code}:`, error.message);
            errorCount++;
        }
    }

    console.log(`\nIngestion complete! Success: ${successCount}, Errors: ${errorCount}`);
}

main().catch(console.error);
