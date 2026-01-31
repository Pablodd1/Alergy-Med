// Sample patients with full mock clinical data for demonstration
// Aligned with extractionSchema in src/types/schemas.ts

export const samplePatients = [
    {
        id: 'demo-patient-1',
        patientAlias: 'Maria S.',
        chiefComplaint: 'Seasonal allergies and suspected shellfish allergy',
        extraction: {
            patientAlias: 'Maria S.',
            visitContext: {
                date: new Date().toISOString(),
                setting: 'outpatient',
                visitType: 'consultation',
                referralSource: 'PCP',
                duration: '45 mins'
            },
            chiefComplaint: 'Seasonal allergies and suspected shellfish allergy',
            hpi: {
                onset: '3 years ago',
                location: 'Nasal, ocular, systemic',
                duration: 'Ongoing',
                characterization: 'Progressive worsening',
                alleviatingFactors: ['Cetirizine', 'Nasal saline'],
                radiatingTo: null,
                timeline: 'Perennial with spring/fall peaks',
                severity: 'Moderate',
                triggers: ['Tree pollen', 'Grass pollen', 'Shellfish'],
                relievers: ['Cetirizine'],
                exposures: ['2 cats at home'],
                environment: ['Older home', 'Carpeted'],
                foodContext: ['Reaction 2 weeks ago after eating shrimp'],
                medicationContext: ['OTC antihistamines'],
                associatedSymptoms: ['Post-nasal drip', 'Sneezing', 'Lip swelling']
            },
            allergyHistory: {
                food: [
                    { allergen: 'Shrimp', reaction: 'Lip swelling, throat tightness, hives', severity: 'severe', timing: 'immediate', dateOrAge: '2 weeks ago', treatmentUsed: 'None', certainty: 'reported' }
                ],
                drug: [
                    { allergen: 'Penicillin', reaction: 'Rash', severity: 'mild', timing: 'delayed', dateOrAge: 'Childhood', treatmentUsed: 'None', certainty: 'reported' }
                ],
                environmental: [
                    { allergen: 'Tree pollen', reaction: 'Rhinitis', seasonality: 'Spring', certainty: 'confirmed' },
                    { allergen: 'Dust mites', reaction: 'Congestion', seasonality: 'Year-round', certainty: 'confirmed' }
                ],
                stingingInsects: [],
                latexOther: []
            },
            atopicComorbidities: {
                asthma: 'yes',
                eczema: 'no',
                chronicRhinitis: 'yes',
                sinusitis: 'no',
                urticariaAngioedema: 'yes',
                foodAllergies: 'yes',
                drugAllergies: 'yes',
                anaphylaxisHistory: 'unknown'
            },
            medications: [
                { name: 'Cetirizine', dose: '10mg', frequency: 'Daily', route: 'Oral', indication: 'Allergic rhinitis', response: 'Partial', adverseEffects: null, startDate: null, prescribedBy: 'PCP' }
            ],
            pmh: ['Hypertension', 'Mild Asthma'],
            psh: ['Appendectomy'],
            fh: ['Father: Asthma'],
            sh: ['Accountant', 'Non-smoker'],
            ros: {
                positives: ['Nasal congestion', 'Itchy eyes'],
                negatives: ['No fever', 'No weight loss']
            },
            vitalSigns: {
                bp: '120/80',
                hr: '72',
                rr: '16',
                temp: '98.6',
                spo2: '99',
                weight: '150lbs',
                height: '5\'4"',
                bmi: '25.7'
            },
            exam: ['Nasal mucosa pale and boggy', 'No wheezing'],
            testsAndLabs: {
                allergyTesting: [
                    { type: 'SPT', date: 'Today', keyFindings: 'Positive to birch and timothy', allergensPositive: ['Birch', 'Timothy'], allergensNegative: ['Ragweed'], confidence: 'high' }
                ],
                labs: [
                    { panel: 'CBC', date: 'Yesterday', abnormalFindings: [], notableNormals: ['Eosinophils normal'], confidence: 'high' }
                ],
                imagingOrOther: []
            },
            assessmentCandidates: [
                { problem: 'Allergic Rhinitis', icd10Code: 'J30.1', supportingEvidence: ['Positive SPT', 'History'], confidence: 'high' }
            ],
            clinicalReasoning: 'Patient presents with classic IgE-mediated rhinitis and concerning history for shellfish allergy.',
            planCandidates: [
                { item: 'Prescribe Epinephrine', rationale: 'Risk of anaphylaxis', cptCode: null, priority: 'high', category: 'therapeutic' }
            ],
            cptCodes: [
                { code: '99204', description: 'New Patient Office Visit', rationale: 'Complex MDM', confidence: 'high', modifier: null, units: 1 }
            ],
            icd10Codes: [
                { code: 'J30.1', description: 'Allergic rhinitis', isPrimary: true, supportingEvidence: ['History'], confidence: 'high' }
            ],
            redFlags: [
                { flag: 'Shellfish reaction with throat tightness', severity: 'critical', recommendation: 'Avoid shellfish, prescribe EpiPen' }
            ],
            missingInformation: [],
            recommendedTests: [],
            needsConfirmation: [],
            sourceQualityFlags: [],
            soapNote: null
        }
    },
    {
        id: 'demo-patient-2',
        patientAlias: 'James T.',
        chiefComplaint: 'Recurrent hives and suspected drug allergy to NSAIDs',
        extraction: {
            patientAlias: 'James T.',
            visitContext: {
                date: new Date().toISOString(),
                setting: 'outpatient',
                visitType: 'consultation',
                referralSource: 'Self',
                duration: '30 mins'
            },
            chiefComplaint: 'Recurrent chronic urticaria',
            hpi: {
                onset: '8 months ago',
                location: 'Trunk and extremities',
                duration: 'Ongoing',
                characterization: 'Wheals and itching',
                alleviatingFactors: ['Diphenhydramine'],
                radiatingTo: null,
                timeline: 'Chronic, 3-4x per week',
                severity: 'Moderate',
                triggers: ['Ibuprofen', 'Stress'],
                relievers: ['Cool compresses'],
                exposures: ['Takes ibuprofen for back pain'],
                environment: ['No changes'],
                foodContext: [],
                medicationContext: ['Exacerbation with NSAIDs'],
                associatedSymptoms: ['Lip swelling', 'Itching']
            },
            allergyHistory: {
                food: [],
                drug: [
                    { allergen: 'Ibuprofen', reaction: 'Urticaria, angioedema', severity: 'severe', timing: 'immediate', dateOrAge: '3 months ago', treatmentUsed: 'Diphenhydramine', certainty: 'confirmed' }
                ],
                environmental: [],
                stingingInsects: [
                    { allergen: 'Yellow jacket', reaction: 'Large local', severity: 'moderate', certainty: 'reported' }
                ],
                latexOther: []
            },
            atopicComorbidities: {
                asthma: 'no',
                eczema: 'no',
                chronicRhinitis: 'no',
                sinusitis: 'no',
                urticariaAngioedema: 'yes',
                foodAllergies: 'no',
                drugAllergies: 'yes',
                anaphylaxisHistory: 'no'
            },
            medications: [
                { name: 'Lisinopril', dose: '10mg', frequency: 'Daily', route: 'Oral', indication: 'HTN', response: 'Controlled', adverseEffects: null, startDate: null, prescribedBy: 'PCP' }
            ],
            pmh: ['Hypertension', 'Back pain'],
            psh: ['Laminectomy'],
            fh: [],
            sh: ['Retired construction worker'],
            ros: {
                positives: ['Hives', 'Lip swelling'],
                negatives: ['No dyspnea']
            },
            vitalSigns: {
                bp: '134/86',
                hr: '72',
                rr: '14',
                temp: '98.2',
                spo2: '99',
                weight: '195lbs',
                height: '5\'10"',
                bmi: '28.0'
            },
            exam: ['Multiple urticarial wheals on trunk'],
            testsAndLabs: {
                allergyTesting: [],
                labs: [],
                imagingOrOther: []
            },
            assessmentCandidates: [
                { problem: 'Chronic Spontaneous Urticaria', icd10Code: 'L50.1', supportingEvidence: ['Clinical exam'], confidence: 'high' }
            ],
            clinicalReasoning: 'Likely chronic urticaria exacerbated by NSAID usage.',
            planCandidates: [
                { item: 'NSAID avoidance', rationale: 'Known trigger', cptCode: null, priority: 'high', category: 'therapeutic' }
            ],
            cptCodes: [
                { code: '99214', description: 'Office Visit', rationale: 'Moderate complexity', confidence: 'high', modifier: null, units: 1 }
            ],
            icd10Codes: [
                { code: 'L50.1', description: 'Idiopathic urticaria', isPrimary: true, supportingEvidence: ['Clinical'], confidence: 'high' }
            ],
            redFlags: [],
            missingInformation: [],
            recommendedTests: [],
            needsConfirmation: [],
            sourceQualityFlags: [],
            soapNote: null
        }
    }
];

export function getSamplePatient(index: number) {
    return samplePatients[index] || samplePatients[0];
}

export function getAllSamplePatients() {
    return samplePatients;
}
