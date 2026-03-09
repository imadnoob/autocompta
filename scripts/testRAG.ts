import { createClient } from '@supabase/supabase-js';
import { GoogleGenerativeAI } from '@google/generative-ai';
import * as fs from 'fs';
import * as path from 'path';

// Quick-load env
const envPath = path.join(process.cwd(), '.env.local');
if (fs.existsSync(envPath)) {
    const envFile = fs.readFileSync(envPath, 'utf-8');
    envFile.split(/\r?\n/).forEach(line => {
        const match = line.match(/^([^#\s]+)\s*=\s*(.*)$/);
        if (match) {
            process.env[match[1].trim()] = match[2].trim().replace(/^['"](.*)['"]$/, '$1');
        }
    });
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
const geminiApiKey = process.env.GEMINI_API_KEY || process.env.NEXT_PUBLIC_GEMINI_API_KEY!;
const supabase = createClient(supabaseUrl, supabaseKey);
const genAI = new GoogleGenerativeAI(geminiApiKey);

async function testRAG(searchText: string) {
    console.log(`\nTesting RAG for: "${searchText}"`);
    const embedModel = genAI.getGenerativeModel({ model: "gemini-embedding-001" });
    const result = await embedModel.embedContent(searchText);
    const queryEmbedding = result.embedding.values;

    const { data, error } = await supabase.rpc('match_pcm_accounts', {
        query_embedding: queryEmbedding,
        match_threshold: 0.1,
        match_count: 3
    });

    if (error) {
        console.error("Match Error:", error);
    } else {
        console.log("Top matches from Supabase:");
        data.forEach((match: any) => {
            console.log(`- ${match.code}: ${match.name} (Similarity: ${match.similarity.toFixed(3)})`);
        });
    }
}

async function runTests() {
    await testRAG("Facture d'eau et électricité");
    await testRAG("Matériel informatique et bureau");
    await testRAG("Hotel chambre nuit");
}

runTests().catch(console.error);
