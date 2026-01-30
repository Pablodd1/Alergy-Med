'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, ArrowRight, Edit3, Save, X, Activity, AlertTriangle, CheckCircle2, ClipboardList, Pill } from 'lucide-react'
import { ExtractionData } from '@/types/schemas'

interface ReviewModuleProps {
  visitId: string
  userId: string
  onBack: () => void
  onNext: () => void
}

interface EditableFieldProps {
  label: string
  value: any
  onChange: (value: any) => void
  type?: 'text' | 'array' | 'object'
}

function EditableField({ label, value, onChange, type = 'text' }: EditableFieldProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editValue, setEditValue] = useState('')

  useEffect(() => {
    if (type === 'array') {
      setEditValue(Array.isArray(value) ? value.join(', ') : '')
    } else if (type === 'object') {
      setEditValue(typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : '')
    } else {
      setEditValue(value?.toString() || '')
    }
  }, [value, type])

  const handleSave = () => {
    try {
      let newValue: any
      if (type === 'array') {
        newValue = editValue.split(',').map(item => item.trim()).filter(item => item)
      } else if (type === 'object') {
        newValue = JSON.parse(editValue)
      } else {
        newValue = editValue || null
      }
      onChange(newValue)
      setIsEditing(false)
    } catch (error) {
      console.error('Error saving field:', error)
    }
  }

  if (isEditing) {
    return (
      <div className="space-y-3 p-4 rounded-xl bg-blue-50/50 border border-blue-100 animate-fade-in">
        <label className="text-sm font-bold text-blue-900 uppercase tracking-wider">{label}</label>
        <Textarea
          value={editValue}
          onChange={(e) => setEditValue(e.target.value)}
          rows={type === 'object' ? 8 : type === 'array' ? 4 : 3}
          className="bg-white rounded-xl border-blue-200 focus:ring-blue-100 font-medium"
        />
        <div className="flex gap-2">
          <Button size="sm" onClick={handleSave} className="bg-blue-600 hover:bg-blue-700 text-white rounded-lg px-4">
            <Save className="mr-2 h-4 w-4" /> Save Changes
          </Button>
          <Button size="sm" variant="ghost" onClick={() => setIsEditing(false)} className="text-slate-500 rounded-lg">
            Discard
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="group relative p-4 rounded-xl hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">
      <div className="flex items-center justify-between mb-2">
        <label className="text-sm font-bold text-slate-400 uppercase tracking-wider">{label}</label>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="opacity-0 group-hover:opacity-100 transition-opacity h-8 px-2 text-blue-600 hover:bg-blue-50 hover:text-blue-700 rounded-lg"
        >
          <Edit3 className="h-4 w-4 mr-1" /> Edit
        </Button>
      </div>

      {type === 'array' ? (
        <div className="flex flex-wrap gap-2">
          {Array.isArray(value) && value.length > 0 ? (
            value.map((item, index) => (
              <Badge key={index} variant="outline" className="bg-white border-slate-200 text-slate-700 font-medium">
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-slate-400 italic font-medium">Not specified</span>
          )}
        </div>
      ) : type === 'object' ? (
        <pre className="text-sm bg-slate-900 text-slate-300 p-4 rounded-xl overflow-x-auto font-mono">
          {typeof value === 'object' && value !== null ? JSON.stringify(value, null, 2) : 'No data'}
        </pre>
      ) : (
        <p className="text-slate-900 font-medium leading-relaxed">
          {value || <span className="text-slate-400 italic">No entry found</span>}
        </p>
      )}
    </div>
  )
}

function AllergyCard({ allergy }: { allergy: any }) {
  return (
    <div className="p-4 rounded-xl border border-slate-100 bg-white shadow-sm hover:shadow-md transition-shadow">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-bold text-slate-900 text-lg">{allergy.allergen}</h4>
        <Badge className={allergy.certainty === 'confirmed' ? 'bg-emerald-100 text-emerald-700 border-emerald-200' : 'bg-amber-100 text-amber-700 border-amber-200'}>
          {allergy.certainty}
        </Badge>
      </div>
      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">Reaction</span>
          <p className="font-semibold text-slate-700 truncate">{allergy.reaction || 'Unknown'}</p>
        </div>
        <div>
          <span className="text-slate-400 font-bold text-[10px] uppercase tracking-tighter">Severity</span>
          <p className="font-semibold text-slate-700">{allergy.severity || 'Unknown'}</p>
        </div>
      </div>
    </div>
  )
}

export function ReviewModule({ visitId, userId, onBack, onNext }: ReviewModuleProps) {
  const [extraction, setExtraction] = useState<ExtractionData | null>(null)
  const [isExtracting, setIsExtracting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [analysisStatus, setAnalysisStatus] = useState<'analyzing' | 'complete' | 'partial' | 'error'>('analyzing')
  const [missingFields, setMissingFields] = useState<string[]>([])
  const [redFlags, setRedFlags] = useState<string[]>([])

  const { toast } = useToast()

  const analyzeDataCompleteness = useCallback((data: ExtractionData) => {
    const missing: string[] = []
    const flags: string[] = []

    if (!data.patientAlias?.trim()) missing.push('Patient identifying alias')
    if (!data.chiefComplaint?.trim()) missing.push('Chief complaint detail')
    if (!data.hpi?.onset) missing.push('HPI Onset information')

    const hasAllergies = (data.allergyHistory?.food?.length || 0) + (data.allergyHistory?.drug?.length || 0) > 0
    if (!hasAllergies) missing.push('Clinical allergy history (Food/Drug)')

    if (data.hpi?.severity && ['severe', 'anaphylaxis'].includes(data.hpi.severity.toLowerCase())) {
      flags.push('Critical: Severe reaction reported in HPI')
    }

    setMissingFields(missing)
    setRedFlags(flags)
    setAnalysisStatus(missing.length > 0 || flags.length > 0 ? 'partial' : 'complete')
  }, [])

  const extractFacts = useCallback(async () => {
    try {
      setIsExtracting(true)
      const visitResponse = await fetch(`/api/visits/${visitId}`)
      if (!visitResponse.ok) throw new Error('Visit not found')
      const visit = await visitResponse.json()

      if (!visit.sources?.length) throw new Error('No clinical sources to analyze')

      const response = await fetch('/api/extract-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId, sources: visit.sources }),
      })

      if (!response.ok) throw new Error('AI Engine failed to extract facts')

      const result = await response.json()
      setExtraction(result)
      analyzeDataCompleteness(result)

      toast({ title: 'Analysis Complete', description: 'Clinical entities successfully extracted.' })
    } catch (error: any) {
      setError(error.message)
      setAnalysisStatus('error')
    } finally {
      setIsExtracting(false)
    }
  }, [visitId, toast, analyzeDataCompleteness])

  useEffect(() => {
    extractFacts()
  }, [extractFacts])

  const handleFieldChange = async (fieldPath: string, value: any) => {
    if (!extraction) return
    const newExtraction = { ...extraction }
    const pathParts = fieldPath.split('.')
    let current: any = newExtraction
    for (let i = 0; i < pathParts.length - 1; i++) current = current[pathParts[i]]
    current[pathParts[pathParts.length - 1]] = value

    setExtraction(newExtraction)
    analyzeDataCompleteness(newExtraction)

    try {
      await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extraction: newExtraction }),
      });
    } catch (e) {
      toast({ title: 'Sync Error', description: 'Changes could not be saved to server.', variant: 'destructive' })
    }
  }

  if (isExtracting) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-4 animate-fade-in">
        <Activity className="h-12 w-12 text-blue-600 animate-pulse" />
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">AI Clinical Extraction in Progress...</p>
      </div>
    )
  }

  if (error) {
    return (
      <Card className="border-red-100 bg-red-50/50 shadow-premium">
        <CardContent className="p-10 text-center">
          <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-red-900 mb-2">Extraction Error</h2>
          <p className="text-red-700 mb-6">{error}</p>
          <Button onClick={extractFacts} className="btn-premium">Reconnect AI Engine</Button>
        </CardContent>
      </Card>
    )
  }

  if (!extraction) return null

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header & Quick Sync */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Entity Review</h1>
          <p className="text-slate-500 font-medium">Verify extracted data before note generation.</p>
        </div>
        <div className="flex items-center space-x-2">
          <span className={`h-3 w-3 rounded-full ${analysisStatus === 'complete' ? 'bg-emerald-500' : 'bg-amber-500'} animate-pulse`} />
          <span className="text-sm font-bold uppercase text-slate-400 tracking-wider">
            {analysisStatus === 'complete' ? 'AI Validated' : 'Needs Review'}
          </span>
        </div>
      </div>

      {/* Warnings & Flags */}
      {(missingFields.length > 0 || redFlags.length > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {missingFields.length > 0 && (
            <div className="p-5 rounded-2xl bg-amber-50 border border-amber-100 shadow-sm">
              <div className="flex items-center text-amber-800 font-bold mb-3">
                <ClipboardList className="mr-2 h-5 w-5" /> Incomplete Data
              </div>
              <div className="flex flex-wrap gap-2">
                {missingFields.map((f, i) => (
                  <Badge key={i} variant="outline" className="bg-white border-amber-200 text-amber-700">{f}</Badge>
                ))}
              </div>
            </div>
          )}
          {redFlags.length > 0 && (
            <div className="p-5 rounded-2xl bg-red-50 border border-red-100 shadow-sm">
              <div className="flex items-center text-red-800 font-bold mb-3">
                <AlertTriangle className="mr-2 h-5 w-5" /> High-Risk Flags
              </div>
              <div className="flex flex-wrap gap-2">
                {redFlags.map((f, i) => (
                  <Badge key={i} variant="outline" className="bg-white border-red-200 text-red-700">{f}</Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Review Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 space-y-6">
          <Card className="border-none shadow-premium overflow-hidden">
            <div className="h-1 bg-blue-600 w-full" />
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center">
                <CheckCircle2 className="mr-2 h-5 w-5 text-blue-600" /> Primary Clinical Data
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 divide-y divide-slate-100">
              <EditableField label="Patient Identity" value={extraction.patientAlias} onChange={(v) => handleFieldChange('patientAlias', v)} />
              <EditableField label="Chief Complaint" value={extraction.chiefComplaint} onChange={(v) => handleFieldChange('chiefComplaint', v)} />
              <EditableField label="HPI Analysis" value={extraction.hpi} onChange={(v) => handleFieldChange('hpi', v)} type="object" />
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center">
                <Activity className="mr-2 h-5 w-5 text-indigo-600" /> Exam & Assessment
              </CardTitle>
            </CardHeader>
            <CardContent className="p-2 divide-y divide-slate-100">
              <EditableField label="Physical Exam Findings" value={extraction.exam} onChange={(v) => handleFieldChange('exam', v)} type="array" />
              <EditableField label="Assessment Candidates" value={extraction.assessmentCandidates} onChange={(v) => handleFieldChange('assessmentCandidates', v)} type="array" />
              <EditableField label="Proposed Plan" value={extraction.planCandidates} onChange={(v) => handleFieldChange('planCandidates', v)} type="array" />
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-premium overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center">
                <AlertTriangle className="mr-2 h-5 w-5 text-rose-600" /> Verified Allergies
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-4 max-h-[600px] overflow-y-auto">
              {extraction.allergyHistory?.food?.map((a, i) => <AllergyCard key={i} allergy={a} />)}
              {extraction.allergyHistory?.drug?.map((a, i) => <AllergyCard key={i} allergy={a} />)}
              {(!extraction.allergyHistory?.food?.length && !extraction.allergyHistory?.drug?.length) && (
                <div className="text-center py-10">
                  <p className="text-slate-400 font-medium">No verified allergies found</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium overflow-hidden">
            <CardHeader className="bg-slate-50/50 border-b border-slate-100">
              <CardTitle className="text-lg flex items-center">
                <Pill className="mr-2 h-5 w-5 text-violet-600" /> Active Medications
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 space-y-3">
              {extraction.medications?.map((m, i) => (
                <div key={i} className="p-3 rounded-lg bg-slate-50 border border-slate-100 font-medium text-slate-700">
                  {m.name} {m.dose ? `(${m.dose})` : ''}
                </div>
              ))}
              {!extraction.medications?.length && <p className="text-center text-slate-400">None listed</p>}
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Sticky Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white/80 backdrop-blur-md border-t border-slate-200 p-4 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center px-4 md:px-8">
          <Button onClick={onBack} variant="ghost" className="text-slate-600 h-14 px-8 font-bold">
            <ArrowLeft className="mr-2 h-5 w-5" /> Return to Capture
          </Button>
          <Button onClick={onNext} className="btn-premium h-14 px-12 group shadow-blue-200">
            Generate Clinical Note
            <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
          </Button>
        </div>
      </div>
    </div>
  )
}