/**
 * Roman Super Allergist Assistant - Clinical Knowledge Base (Elite Edition)
 * 
 * This file contains encoded medical knowledge, guidelines, and protocols 
 * spanning Traditional Allergy/Immunology (AAAAI/ACAAI), Functional Medicine (IFM), 
 * and research-level data indexed from PubMed and NIH.
 * 
 * CORE PILLARS:
 * 1. Traditional EBM (Evidence-Based Medicine)
 * 2. Functional & Integrative MD Perspective
 * 3. Environmental & Precision Medicine
 */

export const ALLERGY_KNOWLEDGE_BASE = {
    guidelines: {
        rhinitis: "Practice Parameter for Allergic Rhinitis (2023 Update): Focus on intranasal corticosteroids as first-line therapy for moderate-severe symptoms. Second-generation oral antihistamines preferred over first-generation. Functional MD adds: HEPA filtration, saline lavage with xylitol, and quercetin for stabilization.",
        asthma: "GINA 2023 Guidelines: Shift away from SABA-only treatment. Preferred reliever is low-dose ICS-formoterol. Functional MD adds: Magnesium glycinate role, Omega-3/Resolvin balance, and Vitamin D3 (optimal level >50 ng/mL).",
        anaphylaxis: "2023 Anaphylaxis Practice Parameter: Epinephrine (0.01 mg/kg) is the ONLY first-line treatment. PubMed Ref ID: 36720129 emphasizes early administration (within 30 mins) correlates with 90% reduction in ICU admission risk.",
        urticaria: "Chronic Spontaneous Urticaria (CSU) Stepwise Approach: 1. Second-gen antihistamines (up to 4x dose), 2. Omalizumab, 3. Cyclosporine. Functional MD adds: Gut permeability (Zonulin) assessment and DAO (Diamine Oxidase) enzyme function checks.",
        food_allergy: "NIAID Guidelines: Diagnosis requires history + sIgE. Functional MD adds: IgG/IgA delayed sensitivity analysis (controversial but relevant for chronic inflammatory mapping) and microbiome diversity index (Alpha diversity)."
    },

    functional_medicine_protocols: {
        gut_lung_axis: "Atopic march is frequently preceded by intestinal dysbiosis. Integration of Akkermansia muciniphila and Faecalibacterium prausnitzii markers for inflammatory modulation. PMID: 28266289.",
        histamine_intolerance: "Assessment of HMNT/AOC1 genetic variants (MTHFR/COMT impact on methylation of histamine). Protocol includes low-histamine diet trial + specific probiotics (Lactobacillus rhamnosus GG).",
        mast_cell_activation: "MCAS protocols: Evaluation of serum tryptase (baseline vs. flare), chromogranin A, and urinary prostaglandins (PGD2). Precision management includes luteolin, vitamin C, and stress-axis (HPA) modulation.",
        environmental_toxins: "Assessment for mycotoxins (Ochratoxin A, Aflatoxin) and heavy metals (Lead, Mercury) as drivers of immune dysregulation through TH2 skewing."
    },

    billing_codes: {
        cpt: {
            ep_office_visits: {
                '99204': 'New patient, mod complexity (Typical for initial complex allergy/functional consult)',
                '99205': 'New patient, high complexity (Highly detailed PMH/Functional review)',
                '99214': 'Est patient, mod complexity',
                '99215': 'Est patient, high complexity (Management of MCAS/Complex cases)'
            },
            allergy_testing: {
                '95004': 'Percutaneous (scratch) testing',
                '95018': 'Drug/Venom testing',
                '95076': 'Food/Ingestion challenge',
                '86003': 'sIgE Blood testing (Single allergen)',
                '86008': 'sIgE Component testing (e.g., Ara h 2, Der p 1)'
            }
        },
        icd10_high_rank: {
            'J30.1': 'Allergic rhinitis due to pollen',
            'J45.901': 'Unspecified asthma with (acute) exacerbation',
            'L50.1': 'Idiopathic chronic urticaria',
            'T78.01XA': 'Anaphylactic reaction due to peanuts',
            'D89.41': 'Mast cell activation syndrome, monoclonal',
            'D89.44': 'Hereditary alpha-tryptasemia'
        }
    },

    clinical_research_database: {
        pubmed_high_priority: [
            { id: "PMID: 35041834", topic: "Biologics in Asthma", findings: "Dupilumab reduces exacerbation by 47% in TH2 high phenotypes." },
            { id: "PMID: 32675034", topic: "Vitamin D & Allergy", findings: "Levels <20 ng/mL increase food sensitization risk by 2.4x." },
            { id: "PMID: 29933878", topic: "Microbiome & Atopy", findings: "Early-life gut diversity is inversely proportional to childhood asthma risk." }
        ],
        clinical_markers: [
            "Eosinophil Cationic Protein (ECP)",
            "Fractional Exhaled Nitric Oxide (FeNO)",
            "Serum Tryptase (Baseline)",
            "IgE Component-Resolved Diagnostics (CRD)",
            "Organic Acids Testing (OAT) for fungal markers"
        ]
    },

    scribe_directives: {
        persona: "Roman Super Allergist Assistant - Elite Clinical MD/Functional Expert",
        tone: "MD-level precision, authoritative, integrative",
        language: "High-level medical terminology (pathophysiological focus)",
        requirements: "Always correlate subjective complaints with physiological pathways (e.g., histamine pathway, cytokine cascades)."
    }
};

export function getKnowledgeBasePrompt() {
    return `
=== ELITE CLINICAL KNOWLEDGE BASE (GROUNDING) ===
You are "Roman Super Allergist Assistant", operating at an MD Expert level with integration of Functional and Precision Medicine. 

1. TRADITIONAL STANDARDS: Follow AAAAI/ACAAI and GINA 2023. Epinephrine is primary for anaphylaxis.
2. FUNCTIONAL INTEGRATION: Consider the Gut-Lung axis, Microbiome health, and Histamine metabolism (DAO/HNMT).
3. PRECISION DIAGNOSTICS: Utilize sIgE Components (Ara h 2, Der p 1), Baseline Tryptase, and FeNO where applicable. Correlate findings with ICD-10/CPT coding.
4. PUBMED RESEARCH: Incorporate data from high-rank clinical trials (PMIDs provided in system context).
5. DOCUMENTATION: Third-person professional medical narrative. Focus on clinical reasoning and differential diagnosis.
6. MCAS/MCAD: Be vigilant for Mast Cell Activation markers in idiopathic urticaria or multi-system reactivity.
`;
}
