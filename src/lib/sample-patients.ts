// Sample patients with full mock clinical data for demonstration
export const samplePatients = [
    {
        id: 'demo-patient-1',
        patientAlias: 'Patient A - Maria S.',
        chiefComplaint: 'Seasonal allergies with worsening symptoms, possible food allergy to shellfish',
        extraction: {
            patientAlias: 'Maria S.',
            chiefComplaint: 'Seasonal allergies with worsening symptoms and suspected shellfish allergy after restaurant reaction',
            hpi: {
                onset: '3 years ago, worsening over past 6 months',
                timeline: 'Perennial with spring/fall exacerbation',
                frequency: 'Daily symptoms during peak seasons',
                severity: 'Moderate to severe, affecting sleep and work',
                triggers: ['Tree pollen', 'Grass pollen', 'Dust mites', 'Shellfish'],
                relievers: ['Cetirizine', 'Nasal saline', 'Air conditioning'],
                exposures: ['Works in office with poor ventilation', 'Has 2 cats at home'],
                environment: ['Carpeted bedroom', 'Older home with possible mold'],
                foodContext: ['Reaction 2 weeks ago after eating shrimp scampi at restaurant'],
                medicationContext: ['Taking OTC antihistamines with partial relief']
            },
            allergyHistory: {
                food: [
                    { allergen: 'Shrimp', reaction: 'Lip swelling, throat tightness, hives', severity: 'severe', timing: 'immediate', certainty: 'reported', lifeThreatening: true },
                    { allergen: 'Crab', reaction: 'Suspected cross-reactivity', severity: 'unknown', certainty: 'unclear' }
                ],
                drug: [
                    { allergen: 'Penicillin', reaction: 'Rash as child', severity: 'mild', certainty: 'reported' }
                ],
                environmental: [
                    { allergen: 'Tree pollen (birch, oak)', reaction: 'Rhinorrhea, sneezing, itchy eyes', seasonality: 'Spring', certainty: 'confirmed' },
                    { allergen: 'Grass pollen', reaction: 'Nasal congestion, sneezing', seasonality: 'Late spring/summer', certainty: 'confirmed' },
                    { allergen: 'Dust mites', reaction: 'Perennial rhinitis, morning congestion', seasonality: 'Year-round', certainty: 'confirmed' },
                    { allergen: 'Cat dander', reaction: 'Rhinitis when highly exposed', seasonality: 'Perennial', certainty: 'reported' }
                ],
                stingingInsects: [],
                latexOther: []
            },
            medications: [
                { name: 'Cetirizine', dose: '10mg', frequency: 'Daily', indication: 'Allergic rhinitis', isActive: true, response: 'Partial relief' },
                { name: 'Fluticasone nasal spray', dose: '50mcg', frequency: 'Two sprays each nostril daily', indication: 'Nasal congestion', isActive: true, response: 'Moderate improvement' },
                { name: 'Metformin', dose: '500mg', frequency: 'Twice daily', indication: 'Type 2 diabetes', isActive: true }
            ],
            pmh: ['Type 2 Diabetes Mellitus', 'Hypertension', 'Mild persistent asthma'],
            psh: ['Appendectomy (2015)'],
            fh: ['Mother: allergic rhinitis, asthma', 'Father: diabetes', 'Sister: eczema, food allergies'],
            sh: ['Non-smoker', 'Occasional alcohol', 'Works as accountant', 'Lives with spouse and 2 cats', 'No recent travel'],
            ros: { positives: ['Nasal congestion', 'Post-nasal drip', 'Itchy watery eyes', 'Occasional wheezing', 'Fatigue'], negatives: ['No headaches', 'No fever', 'No shortness of breath at rest'] },
            exam: ['General: Well-appearing, no acute distress', 'HEENT: Allergic shiners, pale boggy turbinates, clear rhinorrhea', 'Eyes: Mild conjunctival injection bilaterally', 'Lungs: Clear, no wheezing', 'Skin: No rashes or urticaria currently'],
            vitalSigns: { bp: '128/82', hr: 76, rr: 16, temp: 98.4, spo2: 98, weight: '165 lbs', height: '5\'6"' },
            testsAndLabs: { skinPrickTest: [{ allergen: 'Birch', result: '4+ positive' }, { allergen: 'Timothy grass', result: '3+ positive' }, { allergen: 'D. pteronyssinus', result: '4+ positive' }], bloodWork: [{ name: 'Total IgE', value: '285', unit: 'IU/mL', referenceRange: '<100' }, { name: 'Shrimp sIgE', value: '12.5', unit: 'kU/L', referenceRange: '<0.35' }] },
            assessmentCandidates: [
                { problem: 'Allergic rhinitis, moderate-severe persistent', confidence: 'high' },
                { problem: 'IgE-mediated shellfish (shrimp) allergy with anaphylaxis risk', confidence: 'high' },
                { problem: 'Possible tropomyosin sensitization (shellfish cross-reactivity)', confidence: 'medium' },
                { problem: 'Mild persistent asthma, well-controlled', confidence: 'high' }
            ],
            planCandidates: [
                { item: 'Prescribe epinephrine auto-injector (EpiPen) for shellfish allergy', priority: 'high' },
                { item: 'Strict shellfish avoidance counseling', priority: 'high' },
                { item: 'Consider SCIT for environmental allergies', priority: 'medium' },
                { item: 'Component testing for tropomyosin', priority: 'medium' },
                { item: 'Continue current rhinitis medications', priority: 'routine' }
            ],
            cptCodes: [
                { code: '99214', description: 'Office visit, established patient, moderate complexity', rationale: 'Detailed history, examination, moderate MDM', confidence: 'high' },
                { code: '95004', description: 'Percutaneous allergy skin testing x 15 allergens', rationale: 'SPT performed for environmental allergens', confidence: 'high' },
                { code: '86003', description: 'Allergen specific IgE (shrimp)', rationale: 'Blood test to confirm shellfish allergy', confidence: 'high' }
            ],
            icd10Codes: [
                { code: 'J30.1', description: 'Allergic rhinitis due to pollen', isPrimary: true, confidence: 'high' },
                { code: 'J30.89', description: 'Other allergic rhinitis (perennial)', isPrimary: false, confidence: 'high' },
                { code: 'Z91.010', description: 'Allergy to peanuts', isPrimary: false, confidence: 'high' },
                { code: 'T78.00XA', description: 'Anaphylactic reaction due to shellfish, initial', isPrimary: false, confidence: 'medium' },
                { code: 'J45.20', description: 'Mild intermittent asthma, uncomplicated', isPrimary: false, confidence: 'high' }
            ],
            redFlags: [
                { flag: 'History of anaphylactic symptoms to shellfish without epinephrine prescription', severity: 'critical', recommendation: 'Prescribe EpiPen immediately and provide anaphylaxis action plan' },
                { flag: 'Possible asthma with allergic rhinitis - atopic march risk', severity: 'medium', recommendation: 'Monitor asthma control, consider spirometry' }
            ],
            missingInformation: [
                { field: 'Spirometry/PFT', description: 'Pulmonary function testing to assess asthma severity', priority: 'recommended' },
                { field: 'Component testing', description: 'Tropomyosin and other shellfish components', priority: 'recommended' }
            ],
            recommendedTests: [
                { test: 'Spirometry with bronchodilator response', rationale: 'Baseline lung function assessment', urgency: 'routine' },
                { test: 'Component testing: tropomyosin, shrimp Der p 10', rationale: 'Assess cross-reactivity risk to other crustaceans', urgency: 'recommended' }
            ],
            soapNote: {
                subjective: '42-year-old female with 3-year history of worsening seasonal allergies presenting for evaluation. Reports perennial symptoms with spring/fall exacerbation. Symptoms include nasal congestion, sneezing, rhinorrhea, and itchy watery eyes affecting sleep and work performance. Also reports concerning reaction 2 weeks ago after eating shrimp - developed lip swelling, throat tightness, and diffuse hives within 30 minutes of ingestion.',
                objective: 'Vitals: BP 128/82, HR 76, RR 16, Temp 98.4°F, SpO2 98%. General: Well-appearing female in no acute distress. HEENT: Allergic shiners present, nasal mucosa pale and boggy with clear secretions. Eyes: Mild bilateral conjunctival injection. Lungs: Clear to auscultation bilaterally. Skin testing positive to birch (4+), timothy grass (3+), dust mites (4+). Shrimp sIgE elevated at 12.5 kU/L.',
                assessment: '1. Moderate-severe persistent allergic rhinitis (J30.1, J30.89)\n2. IgE-mediated shellfish allergy with history of anaphylaxis (T78.00XA)\n3. Mild persistent asthma, well-controlled (J45.20)',
                plan: '1. CRITICAL: Prescribe EpiPen 0.3mg, demonstrate proper use, provide anaphylaxis action plan\n2. Strict shellfish avoidance - all crustaceans pending component testing\n3. Continue cetirizine and fluticasone for rhinitis\n4. Order component testing (tropomyosin) to assess cross-reactivity\n5. Consider SCIT for environmental allergy management\n6. Spirometry at next visit\n7. Return in 4 weeks or sooner if symptoms worsen'
            }
        }
    },
    {
        id: 'demo-patient-2',
        patientAlias: 'Patient B - James T.',
        chiefComplaint: 'Recurrent hives and suspected drug allergy to NSAIDs',
        extraction: {
            patientAlias: 'James T.',
            chiefComplaint: 'Recurrent chronic urticaria and suspected NSAID-exacerbated cutaneous disease',
            hpi: {
                onset: 'Urticaria started 8 months ago',
                timeline: 'Chronic, occurring 3-4 times per week',
                frequency: 'Episodes lasting 2-6 hours',
                severity: 'Moderate - large wheals, significant itching',
                triggers: ['Ibuprofen', 'Aspirin', 'Stress', 'Sometimes no identifiable trigger'],
                relievers: ['Diphenhydramine', 'Cool compresses'],
                exposures: ['Takes ibuprofen regularly for back pain'],
                environment: ['No recent changes to home environment'],
                foodContext: ['No clear food triggers identified'],
                medicationContext: ['Noticed worsening hives after taking ibuprofen for back pain']
            },
            allergyHistory: {
                food: [],
                drug: [
                    { allergen: 'Ibuprofen', reaction: 'Severe urticaria, angioedema of lips', severity: 'severe', certainty: 'confirmed' },
                    { allergen: 'Aspirin', reaction: 'Hives', severity: 'moderate', certainty: 'reported' },
                    { allergen: 'Naproxen', reaction: 'Suspected cross-reactivity', severity: 'unknown', certainty: 'unclear' }
                ],
                environmental: [],
                stingingInsects: [
                    { allergen: 'Yellow jacket', reaction: 'Large local reaction', severity: 'moderate', certainty: 'reported' }
                ],
                latexOther: []
            },
            medications: [
                { name: 'Lisinopril', dose: '10mg', frequency: 'Daily', indication: 'Hypertension', isActive: true },
                { name: 'Atorvastatin', dose: '20mg', frequency: 'Daily', indication: 'Hyperlipidemia', isActive: true },
                { name: 'Diphenhydramine', dose: '25mg', frequency: 'As needed', indication: 'Urticaria', isActive: true, response: 'Provides temporary relief' }
            ],
            pmh: ['Hypertension', 'Hyperlipidemia', 'Chronic low back pain', 'GERD'],
            psh: ['Lumbar laminectomy (2020)'],
            fh: ['Father: coronary artery disease', 'Mother: rheumatoid arthritis', 'No known family allergies'],
            sh: ['Former smoker (quit 5 years ago)', 'Social alcohol', 'Retired construction worker'],
            ros: { positives: ['Recurrent hives', 'Itching', 'Occasional lip swelling', 'Chronic back pain'], negatives: ['No wheezing', 'No GI symptoms', 'No joint swelling'] },
            exam: ['General: Well-appearing male in no distress', 'Skin: Multiple urticarial wheals on trunk and extremities, no angioedema today', 'HEENT: Normal', 'Lungs: Clear', 'Cardiovascular: Regular rhythm, no murmurs'],
            vitalSigns: { bp: '134/86', hr: 72, rr: 14, temp: 98.2, spo2: 99, weight: '195 lbs', height: '5\'10"' },
            assessmentCandidates: [
                { problem: 'Chronic spontaneous urticaria', confidence: 'high' },
                { problem: 'NSAID-exacerbated cutaneous disease (NECD)', confidence: 'high' },
                { problem: 'Possible COX-1 inhibitor hypersensitivity', confidence: 'medium' }
            ],
            planCandidates: [
                { item: 'Strict NSAID avoidance - all COX-1 inhibitors', priority: 'high' },
                { item: 'Start second-generation H1 antihistamine (cetirizine 10mg BID)', priority: 'high' },
                { item: 'Acetaminophen for pain management', priority: 'high' },
                { item: 'Consider omalizumab if refractory', priority: 'medium' },
                { item: 'UAS7 diary for symptom tracking', priority: 'routine' }
            ],
            cptCodes: [
                { code: '99215', description: 'Office visit, established patient, high complexity', rationale: 'Complex chronic condition requiring detailed evaluation and MDM', confidence: 'high' },
                { code: '95018', description: 'Allergy evaluation and management', rationale: 'Drug allergy counseling and management plan', confidence: 'medium' }
            ],
            icd10Codes: [
                { code: 'L50.1', description: 'Idiopathic urticaria', isPrimary: true, confidence: 'high' },
                { code: 'T88.7XXA', description: 'Unspecified adverse effect of drug', isPrimary: false, confidence: 'high' },
                { code: 'Z88.1', description: 'Allergy status to other antibiotic agents', isPrimary: false, confidence: 'medium' }
            ],
            redFlags: [
                { flag: 'History of angioedema with NSAIDs - risk for severe reaction', severity: 'high', recommendation: 'Strict COX-1 NSAID avoidance, prescribe EpiPen for emergency use' },
                { flag: 'Patient on ACE inhibitor (lisinopril) with angioedema history', severity: 'high', recommendation: 'Consider switching from lisinopril to ARB, discuss with PCP' }
            ],
            missingInformation: [
                { field: 'Thyroid function tests', description: 'Rule out autoimmune thyroid disease associated with CSU', priority: 'recommended' },
                { field: 'CU Index or autologous serum skin test', description: 'Evaluate for autoimmune urticaria component', priority: 'optional' }
            ],
            recommendedTests: [
                { test: 'CBC with differential', rationale: 'Rule out underlying eosinophilia or infection', urgency: 'routine' },
                { test: 'TSH and anti-thyroid antibodies', rationale: 'Association between chronic urticaria and autoimmune thyroiditis', urgency: 'routine' }
            ],
            soapNote: {
                subjective: '58-year-old male with 8-month history of recurrent hives presenting for evaluation. Reports wheals occurring 3-4 times weekly lasting 2-6 hours. Notes significant exacerbation with NSAID use. Had severe episode with lip swelling after ibuprofen 3 months ago. Currently using diphenhydramine for relief.',
                objective: 'Vitals: BP 134/86, HR 72, SpO2 99%. Examination reveals multiple urticarial wheals on trunk and extremities, no active angioedema. HEENT and lungs normal.',
                assessment: '1. Chronic spontaneous urticaria (L50.1)\n2. NSAID-exacerbated cutaneous disease with history of angioedema\n3. Possible contribution from ACE inhibitor',
                plan: '1. Strict NSAID avoidance (ibuprofen, aspirin, naproxen, and all COX-1 inhibitors)\n2. Start cetirizine 10mg twice daily for urticaria control\n3. Prescribe EpiPen given history of angioedema\n4. Use acetaminophen only for pain\n5. Recommend discussing lisinopril alternative with PCP\n6. Labs: CBC, TSH, anti-TPO\n7. Start UAS7 symptom diary\n8. Return in 4 weeks for reassessment'
            }
        }
    },
    {
        id: 'demo-patient-3',
        patientAlias: 'Patient C - Emily R.',
        chiefComplaint: 'Pediatric patient with eczema, food allergies, and recurrent wheezing',
        extraction: {
            patientAlias: 'Emily R.',
            chiefComplaint: '5-year-old with severe atopic dermatitis, multiple food allergies, and asthma symptoms',
            hpi: {
                onset: 'Eczema since infancy (3 months old), food allergies identified at age 1',
                timeline: 'Chronic eczema with intermittent flares, asthma symptoms started age 3',
                frequency: 'Eczema flares weekly, wheezing episodes 2-3x monthly',
                severity: 'Moderate-severe eczema (SCORAD 45), mild persistent wheezing',
                triggers: ['Eggs', 'Peanuts', 'Viral infections', 'Exercise', 'Cold air'],
                relievers: ['Emollients', 'Topical steroids', 'Albuterol'],
                exposures: ['Attends preschool', 'Family dog at home'],
                environment: ['Suburban home', 'No smoking in home', 'Central AC'],
                foodContext: ['Anaphylaxis to peanut at age 2, avoids eggs and peanuts strictly'],
                medicationContext: ['Using topical steroids and emollients regularly for eczema']
            },
            allergyHistory: {
                food: [
                    { allergen: 'Peanut', reaction: 'Anaphylaxis - hives, vomiting, difficulty breathing', severity: 'severe', timing: 'immediate', certainty: 'confirmed', lifeThreatening: true },
                    { allergen: 'Egg', reaction: 'Hives and facial swelling', severity: 'moderate', timing: 'immediate', certainty: 'confirmed' },
                    { allergen: 'Tree nuts', reaction: 'Not tested - avoidance recommended', severity: 'unknown', certainty: 'unclear' }
                ],
                drug: [],
                environmental: [
                    { allergen: 'Dog dander', reaction: 'Rhinitis, eczema flares', seasonality: 'Perennial', certainty: 'confirmed' },
                    { allergen: 'Dust mites', reaction: 'Rhinitis', seasonality: 'Perennial', certainty: 'confirmed' }
                ],
                stingingInsects: [],
                latexOther: []
            },
            medications: [
                { name: 'Triamcinolone 0.1% cream', dose: 'Thin layer', frequency: 'BID to affected areas', indication: 'Atopic dermatitis', isActive: true },
                { name: 'Cerave Moisturizing Cream', dose: 'Generous amount', frequency: 'TID and after bathing', indication: 'Eczema maintenance', isActive: true },
                { name: 'Albuterol HFA', dose: '2 puffs', frequency: 'As needed for wheezing', indication: 'Asthma', isActive: true },
                { name: 'Fluticasone 44mcg', dose: '1 puff', frequency: 'BID', indication: 'Asthma maintenance', isActive: true },
                { name: 'Epinephrine auto-injector', dose: '0.15mg (Jr)', frequency: 'Emergency use', indication: 'Anaphylaxis', isActive: true }
            ],
            pmh: ['Atopic dermatitis since infancy', 'IgE-mediated food allergies', 'Mild persistent asthma', 'Allergic rhinitis'],
            psh: [],
            fh: ['Mother: asthma, eczema', 'Father: allergic rhinitis', 'Older brother: peanut allergy'],
            sh: ['Attends preschool full-time', 'Lives with parents, older brother, and family dog', 'No secondhand smoke exposure'],
            ros: { positives: ['Itchy skin', 'Sleep disturbance from scratching', 'Occasional wheezing with colds', 'Runny nose'], negatives: ['No growth concerns', 'No GI symptoms', 'No recurrent infections'] },
            exam: ['General: Well-appearing 5-year-old female, active', 'Skin: Lichenified patches in antecubital and popliteal fossae, erythematous patches on cheeks', 'HEENT: Allergic shiners, pale turbinates', 'Lungs: Clear, no wheezing today', 'Growth: Weight 50th percentile, Height 55th percentile'],
            vitalSigns: { bp: '95/60', hr: 92, rr: 20, temp: 98.6, spo2: 99, weight: '42 lbs', height: '43 inches' },
            testsAndLabs: { skinPrickTest: [], bloodWork: [{ name: 'Total IgE', value: '580', unit: 'IU/mL', referenceRange: '<90 for age' }, { name: 'Peanut sIgE', value: '>100', unit: 'kU/L', referenceRange: '<0.35' }, { name: 'Egg white sIgE', value: '8.5', unit: 'kU/L', referenceRange: '<0.35' }, { name: 'Ara h 2 (peanut component)', value: '45', unit: 'kU/L', referenceRange: '<0.1' }] },
            assessmentCandidates: [
                { problem: 'Moderate-severe atopic dermatitis (SCORAD 45)', confidence: 'high' },
                { problem: 'IgE-mediated peanut allergy with anaphylaxis history', confidence: 'high' },
                { problem: 'IgE-mediated egg allergy', confidence: 'high' },
                { problem: 'Mild persistent asthma', confidence: 'high' },
                { problem: 'Allergic rhinitis', confidence: 'high' },
                { problem: 'Atopic march progression', confidence: 'medium' }
            ],
            planCandidates: [
                { item: 'Continue strict peanut and egg avoidance', priority: 'high' },
                { item: 'Update EpiPen to weight-appropriate dose', priority: 'high' },
                { item: 'Consider peanut OIT candidacy evaluation', priority: 'medium' },
                { item: 'Optimize eczema with step-up therapy if needed', priority: 'medium' },
                { item: 'Annual egg tolerance re-evaluation', priority: 'routine' },
                { item: 'Discuss dog dander reduction strategies', priority: 'routine' }
            ],
            cptCodes: [
                { code: '99214', description: 'Office visit, established patient, moderate complexity', rationale: 'Multiple chronic allergic conditions requiring management', confidence: 'high' },
                { code: '86003', description: 'Allergen specific IgE panel', rationale: 'Component testing for peanut', confidence: 'high' },
                { code: '96372', description: 'Therapeutic injection', rationale: 'EpiPen training demonstration', confidence: 'medium' }
            ],
            icd10Codes: [
                { code: 'L20.9', description: 'Atopic dermatitis, unspecified', isPrimary: true, confidence: 'high' },
                { code: 'T78.01XA', description: 'Anaphylactic reaction due to peanuts', isPrimary: false, confidence: 'high' },
                { code: 'T78.09XA', description: 'Anaphylactic reaction due to other food products (egg)', isPrimary: false, confidence: 'high' },
                { code: 'J45.20', description: 'Mild intermittent asthma', isPrimary: false, confidence: 'high' },
                { code: 'J30.9', description: 'Allergic rhinitis, unspecified', isPrimary: false, confidence: 'high' }
            ],
            redFlags: [
                { flag: 'History of peanut anaphylaxis - ensure EpiPen available and not expired', severity: 'critical', recommendation: 'Verify EpiPen expiration, update prescription if needed, review emergency action plan' },
                { flag: 'Highly elevated Ara h 2 component suggests high risk for severe peanut reactions', severity: 'critical', recommendation: 'Strict avoidance, school 504 plan recommended' },
                { flag: 'Multiple atopic conditions - monitor for progression', severity: 'medium', recommendation: 'Annual reassessment of all allergic conditions' }
            ],
            missingInformation: [
                { field: 'Spirometry', description: 'Baseline lung function when age-appropriate', priority: 'recommended' },
                { field: 'Tree nut testing', description: 'Determine if tree nuts need to be avoided', priority: 'recommended' }
            ],
            recommendedTests: [
                { test: 'Tree nut panel sIgE', rationale: 'Common co-sensitization with peanut', urgency: 'recommended' },
                { test: 'Annual egg sIgE trend', rationale: 'Monitor for potential resolution', urgency: 'routine' }
            ],
            soapNote: {
                subjective: '5-year-old female with history of severe atopic dermatitis since infancy, peanut anaphylaxis at age 2, and egg allergy presenting for routine allergy follow-up. Mother reports eczema flares weekly despite treatment, wheezing episodes 2-3 times monthly usually with viral infections. Currently avoiding peanut and eggs strictly.',
                objective: 'Vitals age-appropriate. Well-appearing child. Skin shows lichenified plaques in flexural areas consistent with chronic atopic dermatitis. Allergic shiners present. Lungs clear. Growth on track. Labs: Total IgE 580, Peanut sIgE >100, Ara h 2 = 45 kU/L (highly elevated), Egg white sIgE 8.5.',
                assessment: '1. Moderate-severe atopic dermatitis (L20.9)\n2. IgE-mediated peanut allergy with anaphylaxis history - high risk (T78.01XA)\n3. IgE-mediated egg allergy (T78.09XA)\n4. Mild persistent asthma (J45.20)\n5. Allergic rhinitis (J30.9)\n6. Classic atopic march presentation',
                plan: '1. CRITICAL: Update EpiPen Jr to 0.15mg x2, verify expiration, review anaphylaxis action plan\n2. Continue strict peanut avoidance - review school 504 plan\n3. Discuss peanut OIT as future option when family ready\n4. Optimize eczema: continue current regimen, consider tacrolimus for face\n5. Order tree nut panel\n6. Continue asthma controller, ensure peak flow monitoring\n7. Discuss dog dander reduction vs. rehoming\n8. Return in 6 months or sooner for concerns'
            }
        }
    }
];

export function getSamplePatient(index: number) {
    return samplePatients[index] || samplePatients[0];
}

export function getAllSamplePatients() {
    return samplePatients;
}
