/**
 * Roman Super Allergist Assistant - Clinical Knowledge Base
 * 
 * This file contains encoded medical knowledge, guidelines, and protocols 
 * specifically for Allergy and Immunology. This is used to ground the AI's 
 * clinical reasoning and ensure adherence to professional standards (AAAAI/ACAAI).
 */

export const ALLERGY_KNOWLEDGE_BASE = {
    guidelines: {
        rhinitis: "Practice Parameter for Allergic Rhinitis (2023 Update): Focus on intranasal corticosteroids as first-line therapy for moderate-severe symptoms. Second-generation oral antihistamines preferred over first-generation.",
        asthma: "GINA 2023 Guidelines: Shift away from SABA-only treatment. Preferred reliever is low-dose ICS-formoterol.",
        anaphylaxis: "2023 Anaphylaxis Practice Parameter: Epinephrine is the ONLY first-line treatment. Dose: 0.01 mg/kg. H1/H2 blockers and steroids are ADJUNCTIVE only and do not prevent or treat airway obstruction or hypotension.",
        urticaria: "Chronic Spontaneous Urticaria (CSU) Stepwise Approach: 1. Second-gen antihistamines (up to 4x dose), 2. Omalizumab, 3. Cyclosporine.",
        food_allergy: "NIAID Guidelines: IgE-mediated reactions occur within minutes to 2 hours. Diagnosis requires both history and evidence of sIgE (SPT or Serum sIgE). Oral Food Challenge (OFC) is the gold standard."
    },

    billing_codes: {
        cpt: {
            ep_office_visits: {
                '99202': 'New patient, straightforward MDM',
                '99203': 'New patient, low complexity MDM',
                '99204': 'New patient, moderate complexity MDM (Typical for allergy consults)',
                '99205': 'New patient, high complexity MDM',
                '99212': 'Est patient, straightforward MDM',
                '99213': 'Est patient, low complexity MDM',
                '99214': 'Est patient, moderate complexity MDM',
                '99215': 'Est patient, high complexity MDM'
            },
            allergy_testing: {
                '95004': 'Percutaneous (scratch) testing with allergenic extracts',
                '95024': 'Intracutaneous (intradermal) testing with allergenic extracts',
                '95044': 'Patch testing',
                '95018': 'Allergy testing: drug/biological/venom',
                '95076': 'Ingestion challenge (initial 120 mins)'
            },
            immunotherapy: {
                '95115': 'Single injection',
                '95117': 'Two or more injections',
                '95165': 'Antigen preparation/maintenance'
            }
        }
    },

    clinical_protocols: {
        red_flags: [
            "History of biphasic anaphylaxis",
            "Asthma-COPD overlap",
            "Elevated baseline tryptase (>11.4 ng/mL)",
            "Vocal cord dysfunction mimicking asthma",
            "Aspirin-Exacerbated Respiratory Disease (AERD) Triad"
        ],
        differential_diagnoses: {
            rhinitis: ["Vasomotor rhinitis", "NARES", "Rhinitis medicamentosa", "CSF rhinorrhea"],
            urticaria: ["Urticarial vasculitis", "Bradykinin-mediated angioedema", "Mastocytosis"],
            anaphylaxis: ["Vasovagal syncope", "Panic attack", "Scombroid poisoning", "Carcinoid syndrome"]
        }
    },

    scribe_directives: {
        tone: "Professional, clinical, objective, concise.",
        style: "Third-person medical narrative (e.g., 'The patient reports...' instead of 'I saw a patient...')",
        sections: ["Subjective", "Objective", "Assessment", "Plan", "Billing"]
    }
};

/**
 * Generates a prompt-ready version of the knowledge base
 */
export function getKnowledgeBasePrompt() {
    return `
CLINICAL KNOWLEDGE BASE (GROUNDING):
Use the following medical guidelines and protocols to ensure documentation accuracy:

1. ANAPHYLAXIS: Epinephrine is first-line. Always check for auto-injector prescriptions in history.
2. RHINITIS: Focus on ICD-10 J30 family. Distinguish between seasonal/perennial.
3. ASTHMA: Use GINA classification. Match CPT 94010/94060 for PFTs.
4. CODING: 
   - New Patient: 99202-99205
   - Established: 99212-99215
   - Testing: 95004 (SPT), 95018 (Drug/Venom)
5. STYLE: Document in third-person professional medical narrative.
6. RED FLAGS: Alert on any airway involvement, history of severe reactions without epinephrine, or uncontrolled asthma.
`;
}
