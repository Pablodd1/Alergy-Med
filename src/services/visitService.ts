import { Visit, IVisit } from '@/models/Visit';
import connectToDatabase from '@/lib/mongodb';
import { ExtractionData } from '@/types/schemas';
import { MockVisitService } from '@/lib/mock-visit-service';

// Union type for both real and mock visits
type VisitType = IVisit | import('@/lib/mock-visit-service').IMockVisit;

export interface CreateVisitInput {
  userId: string;
  visitId: string;
  patientAlias: string;
  chiefComplaint: string;
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
}

export interface UpdateVisitInput {
  patientAlias?: string;
  chiefComplaint?: string;
  hpi?: Partial<IVisit['hpi']>;
  allergyHistory?: Partial<IVisit['allergyHistory']>;
  medications?: IVisit['medications'];
  pmh?: string[];
  psh?: string[];
  fh?: string[];
  sh?: string[];
  ros?: Partial<IVisit['ros']>;
  exam?: Partial<IVisit['exam']>;
  testsAndLabs?: IVisit['testsAndLabs'];
  assessmentCandidates?: string[];
  planCandidates?: string[];
  needsConfirmation?: Partial<IVisit['needsConfirmation']>;
  sourceQualityFlags?: Partial<IVisit['sourceQualityFlags']>;
  atopicComorbidities?: Partial<IVisit['atopicComorbidities']>;
  sources?: IVisit['sources'];
  generatedNote?: string;
  status?: 'draft' | 'completed' | 'archived';
  extraction?: any;
  completedAt?: Date;
}

export class VisitService {
  static async createVisit(input: CreateVisitInput): Promise<VisitType> {
    const conn = await connectToDatabase();

    if (!conn) {
      return MockVisitService.createVisit(input);
    }

    const existingVisit = await Visit.findOne({ visitId: input.visitId });
    if (existingVisit) {
      throw new Error('Visit ID already exists');
    }

    const visit = new Visit({
      ...input,
      status: 'draft'
    });

    await visit.save();
    return visit;
  }

  static async findByVisitId(visitId: string, userId: string): Promise<VisitType | null> {
    const conn = await connectToDatabase();

    if (!conn) {
      return MockVisitService.findByVisitId(visitId, userId);
    }

    return Visit.findOne({ visitId, userId });
  }

  static async findById(id: string, userId: string): Promise<VisitType | null> {
    const conn = await connectToDatabase();

    if (!conn) {
      return MockVisitService.findById(id);
    }

    return Visit.findOne({ _id: id, userId });
  }

  static async updateVisit(visitId: string, userId: string, updates: UpdateVisitInput): Promise<VisitType | null> {
    const conn = await connectToDatabase();

    if (!conn) {
      return MockVisitService.updateVisitByVisitId(visitId, userId, updates);
    }

    return Visit.findOneAndUpdate(
      { visitId, userId },
      { $set: updates },
      { new: true }
    );
  }

  static async updateVisitFromExtraction(visitId: string, userId: string, extraction: ExtractionData): Promise<VisitType | null> {
    const conn = await connectToDatabase();

    // Transform ExtractionData to UpdateVisitInput format
    const transformAllergy = (a: any) => ({
      allergen: a.allergen,
      reaction: a.reaction || undefined,
      severity: a.severity || undefined,
      timing: a.timing || undefined,
      dateOrAge: a.dateOrAge || undefined,
      treatmentUsed: a.treatmentUsed || undefined,
      certainty: a.certainty || undefined
    });

    const updateData: UpdateVisitInput = {
      patientAlias: extraction.patientAlias || undefined,
      chiefComplaint: extraction.chiefComplaint || undefined,
      hpi: extraction.hpi ? {
        onset: extraction.hpi.onset || undefined,
        timeline: extraction.hpi.timeline || undefined,
        frequency: extraction.hpi.frequency || undefined,
        severity: extraction.hpi.severity || undefined,
        triggers: extraction.hpi.triggers,
        relievers: extraction.hpi.relievers,
        exposures: extraction.hpi.exposures,
        environment: extraction.hpi.environment,
        foodContext: extraction.hpi.foodContext,
        medicationContext: extraction.hpi.medicationContext
      } : undefined,
      allergyHistory: extraction.allergyHistory ? {
        food: extraction.allergyHistory.food.map(transformAllergy),
        environmental: extraction.allergyHistory.environmental.map(a => ({
          allergen: a.allergen,
          reaction: a.reaction || undefined,
          seasonality: a.seasonality || undefined,
          certainty: a.certainty || undefined
        })),
        stingingInsects: extraction.allergyHistory.stingingInsects.map(transformAllergy),
        latexOther: extraction.allergyHistory.latexOther.map(transformAllergy)
      } : undefined,
      medications: extraction.medications.map(m => ({
        name: m.name,
        dosage: m.dose || undefined,
        frequency: m.frequency || undefined,
        indication: m.indication || undefined,
        isActive: true,
        response: m.response || undefined,
        sideEffects: m.adverseEffects || undefined
      })),
      pmh: extraction.pmh,
      psh: extraction.psh,
      fh: extraction.fh,
      sh: extraction.sh,
      // Map ROS: Join all positives into 'constitutional' as a fallback, or just skip if too complex to map without more logic
      ros: extraction.ros ? {
        constitutional: extraction.ros.positives.join(', '),
        // We put negatives in notes or ignore for now as IVisit doesn't have a clear place for general negatives list
      } : undefined,
      exam: extraction.exam ? {
        general: extraction.exam.join(', ')
      } : undefined,
      // Map basic tests if possible, otherwise empty
      testsAndLabs: [],
      assessmentCandidates: extraction.assessmentCandidates.map(a => a.problem),
      planCandidates: extraction.planCandidates.map(p => p.item),
      needsConfirmation: extraction.needsConfirmation ? {
        items: extraction.needsConfirmation
      } : undefined,
      sourceQualityFlags: extraction.sourceQualityFlags ? {
        sourceQualityFlags: extraction.sourceQualityFlags.join(', ')
      } : undefined,
      atopicComorbidities: extraction.atopicComorbidities ? {
        eczema: extraction.atopicComorbidities.eczema === 'yes',
        asthma: extraction.atopicComorbidities.asthma === 'yes',
        allergicRhinitis: extraction.atopicComorbidities.chronicRhinitis === 'yes',
        foodAllergy: false,
        drugAllergy: false
      } : undefined,
      extraction: extraction
    };

    if (!conn) {
      return MockVisitService.updateVisitByVisitId(visitId, userId, updateData);
    }

    return Visit.findOneAndUpdate(
      { visitId, userId },
      { $set: updateData },
      { new: true }
    );
  }

