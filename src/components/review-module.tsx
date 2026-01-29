'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/toaster'
import { ArrowLeft, ArrowRight, Edit3, Save, X } from 'lucide-react'
import { extractionSchema, ExtractionData } from '@/types/schemas'

interface ReviewModuleProps {
  visitId: string
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

  const handleCancel = () => {
    setIsEditing(false)
  }

  if (isEditing) {
    return (
      <div className="space-y-2">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        {type === 'object' ? (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={6}
            className="font-mono text-sm"
          />
        ) : (
          <Textarea
            value={editValue}
            onChange={(e) => setEditValue(e.target.value)}
            rows={type === 'array' ? 3 : 2}
          />
        )}
        <div className="flex space-x-2">
          <Button size="sm" onClick={handleSave}>
            <Save className="mr-1 h-3 w-3" />
            Save
          </Button>
          <Button size="sm" variant="outline" onClick={handleCancel}>
            <X className="mr-1 h-3 w-3" />
            Cancel
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <Button
          size="sm"
          variant="ghost"
          onClick={() => setIsEditing(true)}
          className="h-6 px-2"
        >
          <Edit3 className="h-3 w-3" />
        </Button>
      </div>
      {type === 'array' ? (
        <div className="flex flex-wrap gap-1">
          {Array.isArray(value) && value.length > 0 ? (
            value.map((item, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {item}
              </Badge>
            ))
          ) : (
            <span className="text-sm text-gray-500 italic">None</span>
          )}
        </div>
      ) : type === 'object' ? (
        <pre className="text-sm bg-gray-50 p-2 rounded text-xs overflow-x-auto">
          {typeof value === 'object' && value !== null
            ? JSON.stringify(value, null, 2)
            : 'null'}
        </pre>
      ) : (
        <div className="text-sm text-gray-900 min-h-[1.5rem]">
          {value || <span className="text-gray-500 italic">None</span>}
        </div>
      )}
    </div>
  )
}

function AllergyHistorySection({ data, onChange }: { data: ExtractionData['allergyHistory'], onChange: (data: ExtractionData['allergyHistory']) => void }) {
  const renderAllergyArray = (allergies: any[], title: string, key: string) => (
    <div className="space-y-2">
      <h4 className="font-medium text-sm text-gray-700">{title}</h4>
      {allergies && allergies.length > 0 ? (
        <div className="space-y-2">
          {allergies.map((allergy, index) => (
            <div key={index} className="border rounded p-3 space-y-1">
              <div className="grid grid-cols-2 gap-2 text-xs">
                <div><strong>Allergen:</strong> {allergy.allergen}</div>
                <div><strong>Reaction:</strong> {allergy.reaction || 'Not specified'}</div>
                <div><strong>Severity:</strong> {allergy.severity || 'Unknown'}</div>
                <div><strong>Certainty:</strong> {allergy.certainty}</div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <p className="text-sm text-gray-500 italic">No {title.toLowerCase()} recorded</p>
      )}
    </div>
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle>Allergy History</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {renderAllergyArray(data?.food || [], 'Food Allergies', 'food')}
        {renderAllergyArray(data?.drug || [], 'Drug Allergies', 'drug')}
        {renderAllergyArray(data?.environmental || [], 'Environmental Allergies', 'environmental')}
        {renderAllergyArray(data?.stingingInsects || [], 'Stinging Insect Allergies', 'stingingInsects')}
        {renderAllergyArray(data?.latexOther || [], 'Latex/Other Allergies', 'latexOther')}
      </CardContent>
    </Card>
  )
}

function MedicationsSection({ data, onChange }: { data: ExtractionData['medications'], onChange: (data: ExtractionData['medications']) => void }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Current Medications</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {data && data.length > 0 ? (
          <div className="space-y-2">
            {data.map((med, index) => (
              <div key={index} className="border rounded p-3 space-y-1">
                <div className="font-medium">{med.name}</div>
                {med.dose && <div className="text-sm text-gray-600">Dose: {med.dose}</div>}
                {med.frequency && <div className="text-sm text-gray-600">Frequency: {med.frequency}</div>}
                {med.indication && <div className="text-sm text-gray-600">Indication: {med.indication}</div>}
                {med.response && <div className="text-sm text-gray-600">Response: {med.response}</div>}
                {med.adverseEffects && <div className="text-sm text-gray-600">Side Effects: {med.adverseEffects}</div>}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 italic">No medications recorded</p>
        )}
      </CardContent>
    </Card>
  )
}

export function ReviewModule({ visitId, onBack, onNext }: ReviewModuleProps) {
  const [extraction, setExtraction] = useState<ExtractionData | null>(null)
  const [isExtracting, setIsExtracting] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  const { toast } = useToast()

  useEffect(() => {
    extractFacts()
  }, [visitId])

  const extractFacts = async () => {
    try {
      setIsExtracting(true)
      setError(null)

      // Get sources from session storage
      const sourcesJson = sessionStorage.getItem(`sources_${visitId}`)
      if (!sourcesJson) {
        throw new Error('No sources found for this visit')
      }

      const sources = JSON.parse(sourcesJson)

      const response = await fetch('/api/extract-facts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitId,
          sources,
        }),
      })

      if (!response.ok) {
        throw new Error('Extraction failed')
      }

      const result = await response.json()
      setExtraction(result)

      toast({
        title: 'Extraction Complete',
        description: 'Medical information has been extracted and is ready for review.',
      })

    } catch (error) {
      console.error('Extraction error:', error)
      setError(error instanceof Error ? error.message : 'Failed to extract information')
      toast({
        title: 'Extraction Error',
        description: 'Failed to extract medical information. Please try again.',
        variant: 'destructive',
      })
    } finally {
      setIsExtracting(false)
    }
  }

  const handleFieldChange = (fieldPath: string, value: any) => {
    if (!extraction) return

    const newExtraction = { ...extraction }
    const pathParts = fieldPath.split('.')
    let current: any = newExtraction

    // Navigate to the parent of the field to change
    for (let i = 0; i < pathParts.length - 1; i++) {
      current = current[pathParts[i]]
    }

    // Set the new value
    current[pathParts[pathParts.length - 1]] = value
    setExtraction(newExtraction)
  }

  const handleNext = () => {
    if (extraction) {
      // Store the edited extraction in session storage for the note generation step
      sessionStorage.setItem(`extraction_${visitId}`, JSON.stringify(extraction))
      onNext()
    }
  }

  if (isExtracting) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Extracting medical information...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (error) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-red-600 mb-4">{error}</p>
            <Button onClick={extractFacts}>
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!extraction) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">No extraction data available.</p>
            <Button onClick={extractFacts}>
              Extract Information
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Step 2: Review Extracted Information</CardTitle>
          <CardDescription>
            Review and edit the extracted medical information before generating the final note.
            Items marked with confidence flags or needing confirmation should be carefully reviewed.
          </CardDescription>
        </CardHeader>
      </Card>

      {/* Basic Information */}
      <Card>
        <CardHeader>
          <CardTitle>Patient & Visit Information</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Patient Alias"
            value={extraction.patientAlias}
            onChange={(value) => handleFieldChange('patientAlias', value)}
          />
          <EditableField
            label="Chief Complaint"
            value={extraction.chiefComplaint}
            onChange={(value) => handleFieldChange('chiefComplaint', value)}
          />
        </CardContent>
      </Card>

      {/* History of Present Illness */}
      <Card>
        <CardHeader>
          <CardTitle>History of Present Illness</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="HPI"
            value={extraction.hpi}
            onChange={(value) => handleFieldChange('hpi', value)}
            type="object"
          />
        </CardContent>
      </Card>

      {/* Allergy History */}
      <AllergyHistorySection
        data={extraction.allergyHistory}
        onChange={(data) => handleFieldChange('allergyHistory', data)}
      />

      {/* Atopic Comorbidities */}
      <Card>
        <CardHeader>
          <CardTitle>Atopic Comorbidities</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Atopic Comorbidities"
            value={extraction.atopicComorbidities}
            onChange={(value) => handleFieldChange('atopicComorbidities', value)}
            type="object"
          />
        </CardContent>
      </Card>

      {/* Medications */}
      <MedicationsSection
        data={extraction.medications}
        onChange={(data) => handleFieldChange('medications', data)}
      />

      {/* Past Medical/Surgical/Family/Social History */}
      <Card>
        <CardHeader>
          <CardTitle>Medical History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Past Medical History"
            value={extraction.pmh}
            onChange={(value) => handleFieldChange('pmh', value)}
            type="array"
          />
          <EditableField
            label="Past Surgical History"
            value={extraction.psh}
            onChange={(value) => handleFieldChange('psh', value)}
            type="array"
          />
          <EditableField
            label="Family History"
            value={extraction.fh}
            onChange={(value) => handleFieldChange('fh', value)}
            type="array"
          />
          <EditableField
            label="Social History"
            value={extraction.sh}
            onChange={(value) => handleFieldChange('sh', value)}
            type="array"
          />
        </CardContent>
      </Card>

      {/* Review of Systems */}
      <Card>
        <CardHeader>
          <CardTitle>Review of Systems</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="ROS"
            value={extraction.ros}
            onChange={(value) => handleFieldChange('ros', value)}
            type="object"
          />
        </CardContent>
      </Card>

      {/* Physical Exam */}
      <Card>
        <CardHeader>
          <CardTitle>Physical Exam</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Exam Findings"
            value={extraction.exam}
            onChange={(value) => handleFieldChange('exam', value)}
            type="array"
          />
        </CardContent>
      </Card>

      {/* Tests and Labs */}
      <Card>
        <CardHeader>
          <CardTitle>Tests and Labs</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Tests and Labs"
            value={extraction.testsAndLabs}
            onChange={(value) => handleFieldChange('testsAndLabs', value)}
            type="object"
          />
        </CardContent>
      </Card>

      {/* Assessment and Plan */}
      <Card>
        <CardHeader>
          <CardTitle>Assessment and Plan</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Assessment Candidates"
            value={extraction.assessmentCandidates}
            onChange={(value) => handleFieldChange('assessmentCandidates', value)}
            type="object"
          />
          <EditableField
            label="Plan Candidates"
            value={extraction.planCandidates}
            onChange={(value) => handleFieldChange('planCandidates', value)}
            type="object"
          />
        </CardContent>
      </Card>

      {/* Needs Confirmation and Quality Flags */}
      <Card>
        <CardHeader>
          <CardTitle>Needs Confirmation & Quality Flags</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <EditableField
            label="Needs Confirmation"
            value={extraction.needsConfirmation}
            onChange={(value) => handleFieldChange('needsConfirmation', value)}
            type="array"
          />
          <EditableField
            label="Source Quality Flags"
            value={extraction.sourceQualityFlags}
            onChange={(value) => handleFieldChange('sourceQualityFlags', value)}
            type="array"
          />
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Capture
        </Button>
        
        <Button onClick={handleNext}>
          Generate Note
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </div>
  )
}