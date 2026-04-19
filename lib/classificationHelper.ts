/**
 * Helper to calculate Sales vs Purchase score based on OCR data
 */
export interface ClassificationResult {
    scoreAchat: number;
    scoreVente: number;
    suggestedJournal: 'HA' | 'VT';
    confidence: number;
}

export interface UserContext {
    companyName?: string;
    ice?: string;
}

export function classifyDocument(extractedData: any, userContext?: UserContext): ClassificationResult {
    let scoreAchat = 0;
    let scoreVente = 0;

    const { ice_position_y, anchors, supplier, tier_ice } = extractedData;

    // RULE 0: Hard Match (Absolute Priority)
    if (userContext) {
        // Compare ICE (Numeric only comparison to avoid formatting issues)
        if (userContext.ice && tier_ice) {
            const cleanUserIce = userContext.ice.replace(/\D/g, '');
            const cleanTierIce = tier_ice.replace(/\D/g, '');
            if (cleanUserIce === cleanTierIce && cleanUserIce.length >= 10) {
                scoreVente += 1000; // Force Sales
            }
        }

        // Compare Company Name (Fuzzy/Inclusive)
        if (userContext.companyName && supplier) {
            const uName = userContext.companyName.toLowerCase().trim();
            const sName = supplier.toLowerCase().trim();
            if (sName.includes(uName) || uName.includes(sName)) {
                scoreVente += 1000; // Force Sales
            }
        }
    }

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
    
    // Confidence calculation (capped at 1)
    const maxScore = Math.max(scoreAchat, scoreVente);
    const minScore = Math.min(scoreAchat, scoreVente);
    const confidence = maxScore > 0 ? Math.min(1, (maxScore - minScore) / (maxScore || 1)) : 0;

    return {
        scoreAchat,
        scoreVente,
        suggestedJournal,
        confidence
    };
}
