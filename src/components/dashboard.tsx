'use client'

import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { Plus, Eye, Trash2, Calendar, User, FileText, AlertCircle } from 'lucide-react'

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

  useEffect(() => {
    fetchVisits()
    fetchStatistics()
  }, [currentPage])

  const fetchVisits = async () => {
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
        hasRedFlags: checkForRedFlags(visit)
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
  }

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/visits/statistics')
      if (response.ok) {
        const data = await response.json()
        setStatistics(data)
      }
    } catch (error) {
      console.error('Error fetching statistics:', error)
    }
  }

  const checkForRedFlags = (visit: any): boolean => {
    // Simple red flag detection - can be enhanced
    return !!(
      visit.chiefComplaint?.toLowerCase().includes('severe') ||
      visit.chiefComplaint?.toLowerCase().includes('anaphylaxis') ||
      visit.chiefComplaint?.toLowerCase().includes('emergency')
    )
  }

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
      
      // Refresh the list
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
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getStatusBadge = (status: string) => {
    const variants = {
      draft: { className: 'bg-yellow-100 text-yellow-800', label: 'Draft' },
      completed: { className: 'bg-green-100 text-green-800', label: 'Completed' },
      archived: { className: 'bg-gray-100 text-gray-800', label: 'Archived' }
    }
    
    const variant = variants[status as keyof typeof variants]
    return (
      <Badge className={variant.className}>
        {variant.label}
      </Badge>
    )
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Loading visits...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Visits</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{statistics.totalVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <Calendar className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{statistics.completedVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Drafts</CardTitle>
            <AlertCircle className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{statistics.draftVisits}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Archived</CardTitle>
            <User className="h-4 w-4 text-gray-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-gray-600">{statistics.archivedVisits}</div>
          </CardContent>
        </Card>
      </div>

      {/* Visits List */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Visits</CardTitle>
            <CardDescription>Manage your patient visits</CardDescription>
          </div>
          <Button onClick={onNewVisit} size="sm">
            <Plus className="mr-2 h-4 w-4" />
            New Visit
          </Button>
        </CardHeader>
        <CardContent>
          {visits.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500 mb-4">No visits found</p>
              <Button onClick={onNewVisit} variant="outline">
                Create New Visit
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {visits.map((visit) => (
                <div key={visit._id} className="border rounded-lg p-4 hover:bg-gray-50">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center space-x-2">
                        <h3 className="font-medium">{visit.patientAlias}</h3>
                        {visit.hasRedFlags && (
                          <Badge variant="destructive" className="text-xs">
                            ⚠️ Red Flags
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-gray-600">{visit.chiefComplaint}</p>
                      <div className="flex items-center space-x-4 text-xs text-gray-500">
                        <span className="flex items-center">
                          <Calendar className="mr-1 h-3 w-3" />
                          {formatDate(visit.createdAt)}
                        </span>
                        <span className="flex items-center">
                          <FileText className="mr-1 h-3 w-3" />
                          {visit.sourcesCount} sources
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {getStatusBadge(visit.status)}
                      <Button
                        onClick={() => onSelectVisit(visit.visitId)}
                        variant="ghost"
                        size="sm"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteVisit(visit.visitId)}
                        variant="ghost"
                        size="sm"
                        className="text-red-600 hover:text-red-700"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center space-x-2">
          <Button
            onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
            disabled={currentPage === 1}
            variant="outline"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-sm text-gray-600">
            Page {currentPage} of {totalPages}
          </span>
          <Button
            onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
            disabled={currentPage === totalPages}
            variant="outline"
          >
            Next
          </Button>
        </div>
      )}
    </div>
  )
}