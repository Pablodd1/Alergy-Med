import { describe, it, expect, beforeEach, afterEach } from 'vitest'
import { VisitService } from '@/services/visitService'
import { UserService } from '@/services/userService'
import connectToDatabase from '@/lib/mongodb'

// Mock database connection for testing
vi.mock('@/lib/mongodb', () => ({
  default: vi.fn().mockResolvedValue({
    connection: {
      readyState: 1,
      host: 'localhost',
      port: 27017,
      name: 'allergy-scribe-test'
    }
  })
}))

describe('VisitService', () => {
  let testUserId: string
  let testVisitId: string

  beforeEach(async () => {
    // Create test user
    const user = await UserService.createUser({
      username: 'testuser',
      password: 'testpassword123',
      email: 'test@example.com'
    })
    testUserId = user._id
  })

  afterEach(async () => {
    // Clean up test data
    if (testUserId) {
      await UserService.deleteUser(testUserId)
    }
  })

  describe('createVisit', () => {
    it('should create a new visit successfully', async () => {
      const visitData = {
        userId: testUserId,
        visitId: `test_visit_${Date.now()}`,
        patientAlias: 'Test Patient',
        chiefComplaint: 'Allergic reactions to food',
        sources: []
      }

      const visit = await VisitService.createVisit(visitData)

      expect(visit).toBeDefined()
      expect(visit.visitId).toBe(visitData.visitId)
      expect(visit.patientAlias).toBe(visitData.patientAlias)
      expect(visit.status).toBe('draft')
      expect(visit.createdAt).toBeInstanceOf(Date)

      testVisitId = visit.visitId
    })

    it('should throw error for duplicate visit ID', async () => {
      const visitData = {
        userId: testUserId,
        visitId: `duplicate_visit_${Date.now()}`,
        patientAlias: 'Test Patient',
        chiefComplaint: 'Allergic reactions',
        sources: []
      }

      // Create first visit
      await VisitService.createVisit(visitData)

      // Try to create duplicate
      await expect(VisitService.createVisit(visitData)).rejects.toThrow('Visit ID already exists')
    })
  })

  describe('findByVisitId', () => {
    beforeEach(async () => {
      const visitData = {
        userId: testUserId,
        visitId: `find_test_${Date.now()}`,
        patientAlias: 'Find Test Patient',
        chiefComplaint: 'Find test complaint',
        sources: []
      }

      const visit = await VisitService.createVisit(visitData)
      testVisitId = visit.visitId
    })

    it('should find visit by visit ID and user ID', async () => {
      const foundVisit = await VisitService.findByVisitId(testVisitId, testUserId)

      expect(foundVisit).toBeDefined()
      expect(foundVisit!.visitId).toBe(testVisitId)
      expect(foundVisit!.userId).toBe(testUserId)
    })

    it('should return null for non-existent visit', async () => {
      const foundVisit = await VisitService.findByVisitId('non-existent-id', testUserId)
      expect(foundVisit).toBeNull()
    })

    it('should return null for visit belonging to different user', async () => {
      // Create another user
      const otherUser = await UserService.createUser({
        username: 'otheruser',
        password: 'otherpassword123'
      })

      const foundVisit = await VisitService.findByVisitId(testVisitId, otherUser._id)
      expect(foundVisit).toBeNull()

      // Cleanup
      await UserService.deleteUser(otherUser._id)
    })
  })

  describe('updateVisit', () => {
    beforeEach(async () => {
      const visitData = {
        userId: testUserId,
        visitId: `update_test_${Date.now()}`,
        patientAlias: 'Update Test Patient',
        chiefComplaint: 'Update test complaint',
        sources: []
      }

      const visit = await VisitService.createVisit(visitData)
      testVisitId = visit.visitId
    })

    it('should update visit successfully', async () => {
      const updates = {
        patientAlias: 'Updated Patient Name',
        chiefComplaint: 'Updated chief complaint',
        status: 'completed' as const
      }

      const updatedVisit = await VisitService.updateVisit(testVisitId, testUserId, updates)

      expect(updatedVisit).toBeDefined()
      expect(updatedVisit!.patientAlias).toBe(updates.patientAlias)
      expect(updatedVisit!.chiefComplaint).toBe(updates.chiefComplaint)
      expect(updatedVisit!.status).toBe(updates.status)
    })

    it('should not update visit belonging to different user', async () => {
      const otherUser = await UserService.createUser({
        username: 'updater',
        password: 'updaterpassword123'
      })

      const updates = { patientAlias: 'Should not update' }
      const updatedVisit = await VisitService.updateVisit(testVisitId, otherUser._id, updates)

      expect(updatedVisit).toBeNull()

      await UserService.deleteUser(otherUser._id)
    })
  })

  describe('listVisits', () => {
    beforeEach(async () => {
      // Create multiple visits for testing
      for (let i = 0; i < 5; i++) {
        await VisitService.createVisit({
          userId: testUserId,
          visitId: `list_test_${Date.now()}_${i}`,
          patientAlias: `List Test Patient ${i}`,
          chiefComplaint: `List test complaint ${i}`,
          sources: []
        })
      }
    })

    it('should list visits with pagination', async () => {
      const result = await VisitService.listVisits(testUserId, 1, 3)

      expect(result.visits).toHaveLength(3)
      expect(result.total).toBeGreaterThanOrEqual(3)
    })

    it('should filter visits by status', async () => {
      const result = await VisitService.listVisits(testUserId, 1, 10, 'draft')

      expect(result.visits.length).toBeGreaterThan(0)
      result.visits.forEach(visit => {
        expect(visit.status).toBe('draft')
      })
    })
  })

  describe('searchVisits', () => {
    beforeEach(async () => {
      await VisitService.createVisit({
        userId: testUserId,
        visitId: `search_test_${Date.now()}`,
        patientAlias: 'Searchable Patient',
        chiefComplaint: 'Searchable complaint about allergies',
        sources: []
      })
    })

    it('should search visits by patient alias', async () => {
      const result = await VisitService.searchVisits(testUserId, 'Searchable Patient', 1, 10)

      expect(result.visits.length).toBeGreaterThan(0)
      expect(result.visits[0].patientAlias).toContain('Searchable Patient')
    })

    it('should search visits by chief complaint', async () => {
      const result = await VisitService.searchVisits(testUserId, 'allergies', 1, 10)

      expect(result.visits.length).toBeGreaterThan(0)
      expect(result.visits[0].chiefComplaint).toContain('allergies')
    })
  })

  describe('getVisitStatistics', () => {
    beforeEach(async () => {
      // Create visits with different statuses
      await VisitService.createVisit({
        userId: testUserId,
        visitId: `stat_draft_${Date.now()}`,
        patientAlias: 'Draft Patient',
        chiefComplaint: 'Draft complaint',
        sources: []
      })

      const completedVisit = await VisitService.createVisit({
        userId: testUserId,
        visitId: `stat_completed_${Date.now()}`,
        patientAlias: 'Completed Patient',
        chiefComplaint: 'Completed complaint',
        sources: []
      })

      // Mark as completed
      await VisitService.updateVisit(completedVisit.visitId, testUserId, { status: 'completed' })
    })

    it('should return visit statistics', async () => {
      const stats = await VisitService.getVisitStatistics(testUserId)

      expect(stats).toBeDefined()
      expect(stats.totalVisits).toBeGreaterThan(0)
      expect(stats.draftVisits).toBeGreaterThanOrEqual(0)
      expect(stats.completedVisits).toBeGreaterThanOrEqual(0)
      expect(stats.recentVisits).toBeInstanceOf(Array)
    })
  })
})