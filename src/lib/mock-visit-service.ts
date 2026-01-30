import { IVisit } from '@/models/Visit';

// Simple interface for mock visits (without Mongoose Document methods)
export interface IMockVisit {
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

// Simple in-memory storage for visits
const visits = new Map<string, IMockVisit>();

export class MockVisitService {
  static async createVisit(visitData: Partial<IMockVisit>): Promise<IMockVisit> {
    const visit: IMockVisit = {
      _id: visitData._id || `visit_${Date.now()}`,
      userId: visitData.userId || 'demo-user-id',
      visitId: visitData.visitId || `visit_${Date.now()}`,
      patientAlias: visitData.patientAlias || 'Patient',
      chiefComplaint: visitData.chiefComplaint || '',
      hpi: visitData.hpi || {
        triggers: [],
        relievers: [],
        exposures: [],
        environment: [],
        foodContext: [],
        medicationContext: []
      },
      allergyHistory: visitData.allergyHistory || {
        food: [],
        environmental: [],
        stingingInsects: [],
        latexOther: []
      },
      medications: visitData.medications || [],
      pmh: visitData.pmh || [],
      psh: visitData.psh || [],
      fh: visitData.fh || [],
      sh: visitData.sh || [],
      ros: visitData.ros || {},
      exam: visitData.exam || {},
      testsAndLabs: visitData.testsAndLabs || [],
      assessmentCandidates: visitData.assessmentCandidates || [],
      planCandidates: visitData.planCandidates || [],
      needsConfirmation: visitData.needsConfirmation || { items: [] },
      sourceQualityFlags: visitData.sourceQualityFlags || { needsReview: false },
      atopicComorbidities: visitData.atopicComorbidities || {
        eczema: false,
        asthma: false,
        allergicRhinitis: false,
        foodAllergy: false,
        drugAllergy: false
      },
      sources: visitData.sources || [],
      generatedNote: visitData.generatedNote || undefined,
      status: visitData.status || 'draft',
      createdAt: visitData.createdAt || new Date(),
      updatedAt: visitData.updatedAt || new Date(),
      completedAt: visitData.completedAt || undefined
    };

    visits.set(visit._id, visit);
    return visit;
  }

  static async findById(id: string): Promise<IMockVisit | null> {
    return visits.get(id) || null;
  }

  static async findByVisitId(visitId: string, userId?: string): Promise<IMockVisit | null> {
    return Array.from(visits.values()).find(v => v.visitId === visitId && (!userId || v.userId === userId)) || null;
  }

  static async findByUserId(userId: string): Promise<IMockVisit[]> {
    return Array.from(visits.values()).filter(v => v.userId === userId);
  }

  static async updateVisit(id: string, userId: string, updates: any): Promise<IMockVisit | null> {
    const visit = visits.get(id);
    if (!visit || visit.userId !== userId) return null;

    // Handle partial updates properly
    if (updates.hpi) {
      visit.hpi = { ...visit.hpi, ...updates.hpi };
    }
    if (updates.allergyHistory) {
      visit.allergyHistory = { ...visit.allergyHistory, ...updates.allergyHistory };
    }
    if (updates.needsConfirmation) {
      visit.needsConfirmation = { ...visit.needsConfirmation, ...updates.needsConfirmation };
    }
    if (updates.sourceQualityFlags) {
      visit.sourceQualityFlags = { ...visit.sourceQualityFlags, ...updates.sourceQualityFlags };
    }
    if (updates.atopicComorbidities) {
      visit.atopicComorbidities = { ...visit.atopicComorbidities, ...updates.atopicComorbidities };
    }

    Object.assign(visit, updates, { 
      updatedAt: new Date(),
      hpi: undefined,
      allergyHistory: undefined,
      needsConfirmation: undefined,
      sourceQualityFlags: undefined,
      atopicComorbidities: undefined
    });

    visits.set(id, visit);
    return visit;
  }

  static async updateVisitByVisitId(visitId: string, userId: string, updates: any): Promise<IMockVisit | null> {
    const visit = Array.from(visits.values()).find(v => v.visitId === visitId && v.userId === userId);
    if (!visit) return null;

    // Handle partial updates properly
    if (updates.hpi) {
      visit.hpi = { ...visit.hpi, ...updates.hpi };
    }
    if (updates.allergyHistory) {
      visit.allergyHistory = { ...visit.allergyHistory, ...updates.allergyHistory };
    }
    if (updates.needsConfirmation) {
      visit.needsConfirmation = { ...visit.needsConfirmation, ...updates.needsConfirmation };
    }
    if (updates.sourceQualityFlags) {
      visit.sourceQualityFlags = { ...visit.sourceQualityFlags, ...updates.sourceQualityFlags };
    }
    if (updates.atopicComorbidities) {
      visit.atopicComorbidities = { ...visit.atopicComorbidities, ...updates.atopicComorbidities };
    }

    Object.assign(visit, updates, { 
      updatedAt: new Date(),
      hpi: undefined,
      allergyHistory: undefined,
      needsConfirmation: undefined,
      sourceQualityFlags: undefined,
      atopicComorbidities: undefined
    });

    return visit;
  }

  static async deleteVisit(id: string): Promise<boolean> {
    return visits.delete(id);
  }

  static async listVisits(userId: string, page = 1, limit = 20, status?: string): Promise<{ visits: IMockVisit[]; total: number }> {
    let userVisits = Array.from(visits.values()).filter(v => v.userId === userId);
    
    if (status) {
      userVisits = userVisits.filter(v => v.status === status);
    }
    
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      visits: userVisits.slice(start, end),
      total: userVisits.length
    };
  }
}