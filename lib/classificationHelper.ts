/**
 * Helper to calculate Sales vs Purchase score based on Direct Semantic Selection (V3)
 */
export interface ClassificationResult {
    scoreAchat: number;
    scoreVente: number;
    suggestedJournal: 'HA' | 'VT';
    confidence: number;
    reasoning?: string;
}

export function classifyDocument(extractedData: any): ClassificationResult {
    const { document_nature, reasoning } = extractedData;

    console.log(`[DEBUG] ClassificationHelper - Nature IA: ${document_nature}`);

    if (document_nature === 'VENTE') {
        console.log(`[DEBUG] ClassificationHelper - Choix final: VENTE (VT)`);
        return {
            scoreAchat: 0,
            scoreVente: 100,
            suggestedJournal: 'VT',
            confidence: 1,
            reasoning
        };
    }

    if (document_nature === 'ACHAT') {
        console.log(`[DEBUG] ClassificationHelper - Choix final: ACHAT (HA)`);
        return {
            scoreAchat: 100,
            scoreVente: 0,
            suggestedJournal: 'HA',
            confidence: 1,
            reasoning
        };
    }

    // Default neutral result if INCONNU or missing
    return {
        scoreAchat: 0,
        scoreVente: 0,
        suggestedJournal: 'HA', // Default absolute
        confidence: 0,
        reasoning: reasoning || "Nature du document non identifiée par l'IA."
    };
}
