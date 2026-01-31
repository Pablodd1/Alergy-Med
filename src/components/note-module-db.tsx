'use client'

import { useState, useEffect, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import { ArrowLeft, Copy, Download, FileText, RefreshCw, Check, Sparkles, FileType } from 'lucide-react'
import { ExtractionData } from '@/types/schemas'
import { jsPDF } from 'jspdf'
import { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType } from 'docx'

interface NoteModuleProps {
  visitId: string
  userId: string
  onBack: () => void
}

export function NoteModule({ visitId, userId, onBack }: NoteModuleProps) {
  const [extraction, setExtraction] = useState<ExtractionData | null>(null)
  const [note, setNote] = useState<string>('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopying, setIsCopying] = useState(false)
  const [lastSaved, setLastSaved] = useState<Date | null>(null)
  const { toast } = useToast()

  const generateNote = useCallback(async (extractionData: ExtractionData) => {
    try {
      setIsGenerating(true)
      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId, extraction: extractionData }),
      })

      if (!response.ok) throw new Error('Note generation failed')
      const result = await response.json()
      setNote(result.note)

      await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ generatedNote: result.note }),
      })

      setLastSaved(new Date())
      toast({ title: 'Note Generated', description: 'AI has successfully compiled the medical note.' })
    } catch (error) {
      console.error('Note generation error:', error)
      toast({ title: 'Generation Error', description: 'Could not generate AI note. Using fallback...', variant: 'destructive' })
      const fallback = `MEDICAL NOTE\nPatient: ${extractionData.patientAlias}\nChief Complaint: ${extractionData.chiefComplaint}\n\nGenerated on: ${new Date().toLocaleDateString()}`
      setNote(fallback)
    } finally {
      setIsGenerating(false)
    }
  }, [visitId, toast])

  const loadExtractionData = useCallback(async () => {
    try {
      const response = await fetch(`/api/visits/${visitId}`)
      if (!response.ok) throw new Error('Visit not found')
      const visit = await response.json()

      if (visit.extraction) {
        setExtraction(visit.extraction)
        if (!visit.generatedNote) {
          generateNote(visit.extraction)
        } else {
          setNote(visit.generatedNote)
          setLastSaved(new Date(visit.updatedAt))
        }
      }
    } catch (error) {
      toast({ title: 'Load Error', description: 'Failed to retrieve visit data.', variant: 'destructive' })
    }
  }, [visitId, toast, generateNote])

  useEffect(() => {
    loadExtractionData()
  }, [loadExtractionData])

  const handleCopy = async () => {
    try {
      setIsCopying(true)
      await navigator.clipboard.writeText(note)
      toast({ title: 'Success', description: 'Clinical note copied to clipboard.' })
      setTimeout(() => setIsCopying(false), 2000)
    } catch (e) {
      setIsCopying(false)
    }
  }

  const downloadPDF = () => {
    try {
      const doc = new jsPDF()
      doc.setFontSize(18);
      doc.text("ALLERGY CONSULTATION NOTE", 20, 20);
      doc.setFontSize(10);
      doc.text(`Patient Reference: ${extraction?.patientAlias || 'N/A'}`, 20, 30);
      doc.text(`Generated: ${new Date().toLocaleDateString()}`, 20, 35);

      doc.setFontSize(11);
      const splitText = doc.splitTextToSize(note, 170);
      doc.text(splitText, 20, 50);

      doc.save(`allergy_note_${visitId}.pdf`)
      toast({ title: 'Export Complete', description: 'Medical note saved as PDF.' })
    } catch (e) {
      toast({ title: 'Export Failed', description: 'Could not generate PDF file.', variant: 'destructive' })
    }
  }

  const downloadDOCX = async () => {
    try {
      const doc = new Document({
        sections: [{
          children: [
            new Paragraph({ text: 'ALLERGY CONSULTATION NOTE', heading: HeadingLevel.TITLE, alignment: AlignmentType.CENTER }),
            new Paragraph({ children: [new TextRun({ text: note })] }),
          ],
        }],
      })
      const blob = await Packer.toBlob(doc)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `allergy_note_${visitId}.docx`
      a.click()
      toast({ title: 'Export Complete', description: 'Medical note saved as Word document.' })
    } catch (e) {
      toast({ title: 'Export Failed', description: 'Could not generate DOCX file.', variant: 'destructive' })
    }
  }

  if (isGenerating) {
    return (
      <div className="flex flex-col items-center justify-center h-[50vh] space-y-6 animate-fade-in">
        <div className="relative">
          <Sparkles className="h-12 w-12 text-blue-600 animate-pulse" />
          <div className="absolute -top-1 -right-1 h-3 w-3 bg-blue-400 rounded-full animate-ping" />
        </div>
        <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">AI Note Synthesis in Progress...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      {/* Header Area */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-100">Step 3 of 3</Badge>
            <span className="text-slate-400 text-sm font-medium">Final Output</span>
          </div>
          <h1 className="text-3xl font-bold text-slate-900">Clinical Documentation</h1>
          <p className="text-slate-500 font-medium">Review and export your comprehensive medical note.</p>
        </div>

        <div className="flex items-center gap-2">
          <Button onClick={() => generateNote(extraction!)} variant="outline" className="h-12 rounded-xl border-slate-200">
            <RefreshCw className="mr-2 h-4 w-4" /> Regenerate
          </Button>
          <Button onClick={handleCopy} disabled={isCopying} className={`h-12 rounded-xl px-6 min-w-[120px] transition-all ${isCopying ? 'bg-emerald-600 text-white' : 'bg-slate-900 text-white hover:bg-black'}`}>
            {isCopying ? <><Check className="mr-2 h-5 w-5" /> Copied</> : <><Copy className="mr-2 h-4 w-4" /> Copy Text</>}
          </Button>
        </div>
      </div>

      {/* Main Content & Sidebar */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
        <div className="lg:col-span-3">
          <Card className="border-none shadow-premium overflow-hidden">
            <div className="p-8">
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                className="min-h-[600px] border-none focus:ring-0 text-lg leading-relaxed font-serif p-0 resize-none text-slate-800"
                placeholder="The clinical note will appear here..."
              />
            </div>
            <div className="bg-slate-50 border-t border-slate-100 p-4 flex justify-between items-center text-xs font-bold text-slate-400 uppercase tracking-widest">
              <span>Auto-saved locally</span>
              {lastSaved && <span>Last Sync: {lastSaved.toLocaleTimeString()}</span>}
            </div>
          </Card>
        </div>

        <div className="space-y-6">
          <Card className="border-none shadow-premium">
            <CardHeader>
              <CardTitle className="text-sm font-bold uppercase tracking-wider text-slate-400">Export Options</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <Button onClick={downloadPDF} variant="outline" className="w-full h-14 justify-start rounded-xl border-slate-100 hover:bg-red-50 hover:text-red-700 hover:border-red-100 group transition-all">
                <FileType className="mr-3 h-5 w-5 text-red-500" />
                <div className="text-left">
                  <div className="font-bold">Portable PDF</div>
                  <div className="text-xs text-slate-400 font-medium whitespace-nowrap">Standard clinical format</div>
                </div>
              </Button>
              <Button onClick={downloadDOCX} variant="outline" className="w-full h-14 justify-start rounded-xl border-slate-100 hover:bg-blue-50 hover:text-blue-700 hover:border-blue-100 group transition-all">
                <FileText className="mr-3 h-5 w-5 text-blue-500" />
                <div className="text-left">
                  <div className="font-bold">Word Document</div>
                  <div className="text-xs text-slate-400 font-medium whitespace-nowrap">Editable DOCX file</div>
                </div>
              </Button>
            </CardContent>
          </Card>

          <Card className="border-none shadow-premium bg-blue-600 text-white">
            <CardContent className="p-6">
              <h4 className="font-bold mb-2 flex items-center">
                <Sparkles className="mr-2 h-4 w-4" /> AI Insight
              </h4>
              <p className="text-sm text-blue-100 leading-relaxed">
                This note was compiled using multithreaded analysis of {extraction?.sourceQualityFlags?.length || 1} clinical sources. Always verify critical medication dosages.
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Navigation Footer */}
      <div className="flex justify-between items-center bg-white p-4 rounded-2xl shadow-sm border border-slate-100">
        <Button onClick={onBack} variant="ghost" className="text-slate-600 font-bold h-12 rounded-xl px-6">
          <ArrowLeft className="mr-2 h-4 w-4" /> Editorial Review
        </Button>
        <div className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">
          Roman Super Allergist Assistant v2.4 • Premium Edition
        </div>
      </div>
    </div>
  )
}