  static async deleteVisit(visitId: string, userId: string): Promise<boolean> {
    const conn = await connectToDatabase();

    if (!conn) {
      return MockVisitService.deleteVisit(visitId);
    }

    const result = await Visit.findOneAndDelete({ visitId, userId });
    return !!result;
  }

  static async listVisits(userId: string, page = 1, limit = 20, status?: string): Promise<{ visits: VisitType[]; total: number }> {
    const conn = await connectToDatabase();

    if (!conn) {
      return MockVisitService.listVisits(userId, page, limit, status);
    }

    const skip = (page - 1) * limit;
    const filter: any = { userId };

    if (status) {
      filter.status = status;
    }

    const [visits, total] = await Promise.all([
      Visit.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-sources.content'),
      Visit.countDocuments(filter)
    ]);

    return { visits, total };
  }

  static async completeVisit(visitId: string, userId: string, generatedNote: string): Promise<VisitType | null> {
    const conn = await connectToDatabase();

    if (!conn) {
      const visit = await MockVisitService.findByVisitId(visitId, userId);
      if (!visit) return null;

      return MockVisitService.updateVisit(visitId, userId, {
        status: 'completed',
        generatedNote,
        completedAt: new Date()
      });
    }

    return Visit.findOneAndUpdate(
      { visitId, userId },
      {
        $set: {
          status: 'completed',
          generatedNote,
          completedAt: new Date()
        }
      },
      { new: true }
    );
  }

  static async searchVisits(userId: string, query: string, page = 1, limit = 20): Promise<{ visits: VisitType[]; total: number }> {
    const conn = await connectToDatabase();

    if (!conn) {
      // Simple mock search implementation
      const userVisits = await MockVisitService.listVisits(userId, 1, 1000);
      const searchRegex = new RegExp(query, 'i');
      const filtered = userVisits.visits.filter(visit =>
        visit.patientAlias?.match(searchRegex) ||
        visit.chiefComplaint?.match(searchRegex)
      );

      const start = (page - 1) * limit;
      const end = start + limit;
      return {
        visits: filtered.slice(start, end),
        total: filtered.length
      };
    }

    const skip = (page - 1) * limit;
    const searchRegex = new RegExp(query, 'i');

    const filter = {
      userId,
      $or: [
        { patientAlias: searchRegex },
        { chiefComplaint: searchRegex },
        { 'allergyHistory.food.allergen': searchRegex },
        { 'allergyHistory.environmental.allergen': searchRegex },
        { 'allergyHistory.stingingInsects.allergen': searchRegex },
        { 'allergyHistory.latexOther.allergen': searchRegex }
      ]
    };

    const [visits, total] = await Promise.all([
      Visit.find(filter)
        .skip(skip)
        .limit(limit)
        .sort({ createdAt: -1 })
        .select('-sources.content'),
      Visit.countDocuments(filter)
    ]);

    return { visits, total };
  }

  static async getVisitStatistics(userId: string): Promise<{
    totalVisits: number;
    completedVisits: number;
    draftVisits: number;
    archivedVisits: number;
    recentVisits: VisitType[];
  }> {
    const conn = await connectToDatabase();

    if (!conn) {
      const userVisits = await MockVisitService.listVisits(userId, 1, 1000);
      const completed = userVisits.visits.filter(v => v.status === 'completed');
      const draft = userVisits.visits.filter(v => v.status === 'draft');
      const archived = userVisits.visits.filter(v => v.status === 'archived');

      return {
        totalVisits: userVisits.total,
        completedVisits: completed.length,
        draftVisits: draft.length,
        archivedVisits: archived.length,
        recentVisits: userVisits.visits.slice(0, 5) as VisitType[]
      };
    }

    const [totalVisits, completedVisits, draftVisits, archivedVisits, recentVisits] = await Promise.all([
      Visit.countDocuments({ userId }),
      Visit.countDocuments({ userId, status: 'completed' }),
      Visit.countDocuments({ userId, status: 'draft' }),
      Visit.countDocuments({ userId, status: 'archived' }),
      Visit.find({ userId })
        .sort({ createdAt: -1 })
        .limit(5)
        .select('-sources.content')
    ]);

    return {
      totalVisits,
      completedVisits,
      draftVisits,
      archivedVisits,
      recentVisits
    };
  }
}