import { Visit, IVisit } from '@/models/Visit';
import connectToDatabase from '@/lib/mongodb';
import { ExtractionData } from '@/types/schemas';
import { MockVisitService } from '@/lib/mock-visit-service';

// ============================================================================
// VISIT SERVICE - No Authentication Required
// Production-Ready Clinical Documentation Service
// ============================================================================

type VisitType = IVisit | import('@/lib/mock-visit-service').IMockVisit;

// Default anonymous user for no-login operation
const ANONYMOUS_USER = 'anonymous-clinical-user';

export interface CreateVisitInput {
  userId?: string;
  visitId: string;
  patientAlias: string;
  chiefComplaint: string;
  sources: Array<{
    id: string;
    type: 'audio' | 'document' | 'text' | 'paste';
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
  hpi?: any;
  allergyHistory?: any;
  medications?: any;
  pmh?: string[];
  psh?: string[];
  fh?: string[];
  sh?: string[];
  ros?: any;
  exam?: any;
  testsAndLabs?: any;
  assessmentCandidates?: string[];
  planCandidates?: string[];
  needsConfirmation?: any;
  sourceQualityFlags?: any;
  atopicComorbidities?: any;
  sources?: any[];
  generatedNote?: string;
  status?: 'draft' | 'completed' | 'archived';
  extraction?: any;
  completedAt?: Date;
  cptCodes?: any[];
  icd10Codes?: any[];
  redFlags?: any[];
  soapNote?: any;
}

export class VisitService {

  // Create a new visit - no authentication required
  static async createVisit(input: CreateVisitInput): Promise<VisitType> {
    const conn = await connectToDatabase();
    const userId = input.userId || ANONYMOUS_USER;

    if (!conn) {
      return MockVisitService.createVisit({ ...input, userId });
    }

    const existingVisit = await Visit.findOne({ visitId: input.visitId });
    if (existingVisit) {
      throw new Error('Visit ID already exists');
    }

    const visit = new Visit({
      ...input,
      userId,
      status: 'draft'
    });

    await visit.save();
    return visit;
  }

  // Find visit by ID - no user restriction for anonymous access
  static async findByVisitId(visitId: string, userId?: string): Promise<VisitType | null> {
    const conn = await connectToDatabase();
    const effectiveUserId = userId || ANONYMOUS_USER;

    if (!conn) {
      return MockVisitService.findByVisitId(visitId, effectiveUserId);
    }

    // First try with userId, then without for anonymous access
    let visit = await Visit.findOne({ visitId, userId: effectiveUserId });
    if (!visit) {
      visit = await Visit.findOne({ visitId });
    }
    return visit;
  }

  static async findById(id: string, userId?: string): Promise<VisitType | null> {
    const conn = await connectToDatabase();
    const effectiveUserId = userId || ANONYMOUS_USER;

    if (!conn) {
      return MockVisitService.findById(id);
    }

    let visit = await Visit.findOne({ _id: id, userId: effectiveUserId });
    if (!visit) {
      visit = await Visit.findOne({ _id: id });
    }
    return visit;
  }

  static async updateVisit(visitId: string, userId: string | undefined, updates: UpdateVisitInput): Promise<VisitType | null> {
    const conn = await connectToDatabase();
    const effectiveUserId = userId || ANONYMOUS_USER;

    if (!conn) {
      return MockVisitService.updateVisitByVisitId(visitId, effectiveUserId, updates);
    }

    // Try to update with userId match first, then without for anonymous
    let result = await Visit.findOneAndUpdate(
      { visitId, userId: effectiveUserId },
      { $set: updates },
      { new: true }
    );

    if (!result) {
      result = await Visit.findOneAndUpdate(
        { visitId },
        { $set: updates },
        { new: true }
      );
    }

    return result;
  }

