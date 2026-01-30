'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Copy, Download, FileText, RefreshCw } from 'lucide-react'
import { extractionSchema, ExtractionData } from '@/types/schemas'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

interface NoteModuleProps {
  visitId: string
  userId: string
  onBack: () => void
}

interface AllergenListItem {
  allergen: string
  reaction: string | null
  severity: string | null
  timing: string | null
  certainty: string
}

export function NoteModule({ visitId, userId, onBack }: NoteModuleProps) {
  const [extraction, setExtraction] = useState<ExtractionData | null>(null)
  const [note, setNote] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const { toast } = useToast()

  useEffect(() => {
    loadExtractionData()
  }, [visitId])

  const loadExtractionData = async () => {
    try {
      const response = await fetch(`/api/visits/${visitId}`)
      if (!response.ok) {
        throw new Error('Visit not found')
      }
      const visit = await response.json()

      if (visit.extraction) {
        setExtraction(visit.extraction)
        if (!visit.generatedNote) {
          generateNote(visit.extraction)
        } else {
          setNote(visit.generatedNote)
        }
      } else {
        toast({
          title: 'No extraction data found',
          description: 'Please complete the review step first.',
          variant: 'destructive'
        })
      }
    } catch (error) {
      console.error('Error loading extraction data:', error)
      toast({
        title: 'Error',
        description: 'Failed to load extraction data.',
        variant: 'destructive'
      })
    }
  }

  const generateNote = async (extractionData: ExtractionData) => {
    try {
      setIsGenerating(true)

      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          visitId,
          extraction: extractionData,
        }),
      })

      if (!response.ok) {
        throw new Error('Note generation failed')
      }

      const result = await response.json()
      setNote(result.note)

      // Save the generated note to the database
      await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generatedNote: result.note }),
      });

      toast({
        title: 'Note Generated',
        description: 'Medical note has been generated successfully.',
      })

    } catch (error) {
      console.error('Note generation error:', error)
      toast({
        title: 'Note Generation Failed',
        description: 'Failed to generate medical note. Please try again.',
        variant: 'destructive'
      })

      // Fallback to manual note generation
      const fallbackNote = generateNoteFromExtraction(extractionData)
      setNote(fallbackNote)

      // Save the fallback note
      await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ generatedNote: fallbackNote }),
      });
    } finally {
      setIsGenerating(false)
    }
  }

  const generateNoteFromExtraction = (data: ExtractionData): string => {
    let note = `MEDICAL NOTE\n===========\n\n`

    // Patient Information
    if (data.patientAlias) {
      note += `Patient: ${data.patientAlias}\n`
    }
    if (data.visitContext?.date) {
      note += `Date: ${data.visitContext.date}\n`
    }
    if (data.visitContext?.setting) {
      note += `Setting: ${data.visitContext.setting}\n`
    }
    note += '\n'

    // Chief Complaint
    if (data.chiefComplaint) {
      note += `CHIEF COMPLAINT:\n${data.chiefComplaint}\n\n`
    }

    // History of Present Illness
    if (data.hpi) {
      note += `HISTORY OF PRESENT ILLNESS:\n`
      if (data.hpi.onset) note += `Onset: ${data.hpi.onset}\n`
      if (data.hpi.timeline) note += `Timeline: ${data.hpi.timeline}\n`
      if (data.hpi.frequency) note += `Frequency: ${data.hpi.frequency}\n`
      if (data.hpi.severity) note += `Severity: ${data.hpi.severity}\n`
      if (data.hpi.triggers) note += `Triggers: ${data.hpi.triggers}\n`
      if (data.hpi.relievers) note += `Relievers: ${data.hpi.relievers}\n`
      note += '\n'
    }

    // Allergy History
    if (data.allergyHistory) {
      const allAllergies = [
        ...(data.allergyHistory.food || []),
        ...(data.allergyHistory.drug || []),
        ...(data.allergyHistory.environmental || []),
        ...(data.allergyHistory.stingingInsects || []),
        ...(data.allergyHistory.latexOther || [])
      ];

      if (allAllergies.length > 0) {
        note += `ALLERGY HISTORY:\n`
        allAllergies.forEach((allergy: any) => {
          note += `- ${allergy.allergen}: ${allergy.reaction || 'Unknown reaction'} (${allergy.severity || 'Unknown severity'})\n`
        })
        note += '\n'
      }
    }

    // Current Medications
    if (data.medications && data.medications.length > 0) {
      note += `CURRENT MEDICATIONS:\n`
      data.medications.forEach((med: any) => {
        note += `- ${med.name}: ${med.dose || 'Unknown dose'} ${med.frequency || ''}\n`
      })
      note += '\n'
    }

    // Assessment and Plan
    if (data.assessmentCandidates && data.assessmentCandidates.length > 0) {
      note += `ASSESSMENT:\n`
      data.assessmentCandidates.forEach((assessment: any) => {
        note += `- ${assessment}\n`
      })
      note += '\n'
    }

    if (data.planCandidates && data.planCandidates.length > 0) {
      note += `PLAN:\n`
      data.planCandidates.forEach((plan: any) => {
        note += `- ${plan}\n`
      })
      note += '\n'
    }

    // Needs Confirmation
    if (data.needsConfirmation && data.needsConfirmation.length > 0) {
      note += `NEEDS CONFIRMATION:\n`
      data.needsConfirmation.forEach((item: any) => {
        note += `- ${item}\n`
      })
      note += '\n'
    }

    return note
  }

  const handleCopy = async () => {
    try {
      setIsCopying(true)
      await navigator.clipboard.writeText(note)
      toast({
        title: 'Copied',
        description: 'Note copied to clipboard',
      })
    } catch (error) {
      console.error('Copy failed:', error)
      toast({
        title: 'Copy Failed',
        description: 'Failed to copy note to clipboard',
        variant: 'destructive'
      })
    } finally {
      setIsCopying(false)
    }
  }

  const downloadPDF = () => {
    try {
      const doc = new jsPDF()
      const lines = note.split('\n')
      let yPosition = 20
      const pageHeight = doc.internal.pageSize.height
      const margin = 20
      const lineHeight = 7

      lines.forEach((line) => {
        if (yPosition > pageHeight - 20) {
          doc.addPage()
          yPosition = 20
        }

        let text = line
        let fontSize = 12
        let fontStyle = 'normal'

        // Formatting
        if (line.startsWith('MEDICAL NOTE')) {
          fontSize = 16
          fontStyle = 'bold'
        } else if (line.startsWith('CHIEF COMPLAINT') || line.startsWith('HISTORY') ||
          line.startsWith('ALLERGY') || line.startsWith('CURRENT') ||
          line.startsWith('ASSESSMENT') || line.startsWith('PLAN') ||
          line.startsWith('NEEDS CONFIRMATION')) {
          fontSize = 14
          fontStyle = 'bold'
        }

        doc.setFontSize(fontSize)
        if (fontStyle === 'bold') {
          doc.setFont('helvetica', 'bold')
        } else {
          doc.setFont('helvetica', 'normal')
        }

        doc.text(text, margin, yPosition)
        yPosition += lineHeight
      })

      doc.save(`medical-note-${visitId}.pdf`)
      toast({
        title: 'Downloaded',
        description: 'Note downloaded as PDF',
      })
    } catch (error) {
      console.error('PDF download failed:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to generate PDF',
        variant: 'destructive'
      })
    }
  }

  const downloadDOCX = async () => {
    try {
      const doc = new Document({
        sections: [{
          properties: {},
          children: [
            new Paragraph({
              text: 'MEDICAL NOTE',
              heading: HeadingLevel.HEADING_1,
              alignment: AlignmentType.CENTER,
            }),
            new Paragraph(''),
            ...note.split('\n').map(line => {
              if (line.startsWith('CHIEF COMPLAINT') || line.startsWith('HISTORY') ||
                line.startsWith('ALLERGY') || line.startsWith('CURRENT') ||
                line.startsWith('ASSESSMENT') || line.startsWith('PLAN') ||
                line.startsWith('NEEDS CONFIRMATION')) {
                return new Paragraph({
                  text: line,
                  heading: HeadingLevel.HEADING_2,
                })
              } else if (line.startsWith('MEDICAL NOTE')) {
                return new Paragraph('')
              } else {
                return new Paragraph(line)
              }
            })
          ],
        }],
      })

      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = `medical-note-${visitId}.docx`
      link.click()
      URL.revokeObjectURL(url)

      toast({
        title: 'Downloaded',
        description: 'Note downloaded as DOCX',
      })
    } catch (error) {
      console.error('DOCX download failed:', error)
      toast({
        title: 'Download Failed',
        description: 'Failed to generate DOCX',
        variant: 'destructive'
      })
    }
  }

  const refreshNote = () => {
    if (extraction) {
      generateNote(extraction)
    }
  }

  if (isGenerating) {
    return (
      <Card>
        <CardContent className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Generating medical note...</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  if (!extraction) {
    return (
      <Card>
        <CardContent className="p-6 text-center">
          <p className="text-gray-600 mb-4">No extraction data available. Please complete the review step first.</p>
          <Button onClick={onBack} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Review
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Generated Medical Note</CardTitle>
              <CardDescription>
                Comprehensive medical note based on extracted information
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button onClick={refreshNote} variant="outline" size="sm">
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh
              </Button>
              <Button onClick={handleCopy} variant="outline" size="sm" disabled={isCopying}>
                <Copy className="mr-2 h-4 w-4" />
                {isCopying ? 'Copied!' : 'Copy'}
              </Button>
              <Button onClick={downloadPDF} variant="outline" size="sm">
                <Download className="mr-2 h-4 w-4" />
                PDF
              </Button>
              <Button onClick={downloadDOCX} variant="outline" size="sm">
                <FileText className="mr-2 h-4 w-4" />
                DOCX
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Textarea
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Medical note will appear here..."
            className="min-h-[400px] font-mono text-sm"
          />
        </CardContent>
      </Card>

      {/* Additional Information */}
      {extraction && (
        <Card>
          <CardHeader>
            <CardTitle>Extraction Summary</CardTitle>
            <CardDescription>Key information extracted from your sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Patient Information</h4>
                <p className="text-sm text-gray-600">Patient Alias: {extraction.patientAlias || 'Not specified'}</p>
                {extraction.visitContext && (
                  <>
                    <p className="text-sm text-gray-600">Date: {extraction.visitContext.date || 'Not specified'}</p>
                    <p className="text-sm text-gray-600">Setting: {extraction.visitContext.setting || 'Not specified'}</p>
                  </>
                )}
              </div>
              <div>
                <h4 className="font-semibold mb-2">Key Findings</h4>
                <div className="space-y-1">
                  {extraction.allergyHistory && (
                    <Badge variant="outline" className="mr-1">
                      {(extraction.allergyHistory.food?.length || 0) +
                        (extraction.allergyHistory.drug?.length || 0) +
                        (extraction.allergyHistory.environmental?.length || 0) +
                        (extraction.allergyHistory.stingingInsects?.length || 0) +
                        (extraction.allergyHistory.latexOther?.length || 0)} Allergies
                    </Badge>
                  )}
                  {extraction.medications && extraction.medications.length > 0 && (
                    <Badge variant="outline" className="mr-1">{extraction.medications.length} Medications</Badge>
                  )}
                  {extraction.assessmentCandidates && extraction.assessmentCandidates.length > 0 && (
                    <Badge variant="outline" className="mr-1">{extraction.assessmentCandidates.length} Assessments</Badge>
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Navigation */}
      <div className="flex justify-between">
        <Button onClick={onBack} variant="outline">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Review
        </Button>
        <div className="text-sm text-gray-500">
          Visit ID: {visitId}
        </div>
      </div>
    </div>
  )
}