import mongoose, { Document, Schema } from 'mongoose';

// Embedded schemas for complex data structures

const allergyItemSchema = new Schema({
  allergen: { type: String, required: true },
  reaction: { type: String },
  severity: { type: String, enum: ['mild', 'moderate', 'severe', 'unknown'] },
  timing: { type: String, enum: ['immediate', 'delayed', 'unknown'] },
  dateOrAge: { type: String },
  treatmentUsed: { type: String },
  certainty: { type: String, enum: ['confirmed', 'reported', 'unclear'], default: 'unclear' }
}, { _id: false });

const environmentalAllergySchema = new Schema({
  allergen: { type: String, required: true },
  reaction: { type: String },
  seasonality: { type: String },
  certainty: { type: String, enum: ['confirmed', 'reported', 'unclear'], default: 'unclear' }
}, { _id: false });

const stingingInsectAllergySchema = new Schema({
  allergen: { type: String, required: true },
  reaction: { type: String },
  severity: { type: String, enum: ['mild', 'moderate', 'severe', 'unknown'] },
  certainty: { type: String, enum: ['confirmed', 'reported', 'unclear'], default: 'unclear' }
}, { _id: false });

const latexOtherAllergySchema = new Schema({
  allergen: { type: String, required: true },
  reaction: { type: String },
  severity: { type: String, enum: ['mild', 'moderate', 'severe', 'unknown'] },
  certainty: { type: String, enum: ['confirmed', 'reported', 'unclear'], default: 'unclear' }
}, { _id: false });

const hpiSchema = new Schema({
  onset: { type: String },
  timeline: { type: String },
  frequency: { type: String },
  severity: { type: String },
  triggers: [{ type: String }],
  relievers: [{ type: String }],
  exposures: [{ type: String }],
  environment: [{ type: String }],
  foodContext: [{ type: String }],
  medicationContext: [{ type: String }]
}, { _id: false });

const atopicComorbiditiesSchema = new Schema({
  eczema: { type: Boolean, default: false },
  asthma: { type: Boolean, default: false },
  allergicRhinitis: { type: Boolean, default: false },
  foodAllergy: { type: Boolean, default: false },
  drugAllergy: { type: Boolean, default: false },
  notes: { type: String }
}, { _id: false });

const medicationSchema = new Schema({
  name: { type: String, required: true },
  dosage: { type: String },
  frequency: { type: String },
  indication: { type: String },
  startDate: { type: Date },
  endDate: { type: Date },
  isActive: { type: Boolean, default: true },
  prescribedBy: { type: String },
  response: { type: String },
  sideEffects: { type: String }
}, { _id: false });

const rosSchema = new Schema({
  constitutional: { type: String },
  skin: { type: String },
  head: { type: String },
  eyes: { type: String },
  ears: { type: String },
  nose: { type: String },
  mouth: { type: String },
  throat: { type: String },
  neck: { type: String },
  respiratory: { type: String },
  cardiovascular: { type: String },
  gastrointestinal: { type: String },
  genitourinary: { type: String },
  musculoskeletal: { type: String },
  neurological: { type: String },
  psychiatric: { type: String },
  endocrine: { type: String },
  hematologic: { type: String },
  allergic: { type: String },
  immunologic: { type: String }
}, { _id: false });

const examSchema = new Schema({
  general: { type: String },
  skin: { type: String },
  head: { type: String },
  eyes: { type: String },
  ears: { type: String },
  nose: { type: String },
  mouth: { type: String },
  throat: { type: String },
  neck: { type: String },
  chest: { type: String },
  heart: { type: String },
  abdomen: { type: String },
  extremities: { type: String },
  neurological: { type: String },
  psychiatric: { type: String }
}, { _id: false });

const testSchema = new Schema({
  name: { type: String, required: true },
  result: { type: String },
  value: { type: String },
  unit: { type: String },
  referenceRange: { type: String },
  date: { type: Date },
  status: { type: String, enum: ['pending', 'completed', 'abnormal', 'normal'] },
  notes: { type: String }
}, { _id: false });

const sourceQualityFlagsSchema = new Schema({
  sourceQualityFlags: { type: String },
  confidenceLevel: { type: String, enum: ['high', 'medium', 'low'] },
  needsReview: { type: Boolean, default: false },
  notes: { type: String }
}, { _id: false });

const needsConfirmationSchema = new Schema({
  items: [{ type: String }],
  notes: { type: String }
}, { _id: false });

