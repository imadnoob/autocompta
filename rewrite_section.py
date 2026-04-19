import docx

def replace_section():
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
        
        # Add new paragraphs
        p_target.insert_paragraph_before("La plateforme AutoCompta a été conçue pour centraliser l'ensemble du processus comptable au sein d'une interface web moderne, intuitive et sécurisée. Dès la première interaction, l'utilisateur est accueilli par une page de destination vitrine (Landing Page) qui présente la proposition de valeur et les fonctionnalités clés avant de l'orienter vers le cœur applicatif.", 'Normal')
        
        p_target.insert_paragraph_before("3.3.1. Landing Page et Accueil Détaillé", 'Heading 3')
        p_target.insert_paragraph_before("La page d'accueil (Landing Page) s'articule autour d'un design \"Glassmorphism\" avec des effets visuels attractifs. Elle présente clairement les avantages de la plateforme (automatisation via l'IA, intégration avec Sage, etc.). Le visiteur y découvre comment AutoCompta agit comme un assistant comptable virtuel grâce à la section \"Comment ça marche ?\" qui détaille le flux en 4 étapes simples.", 'Normal')
        p_target.insert_paragraph_before("(INSÉRER CAPTURE D'ÉCRAN : Page d'accueil d'AutoCompta ou section fonctionnalités)", 'Normal')
        
        p_target.insert_paragraph_before("3.3.2. Vue d'ensemble : Le Tableau de Bord (Dashboard)", 'Heading 3')
        p_target.insert_paragraph_before("Une fois authentifié, l'utilisateur accède au Tableau de Bord. Ce n'est pas un simple affichage statique, mais un module analytique interactif. Il offre une vision claire sur la santé financière de l'entreprise.", 'Normal')
        p_target.insert_paragraph_before("Le Dashboard permet au manager d'observer en un coup d'œil :", 'Normal')
        p_target.insert_paragraph_before("• Les KPIs essentiels : Chiffre d'Affaires réalisé (classe 7) et le total des Charges (classe 6).", 'List Bullet')
        p_target.insert_paragraph_before("• Des représentations graphiques : Répartition des charges via un diagramme \"Donut\" et évolution comparative des revenus/dépenses.", 'List Bullet')
        p_target.insert_paragraph_before("• Des indicateurs dynamiques : Comme le total de TVA Facturée et Récupérable.", 'List Bullet')
        p_target.insert_paragraph_before("(INSÉRER CAPTURE D'ÉCRAN : Dashboard principal montrant le CA, les charges et le graphique d'évolution)", 'Normal')
        
        p_target.insert_paragraph_before("3.3.3. Dématerialisation Intelligente : OCR et IA Gemini", 'Heading 3')
        p_target.insert_paragraph_before("Le module \"Documents\" agit comme un Cabinet Numérique. Il révolutionne la saisie classique en permettant le téléchargement des factures (PDF, images).", 'Normal')
        p_target.insert_paragraph_before("Le traitement s'appuie sur le modèle de langage avancé Google Gemini 3 Flash Preview. Ce dernier réalise une extraction intelligente (OCR) : il identifie le montant HT, le taux de TVA, l'ICE du fournisseur, et la date, le tout en écartant les doublons potentiels grâce à un système de vérification robuste.", 'Normal')
        p_target.insert_paragraph_before("(INSÉRER CAPTURE D'ÉCRAN : Interface 'Documents' montrant une facture traitée et données extraites)", 'Normal')

        p_target.insert_paragraph_before("3.3.4. Comptabilité Avancée et États de Synthèse", 'Heading 3')
        p_target.insert_paragraph_before("Ce module est le cœur métier. Il convertit instantanément les données OCR en écritures comptables strictes (partie double) conformément au Plan Comptable Marocain (PCM).", 'Normal')
        p_target.insert_paragraph_before("Une architecture RAG (Retrieval-Augmented Generation) est déployée pour suggérer le bon compte de charge de manière contextuelle.", 'Normal')
        p_target.insert_paragraph_before("De plus, la plateforme génère automatiquement des états de synthèse pré-calculés, tels que le Bilan (Actif/Passif) trié rigoureusement, et le Compte de Produits et Charges (CPC).", 'Normal')
        p_target.insert_paragraph_before("(INSÉRER CAPTURE D'ÉCRAN : Module Bilan ou CPC généré dynamiquement)", 'Normal')
        
        p_target.insert_paragraph_before("3.3.5. Pilotage Interactif via l'Agent IA", 'Heading 3')
        p_target.insert_paragraph_before("AutoCompta franchit un cap supplémentaire avec son Agent IA interactif (Spotlight). En langage naturel, l'utilisateur peut interroger la base de données (ex: \"Quelles sont mes charges du mois ?\") ou ordonner des actions. L'agent utilise le concept de \"Tool Calling\" pour exécuter la requête en base de données et rendre une réponse appropriée.", 'Normal')
        
        # Restore the section title at the right place
        p_target_text = p_target.text
        p_target.text = ''
        p_target.insert_paragraph_before(p_target_text, 'Heading 2')
        
        doc.save('rapport plus 2.docx')
        print('Success')
    else:
        print('Section bounds not found:', start_idx, end_idx)

if __name__ == '__main__':
    replace_section()
