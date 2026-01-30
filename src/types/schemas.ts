import { z } from 'zod';

// ============================================================================
// ALLERGY SCRIBE - CLINICAL DATA SCHEMAS
// Production-Grade Medical Documentation for Allergists & Internal Medicine
// ============================================================================

// Allergy History Schemas
const allergyItemSchema = z.object({
  allergen: z.string(),
  reaction: z.string().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening', 'unknown']).nullable(),
  timing: z.enum(['immediate', 'delayed', 'unknown']).nullable(),
  dateOrAge: z.string().nullable(),
  treatmentUsed: z.string().nullable(),
  certainty: z.enum(['confirmed', 'reported', 'suspected', 'ruled-out', 'unclear'])
});

const environmentalAllergySchema = z.object({
  allergen: z.string(),
  reaction: z.string().nullable(),
  seasonality: z.string().nullable(),
  certainty: z.enum(['confirmed', 'reported', 'suspected', 'ruled-out', 'unclear'])
});

const stingingInsectAllergySchema = z.object({
  allergen: z.string(),
  reaction: z.string().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening', 'unknown']).nullable(),
  certainty: z.enum(['confirmed', 'reported', 'suspected', 'ruled-out', 'unclear'])
});

const latexOtherAllergySchema = z.object({
  allergen: z.string(),
  reaction: z.string().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe', 'life-threatening', 'unknown']).nullable(),
  certainty: z.enum(['confirmed', 'reported', 'suspected', 'ruled-out', 'unclear'])
});

// HPI Schema (SOAP - Subjective)
const hpiSchema = z.object({
  onset: z.string().nullable(),
  location: z.string().nullable(),
  duration: z.string().nullable(),
  characterization: z.string().nullable(),
  alleviatingFactors: z.array(z.string()),
  radiatingTo: z.string().nullable(),
  timeline: z.string().nullable(),
  severity: z.string().nullable(),
  triggers: z.array(z.string()),
  relievers: z.array(z.string()),
  exposures: z.array(z.string()),
  environment: z.array(z.string()),
  foodContext: z.array(z.string()),
  medicationContext: z.array(z.string()),
  associatedSymptoms: z.array(z.string())
});

// Atopic Comorbidities Schema
const atopicComorbiditiesSchema = z.object({
  asthma: z.enum(['yes', 'no', 'unknown']),
  eczema: z.enum(['yes', 'no', 'unknown']),
  chronicRhinitis: z.enum(['yes', 'no', 'unknown']),
  sinusitis: z.enum(['yes', 'no', 'unknown']),
  urticariaAngioedema: z.enum(['yes', 'no', 'unknown']),
  foodAllergies: z.enum(['yes', 'no', 'unknown']),
  drugAllergies: z.enum(['yes', 'no', 'unknown']),
  anaphylaxisHistory: z.enum(['yes', 'no', 'unknown'])
});

// Medication Schema
const medicationSchema = z.object({
  name: z.string(),
  dose: z.string().nullable(),
  frequency: z.string().nullable(),
  route: z.string().nullable(),
  indication: z.string().nullable(),
  response: z.string().nullable(),
  adverseEffects: z.string().nullable(),
  startDate: z.string().nullable(),
  prescribedBy: z.string().nullable()
});

// Test Schemas
const allergyTestingSchema = z.object({
  type: z.enum(['SPT', 'sIgE', 'component', 'patch', 'challenge', 'total-IgE', 'tryptase', 'other']),
  date: z.string().nullable(),
  keyFindings: z.string().nullable(),
  allergensPositive: z.array(z.string()),
  allergensNegative: z.array(z.string()),
  values: z.array(z.object({
    allergen: z.string(),
    value: z.string(),
    unit: z.string().nullable(),
    interpretation: z.string().nullable()
  })).optional(),
  confidence: z.enum(['high', 'medium', 'low'])
});

const labSchema = z.object({
  panel: z.string(),
  date: z.string().nullable(),
  abnormalFindings: z.array(z.object({
    test: z.string(),
    value: z.string(),
    referenceRange: z.string().nullable(),
    interpretation: z.string().nullable()
  })),
  notableNormals: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low'])
});

