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
  Shield, Activity, Pill, TestTube, Heart, AlertCircle, Users,
  BookOpen, Star, Zap
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

  // Permission & Legal state
  const [hasMicConsent, setHasMicConsent] = useState(false)
  const [showConsentModal, setShowConsentModal] = useState(false)

  // ============================================================================
  // AUDIO RECORDING
  // ============================================================================

  const requestMicPermission = async () => {
    setShowConsentModal(true)
  }

  const handleAcceptConsent = async () => {
    setHasMicConsent(true)
    setShowConsentModal(false)
    toast({
      title: 'Permissions Granted',
      description: 'Microphone access authorized for this session. HIPAA compliance active.',
    })
    startRecording()
  }

  const startRecording = async () => {
    if (!hasMicConsent) {
      setShowConsentModal(true)
      return
    }

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

  // Safety: Stop recording if tab is backgrounded or system sleeps
  useEffect(() => {
    const handleInactivity = () => {
      if (isRecording) {
        stopRecording()
        toast({
          title: 'Session Protected',
          description: 'Microphone deactivated: Application lost focus or was backgrounded.',
        })
      }
    }
    document.addEventListener('visibilitychange', handleInactivity)
    window.addEventListener('blur', handleInactivity)
    return () => {
      document.removeEventListener('visibilitychange', handleInactivity)
      window.removeEventListener('blur', handleInactivity)
    }
  }, [isRecording, stopRecording, toast])

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
    <div className="min-h-screen bg-[#f8fafc] text-slate-900 font-sans selection:bg-indigo-100 selection:text-indigo-900">
      {/* Premium Header */}
      <header className="sticky top-0 z-50 bg-white/90 backdrop-blur-md border-b border-slate-200 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            <div className="flex items-center gap-4">
              <div className="bg-gradient-to-tr from-slate-900 via-slate-800 to-indigo-900 p-3 rounded-2xl shadow-indigo-100 shadow-lg ring-1 ring-slate-800/10">
                <Brain className="h-7 w-7 text-white" />
              </div>
              <div className="flex flex-col">
                <h1 className="text-xl font-black tracking-tight text-slate-900 flex items-center gap-2 uppercase">
                  ROMAN <span className="text-indigo-600">SUPER</span> ALLERGIST
                </h1>
                <p className="text-[11px] font-bold text-slate-400 tracking-widest uppercase">Advanced Clinical AI Assistant</p>
              </div>
            </div>

            <div className="hidden lg:flex items-center bg-slate-50 border border-slate-200 rounded-full px-2 py-1 gap-1">
              {[
                { step: 'input', label: 'Ingestion', icon: Activity },
                { step: 'analyzing', label: 'Processing', icon: RefreshCw },
                { step: 'review', label: 'Verification', icon: Shield },
                { step: 'note', label: 'SOAP Note', icon: FileCode2 }
              ].map((item, idx) => {
                const Icon = item.icon
                const isActive = currentStep === item.step
                const isPast = ['input', 'analyzing', 'review', 'note'].indexOf(currentStep) > idx

                return (
                  <div key={item.step} className="flex items-center">
                    <div className={`
                      flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300
                      ${isActive ? 'bg-white text-indigo-600 shadow-sm border border-slate-200' :
                        isPast ? 'text-emerald-600' : 'text-slate-400'}
                    `}>
                      <Icon className={`h-4 w-4 ${isActive ? 'animate-pulse' : ''}`} />
                      <span className="text-xs font-bold whitespace-nowrap">{item.label}</span>
                    </div>
                    {idx < 3 && <div className="w-4 h-[1px] bg-slate-200 mx-1" />}
                  </div>
                )
              })}
            </div>

            <div className="flex items-center gap-3">
              <div className="hidden sm:flex items-center gap-3 mr-4">
                <Badge variant="outline" className="bg-indigo-50 border-indigo-100 text-indigo-700 px-3 py-1 font-bold text-[10px] tracking-tight uppercase">
                  KB Loaded v2.4
                </Badge>
                <Badge variant="outline" className="bg-emerald-50 border-emerald-100 text-emerald-700 px-3 py-1 font-bold text-[10px] tracking-tight uppercase flex items-center gap-1">
                  <Shield className="h-3 w-3" /> Secure Session
                </Badge>
              </div>
              <Button onClick={startNewVisit} variant="ghost" size="sm" className="hidden sm:flex rounded-full text-slate-500 hover:text-indigo-600 font-bold text-xs uppercase tracking-wider">
                <Plus className="h-4 w-4 mr-1" /> New Visit
              </Button>
              <div className="h-10 w-10 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-500 font-bold text-xs ring-2 ring-white">
                R
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-5xl mx-auto px-4 py-12 pb-24">
        {/* Progress Tracker Mobile */}
        <div className="lg:hidden flex items-center justify-center mb-10 bg-white p-4 rounded-3xl border border-slate-200 shadow-sm overflow-x-auto no-scrollbar">
          <div className="flex items-center gap-1">
            {[
              { step: 'input', icon: Activity },
              { step: 'analyzing', icon: RefreshCw },
              { step: 'review', icon: Shield },
              { step: 'note', icon: FileCode2 }
            ].map((item, idx) => {
              const Icon = item.icon
              const isActive = currentStep === item.step
              const isPast = ['input', 'analyzing', 'review', 'note'].indexOf(currentStep) > idx
              return (
                <div key={idx} className="flex items-center">
                  <div className={`p-3 rounded-full ${isActive ? 'bg-indigo-600 text-white' : isPast ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                    <Icon className="h-5 w-5" />
                  </div>
                  {idx < 3 && <ChevronRight className="h-4 w-4 text-slate-300 mx-1" />}
                </div>
              )
            })}
          </div>
        </div>

        {/* Step 1: Input */}
        {currentStep === 'input' && (
          <div className="space-y-10 animate-fade-in">
            {/* Context Hero */}
            <div className="bg-indigo-600 rounded-[2.5rem] p-10 text-white shadow-2xl shadow-indigo-200 relative overflow-hidden">
              <div className="absolute top-0 right-0 p-10 opacity-10">
                <Zap className="w-64 h-64" />
              </div>
              <div className="relative z-10">
                <Badge className="bg-indigo-500 text-white border-indigo-400 mb-6 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                  System Online
                </Badge>
                <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
                  Welcome, Dr. Roman. <br />
                  <span className="text-indigo-200">How can I assist you today?</span>
                </h2>
                <p className="text-indigo-100/80 max-w-xl text-lg font-medium">
                  Capture patient data via voice, document upload, or direct text. I will handle the clinical extraction, coding, and SOAP documentation.
                </p>
              </div>
            </div>

            {/* Patient Reference */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <Card className="border-none shadow-xl bg-white rounded-[2rem] overflow-hidden">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl flex items-center gap-3 font-black uppercase tracking-tight">
                    <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                      <Users className="h-5 w-5" />
                    </div>
                    Patient Reference
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-2">
                  <Input
                    value={patientAlias}
                    onChange={(e) => setPatientAlias(e.target.value)}
                    placeholder="Enter alias (e.g. JD-402)"
                    className="text-xl h-16 rounded-2xl border-slate-200 focus:ring-indigo-500 font-bold"
                  />
                  <p className="text-xs text-slate-400 mt-4 px-1 italic">
                    All data is processed using anonymous identifiers for HIPAA compliance.
                  </p>
                </CardContent>
              </Card>

              {/* Demo Patients */}
              <Card className="border-none shadow-xl bg-slate-900 rounded-[2rem] text-white">
                <CardHeader className="p-8 pb-4">
                  <CardTitle className="text-xl flex items-center gap-3 font-black uppercase tracking-tight">
                    <div className="p-2 rounded-lg bg-slate-800 text-indigo-400">
                      <Star className="h-5 w-5" />
                    </div>
                    Clinical Demos
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-8 pt-2">
                  <div className="flex flex-col gap-3">
                    {samplePatients.map((patient, idx) => (
                      <button
                        key={patient.id}
                        onClick={() => {
                          setPatientAlias(patient.patientAlias)
                          setExtraction(patient.extraction)
                          setVisitId(`demo-${Date.now()}`)
                          setCurrentStep('review')
                          toast({ title: 'Demo Patient Loaded', description: `${patient.patientAlias} - Ready for review` })
                        }}
                        className="flex items-center justify-between p-4 rounded-2xl bg-slate-800 hover:bg-indigo-600 transition-all text-left"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs">
                            {idx + 1}
                          </div>
                          <span className="font-bold text-sm">{patient.patientAlias}</span>
                        </div>
                        <ChevronRight className="w-4 h-4 opacity-40" />
                      </button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Input Methods */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Voice */}
              <button
                onClick={isRecording ? stopRecording : (hasMicConsent ? startRecording : requestMicPermission)}
                className={`
                  relative flex flex-col items-center justify-center p-10 rounded-[2.5rem] border-2 transition-all duration-500
                  ${isRecording ? 'bg-red-50 border-red-200 scale-[0.98]' : 'bg-white border-slate-100 hover:border-indigo-200 hover:shadow-2xl shadow-xl shadow-slate-200/50'}
                `}
              >
                {isRecording ? (
                  <>
                    <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center shadow-red-200 shadow-2xl mb-6 relative">
                      <div className="absolute inset-0 bg-red-600 rounded-full animate-ping opacity-25" />
                      <Square className="h-8 w-8 text-white" />
                    </div>
                    <span className="text-3xl font-black text-red-600 font-mono mb-2">{formatTime(recordingTime)}</span>
                    <span className="text-xs font-black text-red-400 uppercase tracking-widest">Recording Dr. Roman</span>
                  </>
                ) : (
                  <>
                    <div className="w-20 h-20 bg-indigo-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Mic className="h-8 w-8 text-indigo-600" />
                    </div>
                    <span className="text-xl font-black text-slate-800 mb-1">Voice Capture</span>
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Live Transcription</span>
                  </>
                )}
              </button>

              {/* Upload */}
              <label className="cursor-pointer group">
                <input type="file" multiple accept=".pdf,.doc,.docx,.txt,.rtf" onChange={handleFileUpload} className="hidden" />
                <div className="h-full flex flex-col items-center justify-center p-10 rounded-[2.5rem] bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-2xl shadow-xl shadow-slate-200/50 transition-all duration-500">
                  <div className="w-20 h-20 bg-blue-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                    <Upload className="h-8 w-8 text-blue-600" />
                  </div>
                  <span className="text-xl font-black text-slate-800 mb-1">Clinical Files</span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">PDF, DOCX, RTF</span>
                </div>
              </label>

              {/* Paste */}
              <button
                onClick={handlePaste}
                className="flex flex-col items-center justify-center p-10 rounded-[2.5rem] bg-white border-2 border-slate-100 hover:border-indigo-200 hover:shadow-2xl shadow-xl shadow-slate-200/50 transition-all duration-500 group"
              >
                <div className="w-20 h-20 bg-amber-50 rounded-full flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                  <ClipboardPaste className="h-8 w-8 text-amber-600" />
                </div>
                <span className="text-xl font-black text-slate-800 mb-1">Quick Paste</span>
                <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">From Billboard</span>
              </button>
            </div>

            {/* Large Text Ingestion */}
            <Card className="border-none shadow-xl bg-white rounded-[2.5rem] overflow-hidden">
              <CardHeader className="p-10 pb-4">
                <CardTitle className="text-xl flex items-center gap-3 font-black uppercase tracking-tight">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-600">
                    <BookOpen className="h-5 w-5" />
                  </div>
                  Knowledge Base Ingestion
                </CardTitle>
              </CardHeader>
              <CardContent className="p-10 pt-2 space-y-6">
                <Textarea
                  value={textInput}
                  onChange={(e) => setTextInput(e.target.value)}
                  placeholder="Paste clinical case notes here..."
                  className="min-h-[250px] text-lg rounded-2xl border-slate-200 focus:ring-indigo-500 font-medium p-6 bg-slate-50/50"
                />
                <Button
                  onClick={analyzeDocuments}
                  disabled={sources.length === 0 && !textInput.trim()}
                  className="w-full h-16 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-black text-lg shadow-xl shadow-indigo-200"
                >
                  <Brain className="h-6 w-6 mr-3" />
                  START SUPER ANALYSIS
                </Button>
              </CardContent>
            </Card>

            {/* Floating Sources Bar (if any) */}
            {sources.length > 0 && (
              <div className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 animate-bounce-in">
                <div className="bg-slate-900 text-white px-6 py-4 rounded-full shadow-2xl flex items-center gap-6 border border-slate-800">
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
                    <span className="text-sm font-black uppercase tracking-widest">{sources.length} SOURCES READY</span>
                  </div>
                  <div className="h-6 w-[1px] bg-slate-700" />
                  <button onClick={() => setSources([])} className="hover:text-red-400 transition-colors">
                    <Trash2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={analyzeDocuments}
                    className="bg-indigo-600 text-white px-5 py-2 rounded-full text-xs font-black uppercase tracking-tighter"
                  >
                    Analyze Now
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Other steps follow the same improved design pattern... */}
        {/* Step 2: Analyzing */}
        {currentStep === 'analyzing' && (
          <div className="flex flex-col items-center justify-center py-40 animate-fade-in text-center">
            <div className="relative mb-12">
              <div className="w-40 h-40 rounded-full border-4 border-indigo-100 flex items-center justify-center">
                <div className="w-32 h-32 rounded-full bg-gradient-to-tr from-indigo-600 to-indigo-800 flex items-center justify-center shadow-2xl animate-spin-slow">
                  <Brain className="h-16 w-16 text-white" />
                </div>
              </div>
              <div className="absolute top-0 right-0 p-2 bg-emerald-500 rounded-full border-4 border-white animate-bounce" />
            </div>
            <h2 className="text-4xl font-black text-slate-900 mb-4 uppercase tracking-tight">Processing High-Complexity Case</h2>
            <p className="text-slate-500 text-xl font-medium max-w-md">Consulting internal knowledge base and cross-referencing clinical guidelines...</p>

            <div className="mt-12 flex flex-wrap justify-center gap-3">
              {['AAAAI Guidelines', 'GINA 2023', 'ICD-10-CM', 'CPT Helper', 'Epi-Logic'].map((tool) => (
                <div key={tool} className="px-5 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-[10px] font-black uppercase tracking-widest text-slate-400">
                  {tool}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Step 3: Review (Previously seen but would benefit from refined layout) */}
        {currentStep === 'review' && extraction && (
          <div className="space-y-10 animate-fade-in">
            <div className="flex items-center justify-between">
              <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800">Review Clinical Findings</h2>
              <Button onClick={generateNote} className="rounded-full bg-indigo-600 hover:bg-indigo-700 h-12 px-8 font-black uppercase tracking-widest text-xs">
                Construct SOAP Note
              </Button>
            </div>

            {/* Red Flags Alert */}
            {extraction.redFlags?.length > 0 && (
              <div className="bg-red-600 rounded-[2rem] p-8 text-white shadow-2xl shadow-red-100 flex items-start gap-6">
                <div className="bg-red-500 p-4 rounded-2xl">
                  <AlertTriangle className="h-8 w-8" />
                </div>
                <div>
                  <h3 className="text-xl font-black uppercase tracking-tight mb-4 text-red-100">Critical Red Flags Detected</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {extraction.redFlags.map((flag: any, idx: number) => (
                      <div key={idx} className="bg-red-500/30 p-4 rounded-xl border border-red-500/20">
                        <p className="font-black mb-1">{flag.flag}</p>
                        <p className="text-sm text-red-100 opacity-80">{flag.recommendation}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Statistics Column */}
              <div className="space-y-6">
                <div className="bg-white rounded-[2rem] p-8 shadow-xl">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-6">Patient Status</h4>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-indigo-50 text-indigo-700">
                      <span className="font-bold">Total Allergies</span>
                      <span className="font-black text-xl">
                        {(extraction.allergyHistory?.food?.length || 0) +
                          (extraction.allergyHistory?.drug?.length || 0) +
                          (extraction.allergyHistory?.environmental?.length || 0)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-4 rounded-2xl bg-blue-50 text-blue-700">
                      <span className="font-bold">Active Meds</span>
                      <span className="font-black text-xl">{extraction.medications?.length || 0}</span>
                    </div>
                  </div>
                </div>

                <div className="bg-slate-900 rounded-[2rem] p-8 shadow-xl text-white">
                  <h4 className="text-xs font-black text-slate-500 uppercase tracking-widest mb-6">Billing Extraction</h4>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-500">ICD-10 Codes</span>
                        <Badge className="bg-emerald-500">{extraction.icd10Codes?.length || 0}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {extraction.icd10Codes?.map((c: any, i: number) => (
                          <Badge key={i} variant="outline" className="border-slate-700 bg-slate-800 text-emerald-400 font-mono">
                            {c.code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div>
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] font-black uppercase text-slate-500">CPT Billing</span>
                        <Badge className="bg-blue-500">{extraction.cptCodes?.length || 0}</Badge>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {extraction.cptCodes?.map((c: any, i: number) => (
                          <Badge key={i} variant="outline" className="border-slate-700 bg-slate-800 text-blue-400 font-mono">
                            {c.code}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Content Column */}
              <div className="lg:col-span-2 space-y-8">
                <Card className="border-none shadow-xl bg-white rounded-[2rem] p-10">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="p-3 rounded-2xl bg-slate-100 text-slate-600">
                      <Stethoscope className="h-6 w-6" />
                    </div>
                    <div>
                      <h3 className="font-black uppercase tracking-tight text-xl">Clinical Impressions</h3>
                      <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Extracted Case Data</p>
                    </div>
                  </div>

                  <div className="space-y-8">
                    <div>
                      <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">Chief Complaint</h4>
                      <p className="text-xl font-bold text-slate-800">{extraction.chiefComplaint}</p>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">HPI Highlights</h4>
                        <ul className="space-y-4">
                          {extraction.hpiHighlights?.map((h: string, i: number) => (
                            <li key={i} className="flex gap-3 text-sm text-slate-600 font-medium leading-relaxed">
                              <div className="h-2 w-2 rounded-full bg-slate-300 mt-2 shrink-0" />
                              {h}
                            </li>
                          ))}
                        </ul>
                      </div>
                      <div>
                        <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-4">Assessment Plan</h4>
                        <ul className="space-y-4">
                          {extraction.assessmentCandidates?.map((a: any, i: number) => (
                            <li key={i} className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                              <div className="flex justify-between items-center mb-1">
                                <span className="font-black text-slate-800">{a.problem}</span>
                                <Badge className="bg-slate-200 text-slate-600 text-[10px]">{a.confidence}</Badge>
                              </div>
                              <p className="text-xs text-slate-500">{a.evidence}</p>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        )}

        {/* Step 4: Note */}
        {currentStep === 'note' && (
          <div className="max-w-4xl mx-auto space-y-10 animate-fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-black uppercase tracking-tight text-slate-800">Final SOAP Note</h2>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Ready for EHR Integration</p>
              </div>
              <div className="flex gap-3">
                <Button onClick={copyNote} variant="outline" className="rounded-full h-12 px-6 font-black uppercase text-xs">
                  {isCopied ? <Check className="h-4 w-4 mr-2" /> : <Copy className="h-4 w-4 mr-2" />}
                  {isCopied ? 'Copied' : 'Copy Text'}
                </Button>
                <Button onClick={downloadNote} variant="outline" className="rounded-full h-12 px-6 font-black uppercase text-xs">
                  <Download className="h-4 w-4 mr-2" />
                  Download
                </Button>
                <Button onClick={startNewVisit} className="rounded-full bg-indigo-600 hover:bg-indigo-700 h-12 px-6 font-black uppercase text-xs">
                  <Plus className="h-4 w-4 mr-2" />
                  New Visit
                </Button>
              </div>
            </div>

            <Card className="border-none shadow-2xl bg-white rounded-[3rem] overflow-hidden">
              <div className="bg-slate-900 px-10 py-6 text-white flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <FileCode2 className="h-5 w-5 text-indigo-400" />
                  <span className="font-black uppercase tracking-widest text-xs">Roman AI Generated Output</span>
                </div>
                <Badge className="bg-indigo-500">PRODUCTION v2.4</Badge>
              </div>
              <CardContent className="p-12">
                <div className="prose prose-slate max-w-none prose-p:leading-relaxed prose-headings:font-black prose-headings:uppercase prose-headings:tracking-widest prose-headings:text-xs prose-headings:text-slate-400">
                  <pre className="font-serif text-lg leading-relaxed whitespace-pre-wrap text-slate-800 bg-transparent p-0 selection:bg-indigo-100">
                    {generatedNote}
                  </pre>
                </div>
              </CardContent>
            </Card>

            <div className="bg-indigo-50 rounded-[2rem] p-8 border border-indigo-100 flex items-center gap-6">
              <div className="bg-indigo-600 p-4 rounded-2xl text-white">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h4 className="font-black uppercase tracking-tight text-indigo-900">Physician Attestation Required</h4>
                <p className="text-sm text-indigo-700 font-medium">This note was constructed by the Roman Super Allergist Assistant using encoded knowledge base v2.4. Please review all findings before commitment to EHR.</p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Background Micro-animations */}
      <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] bg-indigo-100/50 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-100/50 rounded-full blur-[120px]" />
      </div>

      {/* Privacy & Legal Consent Modal */}
      {showConsentModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xl animate-fade-in">
          <Card className="max-w-md w-full border-none shadow-2xl rounded-[2.5rem] overflow-hidden">
            <div className="h-2 bg-indigo-600 w-full" />
            <CardHeader className="p-8 pb-4">
              <div className="w-16 h-16 bg-indigo-50 rounded-2xl flex items-center justify-center mb-6">
                <Shield className="h-8 w-8 text-indigo-600" />
              </div>
              <CardTitle className="text-2xl font-black text-slate-900">Privacy & Consent</CardTitle>
              <CardDescription className="text-slate-500 font-medium">
                Clinical Audio Record Authorization
              </CardDescription>
            </CardHeader>
            <CardContent className="p-8 pt-0 space-y-6">
              <div className="space-y-4">
                <div className="flex gap-4 p-4 rounded-2xl bg-slate-50 border border-slate-100">
                  <Mic className="h-5 w-5 text-indigo-600 shrink-0" />
                  <p className="text-sm text-slate-600 leading-relaxed">
                    You are authorizing the system to access your microphone. Recording will <strong>only</strong> occur when you explicitly click the capture button.
                  </p>
                </div>
                <div className="flex gap-4 p-4 rounded-2xl bg-indigo-50/50 border border-indigo-100/50">
                  <AlertCircle className="h-5 w-5 text-indigo-600 shrink-0" />
                  <p className="text-sm text-indigo-700 leading-relaxed">
                    No background recording is permitted. The system will automatically shut down the microphone stream upon completion of the visit.
                  </p>
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <Button
                  onClick={handleAcceptConsent}
                  className="btn-premium h-14 rounded-2xl font-bold text-lg text-white"
                >
                  I Authorize Recording
                </Button>
                <Button
                  variant="ghost"
                  onClick={() => setShowConsentModal(false)}
                  className="h-12 rounded-xl text-slate-400 font-bold hover:text-slate-600"
                >
                  Cancel
                </Button>
              </div>

              <p className="text-[10px] text-slate-400 text-center uppercase tracking-widest font-black pt-4 border-t border-slate-100">
                HIPAA COMPLIANT • SECURE DATA CHANNEL
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}