// Main Visit interface
export interface IVisit extends Document {
  _id: string;
  userId: string;
  visitId: string;
  patientAlias: string;
  chiefComplaint: string;
  hpi: {
    onset?: string;
    timeline?: string;
    frequency?: string;
    severity?: string;
    triggers: string[];
    relievers: string[];
    exposures: string[];
    environment: string[];
    foodContext: string[];
    medicationContext: string[];
  };
  allergyHistory: {
    food: Array<{
      allergen: string;
      reaction?: string;
      severity?: 'mild' | 'moderate' | 'severe' | 'unknown';
      timing?: 'immediate' | 'delayed' | 'unknown';
      dateOrAge?: string;
      treatmentUsed?: string;
      certainty?: 'confirmed' | 'reported' | 'unclear';
    }>;
    environmental: Array<{
      allergen: string;
      reaction?: string;
      seasonality?: string;
      certainty?: 'confirmed' | 'reported' | 'unclear';
    }>;
    stingingInsects: Array<{
      allergen: string;
      reaction?: string;
      severity?: 'mild' | 'moderate' | 'severe' | 'unknown';
      certainty?: 'confirmed' | 'reported' | 'unclear';
    }>;
    latexOther: Array<{
      allergen: string;
      reaction?: string;
      severity?: 'mild' | 'moderate' | 'severe' | 'unknown';
      certainty?: 'confirmed' | 'reported' | 'unclear';
    }>;
  };
  medications: Array<{
    name: string;
    dosage?: string;
    frequency?: string;
    indication?: string;
    startDate?: Date;
    endDate?: Date;
    isActive: boolean;
    prescribedBy?: string;
    response?: string;
    sideEffects?: string;
  }>;
  pmh: string[];
  psh: string[];
  fh: string[];
  sh: string[];
  ros: {
    constitutional?: string;
    skin?: string;
    head?: string;
    eyes?: string;
    ears?: string;
    nose?: string;
    mouth?: string;
    throat?: string;
    neck?: string;
    respiratory?: string;
    cardiovascular?: string;
    gastrointestinal?: string;
    genitourinary?: string;
    musculoskeletal?: string;
    neurological?: string;
    psychiatric?: string;
    endocrine?: string;
    hematologic?: string;
    allergic?: string;
    immunologic?: string;
  };
  exam: {
    general?: string;
    skin?: string;
    head?: string;
    eyes?: string;
    ears?: string;
    nose?: string;
    mouth?: string;
    throat?: string;
    neck?: string;
    chest?: string;
    heart?: string;
    abdomen?: string;
    extremities?: string;
    neurological?: string;
    psychiatric?: string;
  };
  testsAndLabs: Array<{
    name: string;
    result?: string;
    value?: string;
    unit?: string;
    referenceRange?: string;
    date?: Date;
    status?: 'pending' | 'completed' | 'abnormal' | 'normal';
    notes?: string;
  }>;
  assessmentCandidates: string[];
  planCandidates: string[];
  needsConfirmation: {
    items: string[];
    notes?: string;
  };
  sourceQualityFlags: {
    sourceQualityFlags?: string;
    confidenceLevel?: 'high' | 'medium' | 'low';
    needsReview?: boolean;
    notes?: string;
  };
  atopicComorbidities: {
    eczema?: boolean;
    asthma?: boolean;
    allergicRhinitis?: boolean;
    foodAllergy?: boolean;
    drugAllergy?: boolean;
    notes?: string;
  };
  sources: Array<{
    id: string;
    type: 'audio' | 'image' | 'document' | 'text';
    content: string;
    metadata: {
      filename?: string;
      timestamp?: string;
      confidence?: number;
      segments?: Array<{
        start: number;
        end: number;
        text: string;
      }>;
    };
  }>;
  generatedNote?: string;
  extraction?: any;
  status: 'draft' | 'completed' | 'archived';
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
}

// Main Visit schema
const visitSchema = new Schema<IVisit>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  visitId: {
    type: String,
    required: true,
    unique: true,
    index: true
  },
  patientAlias: {
    type: String,
    required: true,
    trim: true
  },
  chiefComplaint: {
    type: String,
    required: true,
    trim: true
  },
  hpi: hpiSchema,
  allergyHistory: {
    food: [allergyItemSchema],
    environmental: [environmentalAllergySchema],
    stingingInsects: [stingingInsectAllergySchema],
    latexOther: [latexOtherAllergySchema]
  },
  medications: [medicationSchema],
  pmh: [{ type: String }],
  psh: [{ type: String }],
  fh: [{ type: String }],
  sh: [{ type: String }],
  ros: rosSchema,
  exam: examSchema,
  testsAndLabs: [testSchema],
  assessmentCandidates: [{ type: String }],
  planCandidates: [{ type: String }],
  needsConfirmation: needsConfirmationSchema,
  sourceQualityFlags: sourceQualityFlagsSchema,
  atopicComorbidities: atopicComorbiditiesSchema,
  sources: [{
    id: { type: String, required: true },
    type: { 
      type: String, 
      enum: ['audio', 'image', 'document', 'text'], 
      required: true 
    },
    content: { type: String, required: true },
    metadata: {
      filename: { type: String },
      timestamp: { type: String },
      confidence: { type: Number },
      segments: [{
        start: { type: Number },
        end: { type: Number },
        text: { type: String }
      }]
    }
  }],
  generatedNote: { type: String },
  extraction: { type: Schema.Types.Mixed },
  status: {
    type: String,
    enum: ['draft', 'completed', 'archived'],
    default: 'draft'
  },
  completedAt: { type: Date }
}, {
  timestamps: true
});

// Indexes for better query performance
visitSchema.index({ userId: 1, status: 1 });
visitSchema.index({ userId: 1, createdAt: -1 });
visitSchema.index({ patientAlias: 1, userId: 1 });
visitSchema.index({ 'sources.type': 1 });
visitSchema.index({ status: 1, updatedAt: -1 });

export const Visit = mongoose.models.Visit || mongoose.model<IVisit>('Visit', visitSchema);