const imagingOrOtherSchema = z.object({
  type: z.string(),
  date: z.string().nullable(),
  finding: z.string().nullable(),
  impression: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low'])
});

const testsAndLabsSchema = z.object({
  allergyTesting: z.array(allergyTestingSchema),
  labs: z.array(labSchema),
  imagingOrOther: z.array(imagingOrOtherSchema),
  pulmonaryFunctionTests: z.array(z.object({
    date: z.string().nullable(),
    fev1: z.string().nullable(),
    fvc: z.string().nullable(),
    ratio: z.string().nullable(),
    interpretation: z.string().nullable()
  })).optional()
});

// ============================================================================
// BILLING CODES - CPT & ICD-10
// ============================================================================

const cptCodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  rationale: z.string(),
  confidence: z.enum(['high', 'medium', 'low']),
  modifier: z.string().nullable(),
  units: z.number().nullable()
});

const icd10CodeSchema = z.object({
  code: z.string(),
  description: z.string(),
  isPrimary: z.boolean(),
  supportingEvidence: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low'])
});

// ============================================================================
// CLINICAL DECISION SUPPORT
// ============================================================================

const redFlagSchema = z.object({
  flag: z.string(),
  severity: z.enum(['critical', 'high', 'medium']),
  recommendation: z.string(),
  references: z.array(z.string()).optional()
});

const missingInfoSchema = z.object({
  category: z.string(),
  description: z.string(),
  clinicalImpact: z.string(),
  priority: z.enum(['required', 'recommended', 'optional'])
});

const recommendedTestSchema = z.object({
  test: z.string(),
  rationale: z.string(),
  priority: z.enum(['urgent', 'routine', 'consider']),
  cptCode: z.string().nullable()
});

// ============================================================================
// SOAP NOTE STRUCTURE
// ============================================================================

const soapNoteSchema = z.object({
  subjective: z.object({
    chiefComplaint: z.string().nullable(),
    hpiNarrative: z.string().nullable(),
    allergySummary: z.string().nullable(),
    medicationReview: z.string().nullable(),
    reviewOfSystems: z.string().nullable(),
    socialHistory: z.string().nullable(),
    familyHistory: z.string().nullable()
  }),
  objective: z.object({
    vitalSigns: z.string().nullable(),
    physicalExam: z.string().nullable(),
    testResults: z.string().nullable(),
    diagnosticFindings: z.string().nullable()
  }),
  assessment: z.object({
    diagnoses: z.array(z.object({
      diagnosis: z.string(),
      icd10: z.string().nullable(),
      status: z.enum(['new', 'ongoing', 'resolved', 'worsening', 'improving']),
      rationale: z.string()
    })),
    differentialDiagnosis: z.array(z.string()),
    clinicalReasoning: z.string().nullable()
  }),
  plan: z.object({
    treatments: z.array(z.object({
      intervention: z.string(),
      dosage: z.string().nullable(),
      duration: z.string().nullable(),
      rationale: z.string()
    })),
    diagnosticPlan: z.array(z.string()),
    patientEducation: z.array(z.string()),
    followUp: z.string().nullable(),
    referrals: z.array(z.string())
  })
});

// Assessment and Plan Schemas
const assessmentCandidateSchema = z.object({
  problem: z.string(),
  icd10Code: z.string().nullable(),
  supportingEvidence: z.array(z.string()),
  differentialDiagnosis: z.array(z.string()).optional(),
  confidence: z.enum(['high', 'medium', 'low'])
});

const planCandidateSchema = z.object({
  item: z.string(),
  rationale: z.string().nullable(),
  cptCode: z.string().nullable(),
  priority: z.enum(['urgent', 'high', 'medium', 'low']),
  category: z.enum(['diagnostic', 'therapeutic', 'education', 'referral', 'follow-up'])
});

