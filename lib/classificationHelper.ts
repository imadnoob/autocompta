/**
 * Helper to calculate Sales vs Purchase score based on OCR data
 */
export interface ClassificationResult {
    scoreAchat: number;
    scoreVente: number;
    suggestedJournal: 'HA' | 'VT';
    confidence: number;
}

export function classifyDocument(extractedData: any): ClassificationResult {
    let scoreAchat = 0;
    let scoreVente = 0;

    const { ice_position_y, anchors } = extractedData;

    // RULE 1: Spatial ICE (Robust)
    if (ice_position_y !== null && ice_position_y !== undefined) {
        // Sales: User's ICE is in Header (<30%) or Footer (>90%)
        if (ice_position_y < 0.3 || ice_position_y > 0.9) {
            scoreVente += 50;
        } 
        // Purchase: User's ICE is in center area (30-60%)
        else if (ice_position_y >= 0.3 && ice_position_y <= 0.6) {
            scoreAchat += 50;
        }
    }

    // RULE 2: Anchors
    if (anchors) {
        if (anchors.is_near_client_anchor) {
            scoreAchat += 100; // Strong signal
        }
        if (anchors.is_near_vendor_anchor) {
            scoreVente += 100; // Strong signal
        }
    }

    // Decision
    const suggestedJournal = scoreVente > scoreAchat ? 'VT' : 'HA';
    
    // Confidence calculation (basic)
    const maxScore = Math.max(scoreAchat, scoreVente);
    const minScore = Math.min(scoreAchat, scoreVente);
    const confidence = maxScore > 0 ? (maxScore - minScore) / maxScore : 0;

    return {
        scoreAchat,
        scoreVente,
        suggestedJournal,
        confidence
    };
}
