const fs = require('fs');
const file = 'c:/Users/User/Desktop/Projet PFE/components/modules/ComptabiliteModule.tsx';
let content = fs.readFileSync(file, 'utf8');

const targetStr = `                                // Format d'import/export Sage natif (#MECG) - Délimité par des tabulations
                                const lines: string[] = [];
                                lines.push('#MECG');

                                filteredEntries.forEach(e => {
                                    // 1. Date formatting (JJMMAA)
                                    const dateParts = e.entry_date.split('-');
                                    const sageDate = dateParts.length === 3 ? \`\${dateParts[2]}\${dateParts[1]}\${dateParts[0].substring(2)}\` : '';

                                    // 2. Gestion des tiers
                                    const isClientTier = e.account.startsWith('3421');
                                    const isFournTier = e.account.startsWith('4411');
                                    let compteGen = e.account;
                                    let tiers = '';
                                    if (isClientTier && e.account !== '3421') { compteGen = '3421000'; tiers = e.account; }
                                    else if (isFournTier && e.account !== '4411') { compteGen = '4411000'; tiers = e.account; }

                                    // 3. Montant et Sens
                                    const sens = e.debit > 0 ? 'D' : 'C';
                                    const montant = e.debit > 0 ? e.debit : e.credit;
                                    const montantStr = montant.toFixed(2).replace('.', ',');
                                    
                                    // Default Journal to ACH if "HA" or undefined
                                    // Usually "HA" is code for Achats in Auto Compta, but ACH in Sage.
                                    let sageJournal = e.journal_code || e.journal || 'ACH';
                                    if(sageJournal.toUpperCase() === 'HA') sageJournal = 'ACH';
                                    if(sageJournal.toUpperCase() === 'VT') sageJournal = 'VTE';
                                    if(sageJournal.toUpperCase() === 'BQ') sageJournal = 'BQE';

                                    // 4. Structure tabulaire stricte (#MECG) - Sage exige souvent ~23 champs
                                    const lineFields = [
                                        sageJournal,                // 1: Code journal
                                        sageDate,                   // 2: Date de pièce (JJMMAA)
                                        compteGen,                  // 3: N° de compte général
                                        tiers,                      // 4: N° de compte tiers
                                        '',                         // 5: N° de section analytique
                                        e.piece_num || '',          // 6: N° de pièce
                                        e.label || '',              // 7: Libellé de l'écriture
                                        sens,                       // 8: Sens (D/C)
                                        montantStr,                 // 9: Montant
                                        '', // 10: Mode de règlement
                                        '', // 11: Date d'échéance (JJMMAA)
                                        '', // 12: Devise
                                        '', // 13: Montant devise
                                        '', // 14: Quantité
                                        '', // 15: N° de lettrage
                                        '', // 16: Type de saisie analytique
                                        '', // 17: Date de rapprochement
                                        '', // 18: Code lettrage pointage
                                        '', // 19: N° lettrage pointage
                                        '', // 20: Taux de devise
                                        '', // 21: Montant TVA
                                        '', // 22: Code taxe
                                        ''  // 23: Type TVA
                                    ];
                                    
                                    lines.push(lineFields.join('\\t'));
                                });

                                // Convertir en ANSI (Windows-1252) pour que Sage n'échoue pas sur les accents (é, è, à) ou le tiret long (—)
                                const contentStr = lines.join('\\r\\n');
                                
                                // Très basique encoder for Windows-1252 (not full coverage but solves 90% accents and em-dash)
                                // Standard browser text encoder only does UTF-8. We map chars manually.
                                const encodeToWindows1252 = (str: string) => {
                                    const win1252 = new Uint8Array(str.length);
                                    for (let i = 0; i < str.length; i++) {
                                        let code = str.charCodeAt(i);
                                        // Handle em-dash "—" -> 151 in windows 1252
                                        if (code === 8212) code = 151;
                                        // Provide fallback to standard characters for safety if out of range
                                        if (code > 255) { 
                                            // Mapping special curly quotes, etc if they exist.
                                            if(code === 8217) code = 39; // '
                                            else if(code === 8220 || code === 8221) code = 34; // "
                                            else code = 63; // '?'
                                        } 
                                        win1252[i] = code;
                                    }
                                    return win1252;
                                };

                                const ansiBytes = encodeToWindows1252(contentStr);
                                const blob = new Blob([ansiBytes], { type: 'text/plain' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.setAttribute('href', url);
                                link.setAttribute('download', \`Export_Sage_Nat_\${new Date().toISOString().split('T')[0]}.txt\`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="flex items-center gap-2 bg-[#fee2e2] text-[#991b1b] border-2 border-[#991b1b] px-4 py-2 font-display font-bold text-sm shadow-[2px_2px_0px_#991b1b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#991b1b] transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Sage (TXT)
                        </button>`;

