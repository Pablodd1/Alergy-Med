import { IVisit } from '@/models/Visit';

// Simple in-memory storage for visits
const visits = new Map<string, IVisit>();

export class MockVisitService {
  static async createVisit(visitData: Partial<IVisit>): Promise<IVisit> {
    const visit: IVisit = {
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

  static async findById(id: string): Promise<IVisit | null> {
    return visits.get(id) || null;
  }

  static async findByVisitId(visitId: string): Promise<IVisit | null> {
    return Array.from(visits.values()).find(v => v.visitId === visitId) || null;
  }

  static async findByUserId(userId: string): Promise<IVisit[]> {
    return Array.from(visits.values()).filter(v => v.userId === userId);
  }

  static async updateVisit(id: string, updates: Partial<IVisit>): Promise<IVisit | null> {
    const visit = visits.get(id);
    if (!visit) return null;

    Object.assign(visit, updates, { updatedAt: new Date() });
    visits.set(id, visit);
    return visit;
  }

  static async updateVisitByVisitId(visitId: string, userId: string, updates: Partial<IVisit>): Promise<IVisit | null> {
    const visit = Array.from(visits.values()).find(v => v.visitId === visitId && v.userId === userId);
    if (!visit) return null;

    Object.assign(visit, updates, { updatedAt: new Date() });
    return visit;
  }

  static async deleteVisit(id: string): Promise<boolean> {
    return visits.delete(id);
  }

  static async listVisits(userId: string, page = 1, limit = 20): Promise<{ visits: IVisit[]; total: number }> {
    const userVisits = Array.from(visits.values()).filter(v => v.userId === userId);
    const start = (page - 1) * limit;
    const end = start + limit;
    return {
      visits: userVisits.slice(start, end),
      total: userVisits.length
    };
  }
}