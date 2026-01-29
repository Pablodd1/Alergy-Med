'use client'

import { useState } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { CaptureModule } from '@/components/capture-module-db'
import { ReviewModule } from '@/components/review-module-db'
import { NoteModule } from '@/components/note-module-db'
import { Dashboard } from '@/components/dashboard'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { VisitService } from '@/services/visitService'

export type Step = 'capture' | 'review' | 'note'

export default function Home() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [currentStep, setCurrentStep] = useState<Step>('capture')
  const [visitId, setVisitId] = useState<string | null>(null)
  const [showDashboard, setShowDashboard] = useState(true)

  if (status === 'loading') {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </Card>
      </div>
    )
  }

  if (!session) {
    router.push('/auth/signin')
    return null
  }

  const steps = [
    { id: 'capture', name: 'Step 1: Capture', description: 'Record audio, photos, documents' },
    { id: 'review', name: 'Step 2: Review', description: 'Extract and verify facts' },
    { id: 'note', name: 'Step 3: Generate Note', description: 'Create comprehensive note' },
  ]

  // Initialize a new visit when starting capture
  const handleStartCapture = async () => {
    try {
      const newVisitId = `visit_${Date.now()}`
      const userId = session.user?.id || 'demo-user'
      
      // Create a new visit in the database
      await VisitService.createVisit({
        userId,
        visitId: newVisitId,
        patientAlias: 'Patient', // Will be updated during extraction
        chiefComplaint: 'To be determined', // Will be updated during extraction
        sources: []
      })
      
      setVisitId(newVisitId)
      setShowDashboard(false)
      setCurrentStep('capture')
    } catch (error) {
      console.error('Failed to create visit:', error)
    }
  }

  const handleNewVisit = () => {
    setVisitId(null)
    setShowDashboard(true)
    setCurrentStep('capture')
  }

  const handleSelectVisit = (selectedVisitId: string) => {
    setVisitId(selectedVisitId)
    setShowDashboard(false)
    setCurrentStep('review')
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <h1 className="text-xl font-semibold text-gray-900">
              {showDashboard ? 'Allergy Scribe Dashboard' : 'Allergy Scribe'}
            </h1>
            <div className="flex items-center space-x-4">
              {session.user?.username && (
                <span className="text-sm text-gray-500">Welcome, {session.user.username}</span>
              )}
              {visitId && !showDashboard && (
                <>
                  <span className="text-sm text-gray-500">Visit ID: {visitId}</span>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setShowDashboard(true)}
                  >
                    Back to Dashboard
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {showDashboard ? (
          <Dashboard onNewVisit={handleStartCapture} onSelectVisit={handleSelectVisit} />
        ) : (
          <>
            {!visitId ? (
              <div className="text-center">
                <Card className="p-8 max-w-md mx-auto">
                  <h2 className="text-2xl font-bold mb-4">Welcome to Allergy Scribe</h2>
                  <p className="text-gray-600 mb-6">Create a new visit to get started with medical note generation.</p>
                  <Button onClick={handleStartCapture} size="lg">
                    Start New Visit
                  </Button>
                </Card>
              </div>
            ) : (
              <>
                {/* Progress Steps */}
                <div className="mb-8">
                  <nav className="flex items-center justify-center">
                    {steps.map((step, index) => (
                      <div key={step.id} className="flex items-center">
                        <div
                          className={`flex items-center justify-center w-10 h-10 rounded-full text-sm font-medium ${
                            currentStep === step.id
                              ? 'bg-blue-600 text-white'
                              : steps.findIndex(s => s.id === currentStep) > index
                              ? 'bg-green-600 text-white'
                              : 'bg-gray-200 text-gray-600'
                          }`}
                        >
                          {index + 1}
                        </div>
                        <div className="ml-3 min-w-0">
                          <p className="text-sm font-medium text-gray-900">{step.name}</p>
                          <p className="text-sm text-gray-500">{step.description}</p>
                        </div>
                        {index < steps.length - 1 && (
                          <div className="mx-8 h-0.5 w-16 bg-gray-300" />
                        )}
                      </div>
                    ))}
                  </nav>
                </div>

                {/* Main Content */}
                <div className="space-y-6">
                  {currentStep === 'capture' && (
                    <CaptureModule visitId={visitId} userId={session.user?.id || 'demo-user'} onNext={() => setCurrentStep('review')} />
                  )}
                  
                  {currentStep === 'review' && (
                    <ReviewModule 
                      visitId={visitId} 
                      userId={session.user?.id || 'demo-user'}
                      onBack={() => setCurrentStep('capture')}
                      onNext={() => setCurrentStep('note')}
                    />
                  )}
                  
                  {currentStep === 'note' && (
                    <NoteModule 
                      visitId={visitId} 
                      userId={session.user?.id || 'demo-user'}
                      onBack={() => setCurrentStep('review')}
                    />
                  )}
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  )
}