const replacementStr = `                                // Format CSV classique pour Import Paramétrable Sage (.ema)
                                const lines: string[] = [];
                                // Titres de colonnes (optionnel mais utile pour le mappage)
                                lines.push(["Journal", "Date", "Piece", "Compte", "Tiers", "Libelle", "Sens", "Montant"].join(';'));

                                filteredEntries.forEach(e => {
                                    // 1. Date formatting (JJMMAA)
                                    const dateParts = e.entry_date.split('-');
                                    const sageDate = dateParts.length === 3 ? \`\${dateParts[2]}\${dateParts[1]}\${dateParts[0].substring(2)}\` : e.entry_date;

                                    // 2. Gestion des tiers
                                    const isClientTier = e.account.startsWith('3421');
                                    const isFournTier = e.account.startsWith('4411');
                                    let compteGen = e.account;
                                    let tiers = '';
                                    if (isClientTier && e.account !== '3421') { compteGen = '3421000'; tiers = e.account; }
                                    else if (isFournTier && e.account !== '4411') { compteGen = '4411000'; tiers = e.account; }

                                    // 3. Montant et Sens
                                    const sens = e.debit > 0 ? 'D' : 'C';
                                    const montant = e.debit > 0 ? e.debit : e.credit;
                                    const montantStr = montant.toFixed(2).replace('.', ',');
                                    
                                    // Default Journal to ACH if "HA" or undefined
                                    // Usually "HA" is code for Achats in Auto Compta, but ACH in Sage.
                                    let sageJournal = e.journal_code || e.journal || 'ACH';
                                    if(sageJournal.toUpperCase() === 'HA') sageJournal = 'ACH';
                                    if(sageJournal.toUpperCase() === 'VT') sageJournal = 'VTE';
                                    if(sageJournal.toUpperCase() === 'BQ') sageJournal = 'BQE';

                                    // Pièce et libellé nettoyés
                                    const piece = e.piece_num ? e.piece_num.trim() : '';
                                    const libelle = e.label ? e.label.trim().substring(0, 35) : '';

                                    // 4. Structure tabulaire simplifiée pour mappage Paramétrable CSV
                                    // Code Journal ; Date de Pièce ; N° Compte Général ; N° Compte Tiers ; Référence ; Libellé écriture ; Sens (D/C) ; Montant
                                    const lineFields = [
                                        sageJournal,                // 1: Code journal
                                        sageDate,                   // 2: Date de pièce (JJMMAA)
                                        piece,                      // 3: N° de pièce paramétrable (.ema)
                                        compteGen,                  // 4: N° de compte général
                                        tiers,                      // 5: N° de compte tiers
                                        \`"\${libelle.replaceAll('"', '""')}"\`, // 6: Libellé de l'écriture
                                        sens,                       // 7: Sens (D/C)
                                        montantStr                  // 8: Montant
                                    ];
                                    
                                    lines.push(lineFields.join(';'));
                                });

                                // Convertir en ANSI (Windows-1252) pour que Sage n'échoue pas sur les accents (é, è, à) ou le tiret long (—)
                                const contentStr = lines.join('\\r\\n');
                                
                                // Très basique encoder for Windows-1252 (not full coverage but solves 90% accents and em-dash)
                                // Standard browser text encoder only does UTF-8. We map chars manually.
                                const encodeToWindows1252 = (str: string) => {
                                    const win1252 = new Uint8Array(str.length);
                                    for (let i = 0; i < str.length; i++) {
                                        let code = str.charCodeAt(i);
                                        // Handle em-dash "—" -> 151 in windows 1252
                                        if (code === 8212) code = 151;
                                        // Provide fallback to standard characters for safety if out of range
                                        if (code > 255) { 
                                            // Mapping special curly quotes, etc if they exist.
                                            if(code === 8217) code = 39; // '
                                            else if(code === 8220 || code === 8221) code = 34; // "
                                            else code = 63; // '?'
                                        } 
                                        win1252[i] = code;
                                    }
                                    return win1252;
                                };

                                const ansiBytes = encodeToWindows1252(contentStr);
                                const blob = new Blob([ansiBytes], { type: 'text/csv' });
                                const url = URL.createObjectURL(blob);
                                const link = document.createElement('a');
                                link.setAttribute('href', url);
                                link.setAttribute('download', \`Export_Sage_\${new Date().toISOString().split('T')[0]}.csv\`);
                                document.body.appendChild(link);
                                link.click();
                                document.body.removeChild(link);
                            }}
                            className="flex items-center gap-2 bg-[#fee2e2] text-[#991b1b] border-2 border-[#991b1b] px-4 py-2 font-display font-bold text-sm shadow-[2px_2px_0px_#991b1b] hover:-translate-x-0.5 hover:-translate-y-0.5 hover:shadow-[3px_3px_0px_#991b1b] transition-all"
                        >
                            <Download className="w-4 h-4" />
                            Sage (CSV)
                        </button>`;

if (content.includes(targetStr)) {
    content = content.replace(targetStr, replacementStr);
    fs.writeFileSync(file, content, 'utf8');
    console.log("Success: Content replaced.");
} else {
    console.log("Error: Target content not found exactly. Check for whitespace or character differences.");
}
