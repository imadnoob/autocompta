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
    const rawNature = extractedData.document_nature || '';
    const reasoning = extractedData.reasoning;

    // Normalisation pour robustesse (Majuscules + Suppression espaces)
    const document_nature = rawNature.toUpperCase().trim();

    console.log(`[DEBUG] ClassificationHelper - Nature brute: "${rawNature}", Normalisée: "${document_nature}"`);

    if (document_nature.includes('VENTE')) {
        console.log(`[DEBUG] ClassificationHelper - Choix final: VENTE (VT)`);
        return {
            scoreAchat: 0,
            scoreVente: 100,
            suggestedJournal: 'VT',
            confidence: 1,
            reasoning
        };
    }

    if (document_nature.includes('ACHAT')) {
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
