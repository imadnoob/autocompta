/**
 * Helper to calculate Sales vs Purchase score based on Semantic Reasoning from Gemini
 */
export interface ClassificationResult {
    scoreAchat: number;
    scoreVente: number;
    suggestedJournal: 'HA' | 'VT';
    confidence: number;
    reasoning?: string;
}

export function classifyDocument(extractedData: any): ClassificationResult {
    const { detected_user_role, confidence_score, reasoning } = extractedData;

    if (detected_user_role === 'ISSUER') {
        return {
            scoreAchat: 0,
            scoreVente: 100,
            suggestedJournal: 'VT',
            confidence: (confidence_score || 100) / 100,
            reasoning
        };
    }

    if (detected_user_role === 'CUSTOMER') {
        return {
            scoreAchat: 100,
            scoreVente: 0,
            suggestedJournal: 'HA',
            confidence: (confidence_score || 100) / 100,
            reasoning
        };
    }

    // Default neutral result if UNKNOWN or missing
    return {
        scoreAchat: 0,
        scoreVente: 0,
        suggestedJournal: 'HA', // Default absolute
        confidence: 0,
        reasoning: reasoning || "Rôle utilisateur non identifié par l'IA."
    };
}
