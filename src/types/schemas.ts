import { z } from 'zod';

// Allergy History Schemas
const allergyItemSchema = z.object({
  allergen: z.string(),
  reaction: z.string().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe', 'unknown']).nullable(),
  timing: z.enum(['immediate', 'delayed', 'unknown']).nullable(),
  dateOrAge: z.string().nullable(),
  treatmentUsed: z.string().nullable(),
  certainty: z.enum(['confirmed', 'reported', 'unclear'])
});

const environmentalAllergySchema = z.object({
  allergen: z.string(),
  reaction: z.string().nullable(),
  seasonality: z.string().nullable(),
  certainty: z.enum(['confirmed', 'reported', 'unclear'])
});

const stingingInsectAllergySchema = z.object({
  allergen: z.string(),
  reaction: z.string().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe', 'unknown']).nullable(),
  certainty: z.enum(['confirmed', 'reported', 'unclear'])
});

const latexOtherAllergySchema = z.object({
  allergen: z.string(),
  reaction: z.string().nullable(),
  severity: z.enum(['mild', 'moderate', 'severe', 'unknown']).nullable(),
  certainty: z.enum(['confirmed', 'reported', 'unclear'])
});

// HPI Schema
const hpiSchema = z.object({
  onset: z.string().nullable(),
  timeline: z.string().nullable(),
  frequency: z.string().nullable(),
  severity: z.string().nullable(),
  triggers: z.array(z.string()),
  relievers: z.array(z.string()),
  exposures: z.array(z.string()),
  environment: z.array(z.string()),
  foodContext: z.array(z.string()),
  medicationContext: z.array(z.string())
});

// Atopic Comorbidities Schema
const atopicComorbiditiesSchema = z.object({
  asthma: z.enum(['yes', 'no', 'unknown']),
  eczema: z.enum(['yes', 'no', 'unknown']),
  chronicRhinitis: z.enum(['yes', 'no', 'unknown']),
  sinusitis: z.enum(['yes', 'no', 'unknown']),
  urticariaAngioedema: z.enum(['yes', 'no', 'unknown'])
});

// Medication Schema
const medicationSchema = z.object({
  name: z.string(),
  dose: z.string().nullable(),
  frequency: z.string().nullable(),
  indication: z.string().nullable(),
  response: z.string().nullable(),
  adverseEffects: z.string().nullable()
});

// Test Schemas
const allergyTestingSchema = z.object({
  type: z.enum(['SPT', 'sIgE', 'component', 'patch', 'challenge', 'other']),
  date: z.string().nullable(),
  keyFindings: z.string().nullable(),
  allergensPositive: z.array(z.string()),
  allergensNegative: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low'])
});

const labSchema = z.object({
  panel: z.string(),
  date: z.string().nullable(),
  abnormalFindings: z.array(z.string()),
  notableNormals: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low'])
});

const imagingOrOtherSchema = z.object({
  type: z.string(),
  date: z.string().nullable(),
  finding: z.string().nullable(),
  confidence: z.enum(['high', 'medium', 'low'])
});

const testsAndLabsSchema = z.object({
  allergyTesting: z.array(allergyTestingSchema),
  labs: z.array(labSchema),
  imagingOrOther: z.array(imagingOrOtherSchema)
});

// Assessment and Plan Schemas
const assessmentCandidateSchema = z.object({
  problem: z.string(),
  supportingEvidence: z.array(z.string()),
  confidence: z.enum(['high', 'medium', 'low'])
});

const planCandidateSchema = z.object({
  item: z.string(),
  rationale: z.string().nullable(),
  priority: z.enum(['high', 'medium', 'low'])
});

// Visit Context Schema
const visitContextSchema = z.object({
  date: z.string().nullable(),
  setting: z.enum(['self', 'clinic', 'televisit']).nullable()
});

// Main Extraction Schema
export const extractionSchema = z.object({
  patientAlias: z.string().nullable(),
  visitContext: visitContextSchema.nullable(),
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
    negatives: z.array(z.string())
  }),
  exam: z.array(z.string()),
  testsAndLabs: testsAndLabsSchema.nullable(),
  assessmentCandidates: z.array(assessmentCandidateSchema),
  planCandidates: z.array(planCandidateSchema),
  needsConfirmation: z.array(z.string()),
  sourceQualityFlags: z.array(z.string())
});

export type ExtractionData = z.infer<typeof extractionSchema>;

// Visit Schema
export const visitSchema = z.object({
  id: z.string(),
  userId: z.string(),
  createdAt: z.date(),
  updatedAt: z.date(),
  sources: z.array(z.object({
    type: z.enum(['audio', 'image', 'document', 'text']),
    content: z.string(),
    metadata: z.object({}).passthrough()
  })),
  extraction: extractionSchema.nullable(),
  note: z.string().nullable(),
  status: z.enum(['capturing', 'extracting', 'reviewing', 'completed'])
});

export type Visit = z.infer<typeof visitSchema>;

// User Schema
export const userSchema = z.object({
  id: z.string(),
  username: z.string(),
  password: z.string(),
  createdAt: z.date(),
  updatedAt: z.date()
});

export type User = z.infer<typeof userSchema>;

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

// OCR Result
export const ocrResultSchema = z.object({
  text: z.string(),
  confidence: z.number(),
  layout: z.array(z.object({
    text: z.string(),
    confidence: z.number(),
    bbox: z.object({ left: z.number(), top: z.number(), width: z.number(), height: z.number() })
  })).optional()
});

export type OCRResult = z.infer<typeof ocrResultSchema>;