  static async updateVisitFromExtraction(visitId: string, userId: string | undefined, extraction: ExtractionData): Promise<VisitType | null> {
    const conn = await connectToDatabase();
    const effectiveUserId = userId || ANONYMOUS_USER;

    // Comprehensive update data including new fields
    const updateData: UpdateVisitInput = {
      patientAlias: extraction.patientAlias || undefined,
      chiefComplaint: extraction.chiefComplaint || undefined,
      hpi: extraction.hpi || undefined,
      allergyHistory: extraction.allergyHistory || undefined,
      medications: extraction.medications || [],
      pmh: extraction.pmh || [],
      psh: extraction.psh || [],
      fh: extraction.fh || [],
      sh: extraction.sh || [],
      ros: extraction.ros || undefined,
      exam: extraction.exam || [],
      testsAndLabs: extraction.testsAndLabs || undefined,
      assessmentCandidates: extraction.assessmentCandidates?.map(a => a.problem) || [],
      planCandidates: extraction.planCandidates?.map(p => p.item) || [],
      atopicComorbidities: extraction.atopicComorbidities || undefined,
      extraction: extraction,
      // New fields for billing and clinical support
      cptCodes: extraction.cptCodes || [],
      icd10Codes: extraction.icd10Codes || [],
      redFlags: extraction.redFlags || [],
      soapNote: extraction.soapNote || undefined
    };

    if (!conn) {
      return MockVisitService.updateVisitByVisitId(visitId, effectiveUserId, updateData);
    }

    let result = await Visit.findOneAndUpdate(
      { visitId, userId: effectiveUserId },
      { $set: updateData },
      { new: true }
    );

    if (!result) {
      result = await Visit.findOneAndUpdate(
        { visitId },
        { $set: updateData },
        { new: true }
      );
    }

    return result;
  }

  static async deleteVisit(visitId: string, userId?: string): Promise<boolean> {
    const conn = await connectToDatabase();
    const effectiveUserId = userId || ANONYMOUS_USER;

    if (!conn) {
      return MockVisitService.deleteVisit(visitId);
    }

    let result = await Visit.findOneAndDelete({ visitId, userId: effectiveUserId });
    if (!result) {
      result = await Visit.findOneAndDelete({ visitId });
    }
    return !!result;
  }

  static async listVisits(userId?: string, page = 1, limit = 20, status?: string): Promise<{ visits: VisitType[]; total: number }> {
    const conn = await connectToDatabase();
    const effectiveUserId = userId || ANONYMOUS_USER;

    if (!conn) {
      return MockVisitService.listVisits(effectiveUserId, page, limit, status);
    }

    const skip = (page - 1) * limit;
    const filter: any = {};

    // For anonymous, show all recent visits; for logged in, filter by user
    if (userId && userId !== ANONYMOUS_USER) {
      filter.userId = userId;
    }

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

  static async completeVisit(visitId: string, userId: string | undefined, generatedNote: string): Promise<VisitType | null> {
    const conn = await connectToDatabase();
    const effectiveUserId = userId || ANONYMOUS_USER;

    if (!conn) {
      const visit = await MockVisitService.findByVisitId(visitId, effectiveUserId);
      if (!visit) return null;

      return MockVisitService.updateVisit(visitId, effectiveUserId, {
        status: 'completed',
        generatedNote,
        completedAt: new Date()
      });
    }

    let result = await Visit.findOneAndUpdate(
      { visitId, userId: effectiveUserId },
      {
        $set: {
          status: 'completed',
          generatedNote,
          completedAt: new Date()
        }
      },
      { new: true }
    );

    if (!result) {
      result = await Visit.findOneAndUpdate(
        { visitId },
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

    return result;
  }

  static async getVisitStatistics(userId?: string): Promise<{
    totalVisits: number;
    completedVisits: number;
    draftVisits: number;
    archivedVisits: number;
    recentVisits: VisitType[];
  }> {
    const conn = await connectToDatabase();
    const effectiveUserId = userId || ANONYMOUS_USER;

    if (!conn) {
      const userVisits = await MockVisitService.listVisits(effectiveUserId, 1, 1000);
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

    const filter: any = {};
    if (userId && userId !== ANONYMOUS_USER) {
      filter.userId = userId;
    }

    const [totalVisits, completedVisits, draftVisits, archivedVisits, recentVisits] = await Promise.all([
      Visit.countDocuments(filter),
      Visit.countDocuments({ ...filter, status: 'completed' }),
      Visit.countDocuments({ ...filter, status: 'draft' }),
      Visit.countDocuments({ ...filter, status: 'archived' }),
      Visit.find(filter)
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