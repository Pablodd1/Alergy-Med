'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Mic, Upload, Type, Square, Trash2, Eye, EyeOff, ArrowRight, FileText } from 'lucide-react'

interface CaptureSource {
  id: string
  type: 'audio' | 'image' | 'document' | 'text'
  content: string
  metadata: {
    filename?: string
    timestamp?: string
    confidence?: number
    segments?: Array<{ start: number; end: number; text: string }>
  }
}

interface CaptureModuleProps {
  visitId: string
  onAnalysisStarted: () => void
}

export function CaptureModule({ visitId, onAnalysisStarted }: CaptureModuleProps) {
  const [sources, setSources] = useState<CaptureSource[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [showSources, setShowSources] = useState(true)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { toast } = useToast()

  // Audio recording functions
  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        audioChunksRef.current.push(event.data)
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const reader = new FileReader()

        reader.onloadend = async () => {
          try {
            const formData = new FormData()
            formData.append('audio', audioBlob, 'audio.webm')
            formData.append('visitId', visitId)

            const response = await fetch('/api/transcribe', {
              method: 'POST',
              body: formData
            })

            if (!response.ok) {
              const errorData = await response.json()
              throw new Error(errorData.error || 'Transcription failed')
            }

            const result = await response.json()

            const newSource: CaptureSource = {
              id: Date.now().toString(),
              type: 'audio',
              content: result.text,
              metadata: {
                timestamp: new Date().toISOString(),
                segments: result.segments
              }
            }

            setSources(prev => [...prev, newSource])

            toast({
              title: 'Audio Transcribed',
              description: `Extracted ${result.text.length} characters of text.`
            })

          } catch (error) {
            console.error('Transcription error:', error)
            toast({
              title: 'Transcription Error',
              description: error instanceof Error ? error.message : 'Failed to transcribe audio. Please try again.',
              variant: 'destructive'
            })
          }
        }

        reader.readAsDataURL(audioBlob)
        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)

      recordingIntervalRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1)
      }, 1000)

    } catch (error) {
      toast({
        title: 'Recording Error',
        description: 'Failed to start recording. Please check microphone permissions.',
        variant: 'destructive'
      })
    }
  }, [visitId, toast])

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  // File upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files || files.length === 0) return

    setIsProcessing(true)

    for (let i = 0; i < files.length; i++) {
      const file = files[i]
      try {
        const formData = new FormData()
        formData.append('file', file)
        formData.append('visitId', visitId)

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        })

        if (!response.ok) {
          const errorData = await response.json()
          throw new Error(errorData.error || `Failed to upload ${file.name}`)
        }

        const result = await response.json()

        const newSource: CaptureSource = {
          id: Date.now().toString() + i,
          type: 'document',
          content: result.text,
          metadata: {
            filename: file.name,
            timestamp: new Date().toISOString()
          }
        }

        setSources(prev => [...prev, newSource])

        toast({
          title: 'File Processed',
          description: `Successfully extracted text from ${file.name}`
        })

      } catch (error) {
        console.error('File upload error:', error)
        toast({
          title: 'Upload Error',
          description: error instanceof Error ? error.message : `Failed to process ${file.name}`,
          variant: 'destructive'
        })
      }
    }

    setIsProcessing(false)
    event.target.value = '' // Reset input
  }

  const handleAddText = () => {
    if (!textInput.trim()) return

    const newSource: CaptureSource = {
      id: Date.now().toString(),
      type: 'text',
      content: textInput,
      metadata: {
        timestamp: new Date().toISOString()
      }
    }

    setSources(prev => [...prev, newSource])
    setTextInput('')
    toast({
      title: 'Note Added',
      description: 'Your text note has been added as a source.'
    })
  }

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id))
  }

  const handleStartAnalysis = async () => {
    if (sources.length === 0) {
      toast({
        title: 'No Sources',
        description: 'Please capture some information before starting analysis.',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsProcessing(true)

      // Get current visit data to preserve metadata if needed
      const visitResponse = await fetch(`/api/visits/${visitId}`)
      if (!visitResponse.ok) throw new Error('Visit not found')
      const visit = await visitResponse.json()

      // Update visit with all sources
      const updateResponse = await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          sources: sources,
          status: 'draft'
        }),
      })

      if (!updateResponse.ok) throw new Error('Failed to update visit sources')

      onAnalysisStarted()
    } catch (error) {
      console.error('Analysis start error:', error)
      toast({
        title: 'Analysis Error',
        description: 'Failed to prepare information for analysis.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <Card className="overflow-hidden border-none shadow-premium">
        <div className="medical-gradient h-2 bg-blue-600" />
        <CardHeader>
          <CardTitle className="text-2xl text-blue-900">Capture Visit Details</CardTitle>
          <CardDescription>
            Use voice, documents, or text to capture patient information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Recording Section */}
            <div className={`p-6 rounded-2xl border transition-all duration-300 ${isRecording ? 'border-red-200 bg-red-50 ring-2 ring-red-100' : 'bg-white border-blue-50'}`}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${isRecording ? 'bg-red-500' : 'bg-blue-600'}`}>
                    <Mic className="h-5 w-5 text-white" />
                  </div>
                  <span className="font-semibold text-blue-900">Voice Note</span>
                </div>
                {isRecording && (
                  <span className="text-red-600 font-mono font-bold animate-pulse">
                    {formatTime(recordingTime)}
                  </span>
                )}
              </div>

              <Button
                onClick={isRecording ? stopRecording : startRecording}
                className={`w-full h-14 rounded-xl text-lg font-medium transition-all ${isRecording ? 'bg-red-600 hover:bg-red-700 text-white' : 'bg-blue-600 hover:bg-blue-700 text-white'} shadow-lg`}
              >
                {isRecording ? (
                  <><Square className="mr-2 h-5 w-5" /> Stop Recording</>
                ) : (
                  <><Mic className="mr-2 h-5 w-5" /> Start Capture</>
                )}
              </Button>
            </div>

            {/* Document Upload Section */}
            <div className="p-6 rounded-2xl border bg-white border-blue-50">
              <div className="flex items-center space-x-3 mb-4">
                <div className="p-2 rounded-lg bg-indigo-600">
                  <Upload className="h-5 w-5 text-white" />
                </div>
                <span className="font-semibold text-blue-900">Medical Documents</span>
              </div>

              <Button
                onClick={() => document.getElementById('file-upload')?.click()}
                variant="outline"
                className="w-full h-14 rounded-xl border-2 hover:bg-indigo-50 hover:text-indigo-700 hover:border-indigo-200 border-indigo-100 text-indigo-600 font-medium"
                disabled={isProcessing}
              >
                <FileText className="mr-2 h-5 w-5" />
                {isProcessing ? 'Processing...' : 'Upload Files (PDF, DOCX)'}
              </Button>
              <input
                id="file-upload"
                type="file"
                multiple
                accept=".pdf,.docx,.doc,.txt"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>
          </div>

          {/* Text Input Section */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2 text-blue-900">
              <Type className="h-5 w-5" />
              <span className="font-semibold">Additional Observations</span>
            </div>
            <div className="relative group">
              <Textarea
                placeholder="Type clinician notes or observations here..."
                value={textInput}
                onChange={(e) => setTextInput(e.target.value)}
                className="min-h-[120px] rounded-xl border-blue-100 focus:border-blue-300 focus:ring-blue-100 text-base p-4"
              />
              <Button
                onClick={handleAddText}
                disabled={!textInput.trim()}
                className="absolute bottom-3 right-3 rounded-lg bg-blue-900 hover:bg-black text-white"
                size="sm"
              >
                Add Note
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Captured Sources Feed */}
      {sources.length > 0 && (
        <Card className="border-none shadow-premium animate-fade-in">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-xl text-blue-900">Captured Content ({sources.length})</CardTitle>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setShowSources(!showSources)}>
              {showSources ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </Button>
          </CardHeader>
          {showSources && (
            <CardContent>
              <div className="space-y-3">
                {sources.map((source) => (
                  <div
                    key={source.id}
                    className="flex items-start justify-between p-4 rounded-xl bg-slate-50 border border-slate-100 group animate-fade-in"
                  >
                    <div className="flex items-start space-x-3 w-full">
                      <div className="p-2 rounded-lg bg-white shadow-sm">
                        {source.type === 'audio' && <Mic className="h-4 w-4 text-red-500" />}
                        {source.type === 'document' && <FileText className="h-4 w-4 text-indigo-500" />}
                        {source.type === 'text' && <Type className="h-4 w-4 text-slate-500" />}
                      </div>
                      <div className="flex-1 overflow-hidden">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-bold uppercase tracking-wider text-slate-400">
                            {source.type} • {new Date(source.metadata.timestamp || '').toLocaleTimeString()}
                          </span>
                        </div>
                        <p className="text-sm text-slate-700 line-clamp-3 leading-relaxed">
                          {source.content}
                        </p>
                      </div>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeSource(source.id)}
                      className="text-slate-400 hover:text-red-500 hover:bg-red-50 ml-2"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          )}
        </Card>
      )}

      {/* Final Action Button */}
      <div className="flex justify-end pt-4 sticky bottom-4">
        <Button
          onClick={handleStartAnalysis}
          disabled={sources.length === 0 || isProcessing}
          className="btn-premium h-16 px-10 text-lg group"
        >
          {isProcessing ? (
            'Preparing Analysis...'
          ) : (
            <>
              Confirm & Start Medical Analysis
              <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
            </>
          )}
        </Button>
      </div>
    </div>
  )
}