// Visit Context Schema
const visitContextSchema = z.object({
  date: z.string().nullable(),
  setting: z.enum(['outpatient', 'inpatient', 'televisit', 'emergency', 'other']).nullable(),
  visitType: z.enum(['new-patient', 'follow-up', 'consultation', 'procedure', 'other']).nullable(),
  referralSource: z.string().nullable(),
  duration: z.string().nullable()
});

// ============================================================================
// MAIN EXTRACTION SCHEMA
// ============================================================================

export const extractionSchema = z.object({
  // Patient & Visit Info
  patientAlias: z.string().nullable(),
  visitContext: visitContextSchema.nullable(),

  // SOAP - Subjective
  chiefComplaint: z.string().nullable(),
  hpi: hpiSchema.nullable(),
  allergyHistory: z.object({
    food: z.array(allergyItemSchema),
    drug: z.array(allergyItemSchema),
    environmental: z.array(environmentalAllergySchema),
    stingingInsects: z.array(stingingInsectAllergySchema),
    latexOther: z.array(latexOtherAllergySchema)
  }).nullable(),
  atopicComorbidities: atopicComorbiditiesSchema.nullable(),
  medications: z.array(medicationSchema),
  pmh: z.array(z.string()),
  psh: z.array(z.string()),
  fh: z.array(z.string()),
  sh: z.array(z.string()),
  ros: z.object({
    positives: z.array(z.string()),
    negatives: z.array(z.string()),
    notReviewed: z.array(z.string()).optional()
  }),

  // SOAP - Objective
  vitalSigns: z.object({
    bp: z.string().nullable(),
    hr: z.string().nullable(),
    rr: z.string().nullable(),
    temp: z.string().nullable(),
    spo2: z.string().nullable(),
    weight: z.string().nullable(),
    height: z.string().nullable(),
    bmi: z.string().nullable()
  }).nullable(),
  exam: z.array(z.string()),
  testsAndLabs: testsAndLabsSchema.nullable(),

  // SOAP - Assessment
  assessmentCandidates: z.array(assessmentCandidateSchema),
  clinicalReasoning: z.string().nullable(),

  // SOAP - Plan
  planCandidates: z.array(planCandidateSchema),

  // Billing Codes
  cptCodes: z.array(cptCodeSchema),
  icd10Codes: z.array(icd10CodeSchema),

  // Clinical Decision Support
  redFlags: z.array(redFlagSchema),
  missingInformation: z.array(missingInfoSchema),
  recommendedTests: z.array(recommendedTestSchema),

  // Quality & Confidence
  needsConfirmation: z.array(z.string()),
  sourceQualityFlags: z.array(z.string()),

  // Generated SOAP Note
  soapNote: soapNoteSchema.nullable()
});

export type ExtractionData = z.infer<typeof extractionSchema>;

// ============================================================================
// VISIT SCHEMA
// ============================================================================

export const visitSchema = z.object({
  id: z.string(),
  visitorId: z.string().optional(), // Anonymous visitor tracking
  createdAt: z.date(),
  updatedAt: z.date(),
  sources: z.array(z.object({
    type: z.enum(['audio', 'document', 'text', 'paste']),
    content: z.string(),
    metadata: z.object({}).passthrough()
  })),
  extraction: extractionSchema.nullable(),
  generatedNote: z.string().nullable(),
  soapNote: soapNoteSchema.nullable(),
  status: z.enum(['capturing', 'extracting', 'reviewing', 'completed', 'archived'])
});

export type Visit = z.infer<typeof visitSchema>;

// Transcription Result
export const transcriptionResultSchema = z.object({
  text: z.string(),
  segments: z.array(z.object({
    start: z.number(),
    end: z.number(),
    text: z.string()
  }))
});

export type TranscriptionResult = z.infer<typeof transcriptionResultSchema>;

// Export individual schemas for external use
export {
  cptCodeSchema,
  icd10CodeSchema,
  redFlagSchema,
  missingInfoSchema,
  recommendedTestSchema,
  soapNoteSchema,
  allergyItemSchema,
  medicationSchema,
  labSchema
};