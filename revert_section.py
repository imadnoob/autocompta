import docx

def revert_section():
    doc = docx.Document('rapport plus 2.docx')
    paragraphs = doc.paragraphs
    
    start_idx = -1
    end_idx = -1
    for i, p in enumerate(paragraphs):
        if 'Section 2 :' in p.text and 'Présentation' in p.text:
            start_idx = i
        elif 'Section 3 :' in p.text or 'Chapitre' in p.text:
            if start_idx != -1 and i > start_idx:
                end_idx = i
                break
                
    if start_idx != -1 and end_idx != -1:
        # Clear existing text in this section
        for i in range(end_idx - 1, start_idx, -1):
            p = paragraphs[i]
            p.text = ''
            
        p_target = paragraphs[start_idx]
        
        # Add old paragraphs back
        p_target.insert_paragraph_before("La plateforme AutoCompta a été déployée pour centraliser l'ensemble du cycle financier au sein d'une interface web unique, fluide et sécurisée, reflétant les standards du Glassmorphism moderne.", 'Normal')
        
        p_target.insert_paragraph_before("3.3.1. Vue d'ensemble de la plateforme (Dashboard)", 'Heading 3')
        p_target.insert_paragraph_before("Le premier point de contact est le Tableau de Bord (Dashboard). Ce module n'est pas une simple restitution statique, mais un moteur de calcul dynamique qui agrège en temps réel les écritures du Grand Livre.", 'Normal')
        p_target.insert_paragraph_before("(INSÉRER CAPTURE D'ÉCRAN : Dashboard principal montrant le CA, les charges et le graphique d'évolution sur www.autocompta.online)", 'Normal')
        p_target.insert_paragraph_before("Le manager accède instantanément :", 'Normal')
        p_target.insert_paragraph_before("• Aux KPIs fondamentaux : Chiffre d'Affaires réalisé (comptes de la classe 7) et total des Charges (comptes de la classe 6).", 'List Bullet')
        p_target.insert_paragraph_before("• Aux visualisations avancées : Des graphiques à barres comparant Revenus et Dépenses mois par mois, ainsi qu'un diagramme en Donut répartissant le Top 5 des catégories de dépenses (ex: alimentation, honoraires, entretien).", 'List Bullet')
        p_target.insert_paragraph_before("• À la navigation historique : Un sélecteur d'exercice permet de comparer instantanément la performance de la saison touristique actuelle avec l'année N-1.", 'List Bullet')

        p_target.insert_paragraph_before("3.3.2. Module GED / OCR : La dématérialisation intelligente", 'Heading 3')
        p_target.insert_paragraph_before("Le second module adresse le problème de l'éclatement documentaire en agissant comme un « Cabinet Numérique ». Le manager de BoardXHouse peut désormais uploader (ou photographier) une facture directement sur la plateforme.", 'Normal')
        p_target.insert_paragraph_before("(INSÉRER CAPTURE D'ÉCRAN : Interface 'Documents' montrant la liste des factures traitées et leurs statuts)", 'Normal')
        p_target.insert_paragraph_before("Le pipeline de traitement s'appuie sur le modèle d'IA (Google Gemini 3 Flash Preview) pour réaliser un OCR intelligent. L'IA extrait automatiquement les champs critiques : l'ICE du fournisseur, le montant HT, la date, et distingue le taux de TVA applicable (20%, 14%, 10% ou 7%). De surcroît, le module inclut un algorithme de détection des doublons pour éviter toute double saisie d'une même facture fournisseur.", 'Normal')

        p_target.insert_paragraph_before("3.3.3. Module Comptabilité : Imputation automatique au PCM", 'Heading 3')
        p_target.insert_paragraph_before("Le cœur métier de l'application réside dans son module de comptabilité. Il convertit la donnée extraite par l'OCR en une véritable écriture comptable respectant la partie double et la réglementation marocaine.", 'Normal')
        p_target.insert_paragraph_before("(INSÉRER CAPTURE D'ÉCRAN : Module 'Comptabilité' avec vue sur le journal des HA ou un tableau des écritures)", 'Normal')
        p_target.insert_paragraph_before("Grâce à l'architecture RAG (Retrieval-Augmented Generation) connectée à la base vectorielle du PCM (loi 9-88), l'imputation analytique suggère exactement le bon compte de la classe 6 ou 7. Ce module permet de :", 'Normal')
        p_target.insert_paragraph_before("• Créer automatiquement les comptes de tiers auxiliaires (ex: compte fournisseur 4411).", 'List Bullet')
        p_target.insert_paragraph_before("• Gérer le lettrage comptable pour le rapprochement bancaire.", 'List Bullet')
        p_target.insert_paragraph_before("• Générer les états de synthèse dynamiques (Bilan et CPC).", 'List Bullet')
        p_target.insert_paragraph_before("• Exporter les données au format Sage (.txt) pour assurer le lien avec l'expert-comptable externe.", 'List Bullet')

        p_target.insert_paragraph_before("3.3.4. L'Agent IA : Pilotage interactif (Spotlight)", 'Heading 3')
        p_target.insert_paragraph_before("Pour parachever la transition de la « saisie » vers le « pilotage », AutoCompta intègre un agent conversationnel autonome.", 'Normal')
        p_target.insert_paragraph_before("(INSÉRER CAPTURE D'ÉCRAN : Chat avec l'Agent IA Spotlight sur le côté droit de l'écran)", 'Normal')
        p_target.insert_paragraph_before("Doté de près d'une vingtaine d'outils programmatiques internes (Tool Calling), cet assistant interagit en langage naturel. Le manager peut lui formuler des requêtes telles que : « Génère le rapport de TVA du mois de mars » ou « J'ai payé 500 DH d'entretien en espèces ce matin ». L'Agent IA comprend l'intention, collecte la donnée dans la base Supabase et génère soit la réponse sous forme de graphique, soit l'écriture de caisse correspondante, confirmant le rôle de l'IA comme véritable bras droit du chef d'entreprise.", 'Normal')
        
        # Restore the section title at the right place
        p_target_text = p_target.text
        p_target.text = ''
        p_target.insert_paragraph_before(p_target_text, 'Heading 2')
        
        doc.save('rapport plus 2.docx')
        print('Success')
    else:
        print('Section bounds not found:', start_idx, end_idx)

if __name__ == '__main__':
    revert_section()
