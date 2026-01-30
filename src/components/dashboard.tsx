'use client'

import { useState, useEffect, useCallback } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Eye, Trash2, Calendar, FileText, AlertCircle, ChevronRight, Activity } from 'lucide-react'

interface Visit {
  _id: string
  visitId: string
  patientAlias: string
  chiefComplaint: string
  status: 'draft' | 'completed' | 'archived'
  createdAt: string
  updatedAt: string
  completedAt?: string
  sourcesCount: number
  hasRedFlags: boolean
}

interface DashboardProps {
  onNewVisit: () => void
  onSelectVisit: (visitId: string) => void
}

export function Dashboard({ onNewVisit, onSelectVisit }: DashboardProps) {
  const [visits, setVisits] = useState<Visit[]>([])
  const [statistics, setStatistics] = useState({
    totalVisits: 0,
    completedVisits: 0,
    draftVisits: 0,
    archivedVisits: 0
  })
  const [isLoading, setIsLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const itemsPerPage = 10
  const { toast } = useToast()

  const fetchVisits = useCallback(async () => {
    try {
      setIsLoading(true)
      const response = await fetch(`/api/visits?page=${currentPage}&limit=${itemsPerPage}`)

      if (!response.ok) {
        throw new Error('Failed to fetch visits')
      }

      const data = await response.json()

      // Calculate additional properties
      const visitsWithMetadata = data.visits.map((visit: any) => ({
        ...visit,
        sourcesCount: visit.sources?.length || 0,
        hasRedFlags: !!(
          visit.chiefComplaint?.toLowerCase().includes('severe') ||
          visit.chiefComplaint?.toLowerCase().includes('anaphylaxis') ||
          visit.chiefComplaint?.toLowerCase().includes('emergency')
        )
      }))

      setVisits(visitsWithMetadata)
      setTotalPages(Math.ceil(data.total / itemsPerPage))
    } catch (error) {
      console.error('Error fetching visits:', error)
      toast({
        title: 'Error',
        description: 'Failed to load visits',
        variant: 'destructive'
      })
    } finally {
      setIsLoading(false)
    }
  }, [currentPage, itemsPerPage, toast])

  const fetchStatistics = useCallback(async () => {
    try {
      const response = await fetch('/api/visits/statistics')
      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }, [])

  useEffect(() => {
    fetchVisits()
    fetchStatistics()
  }, [fetchVisits, fetchStatistics])

  const handleDeleteVisit = async (visitId: string) => {
    if (!confirm('Are you sure you want to delete this visit? This action cannot be undone.')) {
      return
    }

    try {
      const response = await fetch(`/api/visits/${visitId}`, {
        method: 'DELETE'
      })

      if (!response.ok) {
        throw new Error('Failed to delete visit')
      }

      toast({
        title: 'Success',
        description: 'Visit deleted successfully'
      })

      fetchVisits()
      fetchStatistics()

    } catch (error) {
      console.error('Error deleting visit:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete visit',
        variant: 'destructive'
      })
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { className: 'bg-amber-100 text-amber-700 border-amber-200', label: 'Draft' },
      completed: { className: 'bg-emerald-100 text-emerald-700 border-emerald-200', label: 'Completed' },
      archived: { className: 'bg-slate-100 text-slate-600 border-slate-200', label: 'Archived' }
    }

    const variant = variants[status as keyof typeof variants]
    return (
      <Badge variant="outline" className={`${variant.className} font-semibold py-0.5 px-2`}>
        {variant.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh] space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
        <p className="text-slate-500 font-medium animate-pulse">Loading clinical data...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* Header with Call-to-Action */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Clinical Dashboard</h1>
          <p className="text-slate-500">Welcome back, Doctor. You have {statistics.draftVisits} active drafts.</p>
        </div>
        <Button onClick={onNewVisit} className="btn-premium h-14 px-8 shadow-blue-200">
          <Plus className="mr-2 h-5 w-5" />
          Start New Visit
        </Button>
      </div>

      {/* Statistics Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {[
          { label: 'Total Visits', value: statistics.totalVisits, icon: FileText, color: 'blue' },
          { label: 'Completed', value: statistics.completedVisits, icon: Activity, color: 'emerald' },
          { label: 'Pending Drafts', value: statistics.draftVisits, icon: AlertCircle, color: 'amber' },
          { label: 'Archived', value: statistics.archivedVisits, icon: Calendar, color: 'slate' },
        ].map((stat, i) => (
          <Card key={i} className="border-none shadow-premium overflow-hidden">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <div className={`p-2 rounded-lg bg-${stat.color}-50`}>
                  <stat.icon className={`h-5 w-5 text-${stat.color}-600`} />
                </div>
              </div>
              <div className="text-2xl font-bold text-slate-900">{stat.value}</div>
              <p className="text-sm font-medium text-slate-500">{stat.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Area */}
      <Card className="border-none shadow-premium overflow-hidden">
        <CardHeader className="border-b border-slate-50 bg-slate-50/50">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Recent Case History</CardTitle>
            <div className="flex items-center text-sm text-slate-400">
              Showing {visits.length} of {statistics.totalVisits} visits
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {visits.length === 0 ? (
            <div className="text-center py-20 px-4">
              <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4">
                <FileText className="h-10 w-10 text-slate-300" />
              </div>
              <h3 className="text-lg font-semibold text-slate-900">No visits found</h3>
              <p className="text-slate-500 mb-6 max-w-xs mx-auto">Create your first patient visit to start generating AI-powered clinical notes.</p>
              <Button onClick={onNewVisit} variant="outline" className="rounded-xl border-2 px-8 h-12">
                Create First Visit
              </Button>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {visits.map((visit) => (
                <div
                  key={visit._id}
                  className="group p-6 hover:bg-blue-50/50 transition-colors cursor-pointer"
                  onClick={() => onSelectVisit(visit.visitId)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 pr-4">
                      <div className="flex items-center flex-wrap gap-2 mb-1">
                        <h3 className="font-bold text-slate-900 text-lg truncate">{visit.patientAlias}</h3>
                        {getStatusBadge(visit.status)}
                        {visit.hasRedFlags && (
                          <Badge variant="destructive" className="bg-red-50 text-red-600 border-red-100 shadow-none">
                            High Priority
                          </Badge>
                        )}
                      </div>
                      <p className="text-slate-600 text-base line-clamp-1 mb-3">{visit.chiefComplaint}</p>

                      <div className="flex items-center gap-6 text-sm text-slate-400">
                        <span className="flex items-center font-medium">
                          <Calendar className="mr-2 h-4 w-4" />
                          {formatDate(visit.createdAt)}
                        </span>
                        <span className="flex items-center font-medium">
                          <Activity className="mr-2 h-4 w-4" />
                          {visit.sourcesCount} Clinical Sources
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteVisit(visit.visitId);
                        }}
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-slate-300 hover:text-red-500"
                      >
                        <Trash2 className="h-5 w-5" />
                      </Button>
                      <div className="bg-blue-50 p-2 rounded-xl text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-all">
                        <ChevronRight className="h-5 w-5" />
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination Container */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="ghost"
            className="rounded-xl px-4"
          >
            ← Previous
          </Button>
          <div className="text-sm font-semibold text-slate-600">
            Page <span className="text-blue-600">{currentPage}</span> of {totalPages}
          </div>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="ghost"
            className="rounded-xl px-4"
          >
            Next →
          </Button>
        </div>
      )}
    </div>
  )
}