'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { useToast } from '@/components/ui/use-toast'
import {
  Mic, MicOff, Upload, FileText, ClipboardPaste, Sparkles,
  AlertTriangle, FileCode2, Stethoscope, Brain, ChevronRight,
  Download, Copy, Check, RefreshCw, Plus, Trash2, Play, Square,
  Shield, Activity, Pill, TestTube, Heart, AlertCircle, Users
} from 'lucide-react'
import { samplePatients } from '@/lib/sample-patients'


type WorkflowStep = 'input' | 'analyzing' | 'review' | 'note'

interface Source {
  id: string
  type: 'audio' | 'document' | 'text' | 'paste'
  content: string
  metadata: {
    filename?: string
    timestamp?: string
    duration?: number
  }
}

export default function AllergyScribe() {
  const { toast } = useToast()

  // Workflow state
  const [currentStep, setCurrentStep] = useState<WorkflowStep>('input')
  const [visitId, setVisitId] = useState<string | null>(null)
  const [sources, setSources] = useState<Source[]>([])
  const [extraction, setExtraction] = useState<any>(null)
  const [generatedNote, setGeneratedNote] = useState<string>('')

  // Input state
  const [textInput, setTextInput] = useState('')
  const [patientAlias, setPatientAlias] = useState('')

  // Recording state
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const timerRef = useRef<NodeJS.Timeout | null>(null)

  // Loading states
  const [isTranscribing, setIsTranscribing] = useState(false)
  const [isAnalyzing, setIsAnalyzing] = useState(false)
  const [isGenerating, setIsGenerating] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  // ============================================================================
  // AUDIO RECORDING
  // ============================================================================

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        stream.getTracks().forEach(track => track.stop())
        await transcribeAudio(audioBlob)
      }

      mediaRecorder.start(1000)
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => setRecordingTime(t => t + 1), 1000)
    } catch (error) {
      toast({ title: 'Microphone Error', description: 'Could not access microphone', variant: 'destructive' })
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (timerRef.current) clearInterval(timerRef.current)
    }
  }

  const transcribeAudio = async (audioBlob: Blob) => {
    setIsTranscribing(true)
    try {
      // Create visit if needed
      let currentVisitId = visitId
      if (!currentVisitId) {
        currentVisitId = await createVisit()
      }

      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.webm')
      formData.append('visitId', currentVisitId)

      const response = await fetch('/api/transcribe', { method: 'POST', body: formData })
      if (!response.ok) throw new Error('Transcription failed')

      const result = await response.json()

      const newSource: Source = {
        id: `audio-${Date.now()}`,
        type: 'audio',
        content: result.text,
        metadata: { timestamp: new Date().toISOString(), duration: recordingTime }
      }
      setSources(prev => [...prev, newSource])
      toast({ title: 'Transcription Complete', description: `${result.text.split(' ').length} words captured` })
    } catch (error) {
      toast({ title: 'Transcription Failed', description: 'Could not process audio', variant: 'destructive' })
    } finally {
      setIsTranscribing(false)
    }
  }

  // ============================================================================
  // FILE UPLOAD
  // ============================================================================

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (!files?.length) return

    let currentVisitId = visitId
    if (!currentVisitId) {
      currentVisitId = await createVisit()
    }

    for (const file of Array.from(files)) {
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('visitId', currentVisitId)

        const response = await fetch('/api/upload', { method: 'POST', body: formData })
        if (!response.ok) throw new Error('Upload failed')

        const result = await response.json()

        const newSource: Source = {
          id: `doc-${Date.now()}`,
          type: 'document',
          content: result.text,
          metadata: { filename: file.name, timestamp: new Date().toISOString() }
        }
        setSources(prev => [...prev, newSource])
        toast({ title: 'Document Processed', description: file.name })
      } catch (error) {
        toast({ title: 'Upload Failed', description: `Could not process ${file.name}`, variant: 'destructive' })
      }
    }
    e.target.value = ''
  }

  // ============================================================================
  // TEXT INPUT
  // ============================================================================

  const addTextSource = async () => {
    if (!textInput.trim()) return

    let currentVisitId = visitId
    if (!currentVisitId) {
      currentVisitId = await createVisit()
    }

    const newSource: Source = {
      id: `text-${Date.now()}`,
      type: 'text',
      content: textInput.trim(),
      metadata: { timestamp: new Date().toISOString() }
    }
    setSources(prev => [...prev, newSource])
    setTextInput('')
    toast({ title: 'Text Added', description: `${textInput.split(' ').length} words added` })
  }

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText()
      if (text.trim()) {
        let currentVisitId = visitId
        if (!currentVisitId) {
          currentVisitId = await createVisit()
        }

        const newSource: Source = {
          id: `paste-${Date.now()}`,
          type: 'paste',
          content: text.trim(),
          metadata: { timestamp: new Date().toISOString() }
        }
        setSources(prev => [...prev, newSource])
        toast({ title: 'Content Pasted', description: `${text.split(' ').length} words pasted from clipboard` })
      }
    } catch (error) {
      toast({ title: 'Paste Failed', description: 'Could not access clipboard', variant: 'destructive' })
    }
  }

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  // ============================================================================
  // VISIT MANAGEMENT
  // ============================================================================

  const createVisit = async (): Promise<string> => {
    const response = await fetch('/api/visits', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientAlias: patientAlias || 'Patient',
        chiefComplaint: 'Pending analysis',
        sources: []
      })
    })
    const data = await response.json()
    setVisitId(data.visitId)
    return data.visitId
  }

  // ============================================================================
  // ANALYSIS
  // ============================================================================

  const analyzeDocuments = async () => {
    if (sources.length === 0) {
      toast({ title: 'No Sources', description: 'Add at least one source before analyzing', variant: 'destructive' })
      return
    }

    setIsAnalyzing(true)
    setCurrentStep('analyzing')

    try {
      let currentVisitId = visitId
      if (!currentVisitId) {
        currentVisitId = await createVisit()
      }

      const response = await fetch('/api/extract-facts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId: currentVisitId, sources })
      })

      if (!response.ok) throw new Error('Analysis failed')

      const result = await response.json()
      setExtraction(result)
      setCurrentStep('review')
      toast({ title: 'Analysis Complete', description: 'Clinical data extracted successfully' })
    } catch (error) {
      toast({ title: 'Analysis Failed', description: 'Could not analyze documents', variant: 'destructive' })
      setCurrentStep('input')
    } finally {
      setIsAnalyzing(false)
    }
  }

  // ============================================================================
  // NOTE GENERATION
  // ============================================================================

  const generateNote = async () => {
    if (!extraction) return

    setIsGenerating(true)
    try {
      const response = await fetch('/api/generate-note', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ visitId, extraction })
      })

      if (!response.ok) throw new Error('Generation failed')

      const result = await response.json()
      setGeneratedNote(result.note)
      setCurrentStep('note')
      toast({ title: 'Note Generated', description: 'SOAP note ready for review' })
    } catch (error) {
      toast({ title: 'Generation Failed', description: 'Could not generate note', variant: 'destructive' })
    } finally {
      setIsGenerating(false)
    }
  }

  const copyNote = async () => {
    await navigator.clipboard.writeText(generatedNote)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
    toast({ title: 'Copied', description: 'Note copied to clipboard' })
  }

  const downloadNote = () => {
    const blob = new Blob([generatedNote], { type: 'text/plain' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `soap_note_${visitId || 'draft'}.txt`
    a.click()
    URL.revokeObjectURL(url)
  }

  const startNewVisit = () => {
    setCurrentStep('input')
    setVisitId(null)
    setSources([])
    setExtraction(null)
    setGeneratedNote('')
    setPatientAlias('')
    setTextInput('')
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-slate-50">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200 shadow-sm">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="bg-gradient-to-br from-blue-600 to-indigo-700 p-2.5 rounded-xl shadow-lg">
                <Stethoscope className="h-6 w-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-black text-slate-900 tracking-tight">ALLERGY<span className="text-blue-600">SCRIBE</span></h1>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">AI Clinical Documentation</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {visitId && (
                <Badge variant="outline" className="bg-emerald-50 text-emerald-700 border-emerald-200 font-mono text-xs">
                  {visitId.slice(0, 8)}...
                </Badge>
              )}
              <Button onClick={startNewVisit} variant="outline" size="sm" className="rounded-xl">
                <Plus className="h-4 w-4 mr-1" /> New Visit
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-center gap-2">
            {[
              { step: 'input', label: 'Input', icon: FileText },
              { step: 'analyzing', label: 'Analyzing', icon: Brain },
              { step: 'review', label: 'Review', icon: Activity },
              { step: 'note', label: 'SOAP Note', icon: FileCode2 }
            ].map((item, idx) => {
              const Icon = item.icon
              const isActive = currentStep === item.step
              const isPast = ['input', 'analyzing', 'review', 'note'].indexOf(currentStep) > idx

              return (
                <div key={item.step} className="flex items-center">
                  <div className={`
                    flex items-center gap-2 px-4 py-2 rounded-xl transition-all
                    ${isActive ? 'bg-blue-600 text-white shadow-lg shadow-blue-200' :
                      isPast ? 'bg-emerald-100 text-emerald-700' : 'bg-slate-100 text-slate-400'}
                  `}>
                    <Icon className="h-4 w-4" />
                    <span className="text-sm font-bold hidden sm:inline">{item.label}</span>
                  </div>
                  {idx < 3 && <ChevronRight className="h-4 w-4 mx-1 text-slate-300" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 1: Input */}
        {currentStep === 'input' && (
          <div className="space-y-6 animate-fade-in">
            {/* Patient Alias */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5 text-blue-600" />
                  Patient Reference
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Input
                  value={patientAlias}
                  onChange={(e) => setPatientAlias(e.target.value)}
                  placeholder="Enter patient alias (e.g., 'JD', 'Patient A')"
                  className="text-lg h-12 rounded-xl border-slate-200"
                />
              </CardContent>
            </Card>

            {/* Sample Patients Demo Section */}
            <Card className="border-none shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-l-indigo-500">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg flex items-center gap-2">
                  <Users className="h-5 w-5 text-indigo-600" />
                  Demo Patients
                  <Badge className="bg-indigo-100 text-indigo-700 ml-2">Try Now</Badge>
                </CardTitle>
                <CardDescription>
                  Load sample patient data to see the full clinical extraction capabilities
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  {samplePatients.map((patient, idx) => (
                    <Button
                      key={patient.id}
                      variant="outline"
                      className="h-auto p-4 flex flex-col items-start text-left rounded-xl border-2 border-indigo-200 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                      onClick={() => {
                        setPatientAlias(patient.patientAlias)
                        setExtraction(patient.extraction)
                        setVisitId(`demo-${Date.now()}`)
                        setCurrentStep('review')
                        toast({
                          title: 'Demo Patient Loaded',
                          description: `${patient.patientAlias} - Ready for review`
                        })
                      }}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${idx === 0 ? 'bg-blue-500' : idx === 1 ? 'bg-amber-500' : 'bg-pink-500'
                          }`}>
                          {idx + 1}
                        </div>
                        <span className="font-bold text-slate-800">{patient.patientAlias}</span>
                      </div>
                      <p className="text-xs text-slate-500 line-clamp-2">{patient.chiefComplaint}</p>
                      <div className="flex flex-wrap gap-1 mt-2">
                        {idx === 0 && (
                          <>
                            <Badge className="bg-blue-100 text-blue-700 text-[10px]">Shellfish Allergy</Badge>
                            <Badge className="bg-emerald-100 text-emerald-700 text-[10px]">Rhinitis</Badge>
                          </>
                        )}
                        {idx === 1 && (
                          <>
                            <Badge className="bg-amber-100 text-amber-700 text-[10px]">Chronic Hives</Badge>
                            <Badge className="bg-red-100 text-red-700 text-[10px]">NSAID Allergy</Badge>
                          </>
                        )}
                        {idx === 2 && (
                          <>
                            <Badge className="bg-pink-100 text-pink-700 text-[10px]">Pediatric</Badge>
                            <Badge className="bg-purple-100 text-purple-700 text-[10px]">Atopic March</Badge>
                          </>
                        )}
                      </div>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Voice Recording */}
              <Card className="border-none shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-slate-500">
                    <Mic className="h-4 w-4" /> Voice Recording
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {isRecording ? (
                    <div className="text-center space-y-3">
                      <div className="relative mx-auto w-20 h-20">
                        <div className="absolute inset-0 bg-red-500 rounded-full animate-ping opacity-25" />
                        <button
                          onClick={stopRecording}
                          className="relative w-20 h-20 bg-red-600 hover:bg-red-700 rounded-full flex items-center justify-center transition-all shadow-xl"
                        >
                          <Square className="h-8 w-8 text-white" />
                        </button>
                      </div>
                      <p className="text-2xl font-mono font-bold text-red-600">{formatTime(recordingTime)}</p>
                      <p className="text-xs text-slate-500">Click to stop</p>
                    </div>
                  ) : isTranscribing ? (
                    <div className="text-center py-4">
                      <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-2" />
                      <p className="text-sm text-slate-500">Transcribing...</p>
                    </div>
                  ) : (
                    <Button
                      onClick={startRecording}
                      className="w-full h-20 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg"
                    >
                      <Mic className="h-6 w-6 mr-2" /> Start Recording
                    </Button>
                  )}
                </CardContent>
              </Card>

              {/* File Upload */}
              <Card className="border-none shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-slate-500">
                    <Upload className="h-4 w-4" /> Document Upload
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <label className="cursor-pointer">
                    <input
                      type="file"
                      multiple
                      accept=".pdf,.doc,.docx,.txt,.rtf"
                      onChange={handleFileUpload}
                      className="hidden"
                    />
                    <div className="w-full h-20 rounded-xl border-2 border-dashed border-slate-300 hover:border-blue-400 flex items-center justify-center gap-2 transition-all hover:bg-blue-50">
                      <Upload className="h-6 w-6 text-slate-400" />
                      <span className="text-slate-600 font-medium">Drop files or click</span>
                    </div>
                  </label>
                  <p className="text-xs text-slate-400 mt-2 text-center">PDF, Word, TXT, RTF</p>
                </CardContent>
              </Card>

              {/* Paste */}
              <Card className="border-none shadow-xl bg-white/80 backdrop-blur hover:shadow-2xl transition-all">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-slate-500">
                    <ClipboardPaste className="h-4 w-4" /> Quick Paste
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Button
                    onClick={handlePaste}
                    variant="outline"
                    className="w-full h-20 rounded-xl border-2 border-dashed hover:bg-amber-50 hover:border-amber-300"
                  >
                    <ClipboardPaste className="h-6 w-6 mr-2" /> Paste from Clipboard
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* Text Input */}
            <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm flex items-center gap-2 text-slate-500">
                  <FileText className="h-4 w-4" /> Type or Paste Medical Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Enter clinical notes, lab results, patient history, transcriptions, or any medical documentation..."
                  className="min-h-[200px] text-base rounded-xl border-slate-200 resize-none"
                />
                <Button
                  onClick={addTextSource}
                  disabled={!textInput.trim()}
                  className="rounded-xl"
                >
                  <Plus className="h-4 w-4 mr-1" /> Add to Sources
                </Button>
              </CardContent>
            </Card>

            {/* Sources List */}
            {sources.length > 0 && (
              <Card className="border-none shadow-xl bg-white/80 backdrop-blur">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center justify-between">
                    <span className="flex items-center gap-2 text-slate-500">
                      <Activity className="h-4 w-4" /> Collected Sources ({sources.length})
                    </span>
                    <Badge className="bg-emerald-100 text-emerald-700">
                      {sources.reduce((acc, s) => acc + s.content.split(' ').length, 0)} words
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 max-h-[300px] overflow-y-auto">
                    {sources.map((source) => (
                      <div key={source.id} className="flex items-start gap-3 p-3 bg-slate-50 rounded-xl group">
                        <div className={`
                          p-2 rounded-lg
                          ${source.type === 'audio' ? 'bg-purple-100 text-purple-600' :
                            source.type === 'document' ? 'bg-blue-100 text-blue-600' :
                              source.type === 'paste' ? 'bg-amber-100 text-amber-600' :
                                'bg-slate-100 text-slate-600'}
                        `}>
                          {source.type === 'audio' ? <Mic className="h-4 w-4" /> :
                            source.type === 'document' ? <FileText className="h-4 w-4" /> :
                              <ClipboardPaste className="h-4 w-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-slate-700">
                            {source.metadata.filename || source.type.charAt(0).toUpperCase() + source.type.slice(1)}
                          </p>
                          <p className="text-xs text-slate-400 truncate">{source.content.slice(0, 100)}...</p>
                        </div>
                        <Button
                          onClick={() => removeSource(source.id)}
                          variant="ghost"
                          size="sm"
                          className="opacity-0 group-hover:opacity-100 transition-opacity text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Analyze Button */}
            <div className="flex justify-center pt-4">
              <Button
                onClick={analyzeDocuments}
                disabled={sources.length === 0}
                size="lg"
                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-bold shadow-xl shadow-blue-200 disabled:opacity-50"
              >
                <Brain className="h-5 w-5 mr-2" />
                Analyze & Extract Clinical Data
                <ChevronRight className="h-5 w-5 ml-2" />
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Analyzing */}
        {currentStep === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <div className="relative mb-8">
              <div className="w-24 h-24 rounded-full bg-gradient-to-r from-blue-600 to-indigo-600 animate-pulse flex items-center justify-center">
                <Brain className="h-12 w-12 text-white" />
              </div>
              <div className="absolute -top-2 -right-2 w-6 h-6 bg-emerald-500 rounded-full animate-ping" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 mb-2">AI Analysis in Progress</h2>
            <p className="text-slate-500 mb-4">Extracting clinical entities, codes, and decision support...</p>
            <div className="flex gap-2">
              {['SOAP', 'ICD-10', 'CPT', 'Red Flags'].map((item) => (
                <Badge key={item} variant="outline" className="animate-pulse">{item}</Badge>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Review */}
        {currentStep === 'review' && extraction && (
          <div className="space-y-6 animate-fade-in">
            {/* Red Flags Alert */}
            {extraction.redFlags?.length > 0 && (
              <Card className="border-none shadow-xl bg-red-50 border-l-4 border-l-red-500">
                <CardContent className="py-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="h-6 w-6 text-red-600 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-red-800 mb-2">Clinical Red Flags Detected</h3>
                      <ul className="space-y-1">
                        {extraction.redFlags.map((flag: any, idx: number) => (
                          <li key={idx} className="text-sm text-red-700 flex items-start gap-2">
                            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
                            <div>
                              <span className="font-medium">{flag.flag}</span>
                              {flag.recommendation && <span className="text-red-600"> — {flag.recommendation}</span>}
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Extraction Summary Cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Card className="border-none shadow-lg bg-white/80">
                <CardContent className="py-4 text-center">
                  <Heart className="h-8 w-8 mx-auto text-red-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-800">
                    {(extraction.allergyHistory?.food?.length || 0) +
                      (extraction.allergyHistory?.drug?.length || 0) +
                      (extraction.allergyHistory?.environmental?.length || 0)}
                  </p>
                  <p className="text-xs text-slate-500 font-medium">Allergies</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white/80">
                <CardContent className="py-4 text-center">
                  <Pill className="h-8 w-8 mx-auto text-blue-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{extraction.medications?.length || 0}</p>
                  <p className="text-xs text-slate-500 font-medium">Medications</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white/80">
                <CardContent className="py-4 text-center">
                  <FileCode2 className="h-8 w-8 mx-auto text-emerald-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{extraction.icd10Codes?.length || 0}</p>
                  <p className="text-xs text-slate-500 font-medium">ICD-10 Codes</p>
                </CardContent>
              </Card>

              <Card className="border-none shadow-lg bg-white/80">
                <CardContent className="py-4 text-center">
                  <TestTube className="h-8 w-8 mx-auto text-purple-500 mb-2" />
                  <p className="text-2xl font-bold text-slate-800">{extraction.cptCodes?.length || 0}</p>
                  <p className="text-xs text-slate-500 font-medium">CPT Codes</p>
                </CardContent>
              </Card>
            </div>

            {/* Main Extraction Display */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Clinical Data */}
              <Card className="border-none shadow-xl bg-white/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Stethoscope className="h-5 w-5 text-blue-600" />
                    Clinical Summary
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extraction.chiefComplaint && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-1">Chief Complaint</h4>
                      <p className="text-slate-700">{extraction.chiefComplaint}</p>
                    </div>
                  )}

                  {extraction.assessmentCandidates?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Assessment</h4>
                      <ul className="space-y-1">
                        {extraction.assessmentCandidates.map((a: any, idx: number) => (
                          <li key={idx} className="text-sm text-slate-700 flex items-start gap-2">
                            <Badge variant="outline" className="text-xs">{a.confidence}</Badge>
                            <span>{a.problem}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Billing Codes */}
              <Card className="border-none shadow-xl bg-white/80">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileCode2 className="h-5 w-5 text-emerald-600" />
                    Billing Codes
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {extraction.icd10Codes?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">ICD-10 Diagnosis Codes</h4>
                      <div className="flex flex-wrap gap-2">
                        {extraction.icd10Codes.map((code: any, idx: number) => (
                          <Badge key={idx} className={code.isPrimary ? 'bg-blue-600' : 'bg-slate-600'}>
                            {code.code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}

                  {extraction.cptCodes?.length > 0 && (
                    <div>
                      <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">CPT Procedure Codes</h4>
                      <div className="flex flex-wrap gap-2">
                        {extraction.cptCodes.map((code: any, idx: number) => (
                          <Badge key={idx} variant="outline" className="bg-emerald-50 text-emerald-700">
                            {code.code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Missing Information */}
            {extraction.missingInformation?.length > 0 && (
              <Card className="border-none shadow-xl bg-amber-50 border-l-4 border-l-amber-500">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm flex items-center gap-2 text-amber-800">
                    <AlertTriangle className="h-4 w-4" />
                    Missing Information for Complete Documentation
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ul className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {extraction.missingInformation.map((item: any, idx: number) => (
                      <li key={idx} className="text-sm text-amber-800 flex items-start gap-2">
                        <Badge variant="outline" className={`text-xs ${item.priority === 'required' ? 'bg-red-100 text-red-700' :
                          item.priority === 'recommended' ? 'bg-amber-100 text-amber-700' :
                            'bg-slate-100 text-slate-600'
                          }`}>{item.priority}</Badge>
                        <span>{item.description}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {/* Generate Note Button */}
            <div className="flex justify-center gap-4 pt-4">
              <Button
                onClick={() => setCurrentStep('input')}
                variant="outline"
                size="lg"
                className="h-14 px-6 rounded-2xl"
              >
                Back to Input
              </Button>
              <Button
                onClick={generateNote}
                disabled={isGenerating}
                size="lg"
                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-bold shadow-xl shadow-emerald-200"
              >
                {isGenerating ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Generating SOAP Note...
                  </>
                ) : (
                  <>
                    <Sparkles className="h-5 w-5 mr-2" />
                    Generate SOAP Note
                    <ChevronRight className="h-5 w-5 ml-2" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}

        {/* Step 4: Generated Note */}
        {currentStep === 'note' && (
          <div className="space-y-6 animate-fade-in">
            <Card className="border-none shadow-xl bg-white/80">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileCode2 className="h-5 w-5 text-blue-600" />
                    Generated SOAP Note
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button onClick={copyNote} variant="outline" size="sm" className="rounded-xl">
                      {isCopied ? <Check className="h-4 w-4 mr-1" /> : <Copy className="h-4 w-4 mr-1" />}
                      {isCopied ? 'Copied!' : 'Copy'}
                    </Button>
                    <Button onClick={downloadNote} variant="outline" size="sm" className="rounded-xl">
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                    <Button onClick={generateNote} variant="outline" size="sm" className="rounded-xl">
                      <RefreshCw className="h-4 w-4 mr-1" /> Regenerate
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={generatedNote}
                  onChange={(e) => setGeneratedNote(e.target.value)}
                  className="min-h-[600px] font-mono text-sm rounded-xl border-slate-200"
                />
              </CardContent>
            </Card>

            <div className="flex justify-center gap-4">
              <Button
                onClick={() => setCurrentStep('review')}
                variant="outline"
                size="lg"
                className="h-14 px-6 rounded-2xl"
              >
                Back to Review
              </Button>
              <Button
                onClick={startNewVisit}
                size="lg"
                className="h-14 px-8 rounded-2xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold"
              >
                <Plus className="h-5 w-5 mr-2" />
                Start New Visit
              </Button>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white/50 mt-12">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-slate-400 font-medium">
            ALLERGY SCRIBE v2.0 — AI-Assisted Clinical Documentation for Allergists & Internal Medicine
          </p>
          <p className="text-[10px] text-slate-300 mt-1">
            All AI-generated content requires physician review and attestation before EHR entry
          </p>
        </div>
      </footer>
    </div>
  )
}