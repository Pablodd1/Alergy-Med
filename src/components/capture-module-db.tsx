'use client'

import { useState, useRef, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/use-toast'
import { Mic, Camera, Upload, Type, Square, Trash2, Check, Loader2, FileText, Image as ImageIcon, Music } from 'lucide-react'

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
  userId: string
  onNext: () => void
}

export function CaptureModule({ visitId, userId, onNext }: CaptureModuleProps) {
  const [sources, setSources] = useState<CaptureSource[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [isProcessing, setIsProcessing] = useState(false)
  const [processingType, setProcessingType] = useState<string>('')
  const [isSaving, setIsSaving] = useState(false)

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const recordingIntervalRef = useRef<NodeJS.Timeout | null>(null)

  const { toast } = useToast()

  // Audio recording functions
  const startRecording = async () => {
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
          setIsProcessing(true)
          setProcessingType('Transcribing audio...')

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
              title: '✅ Audio Transcribed Successfully',
              description: `Added ${result.text.length} characters of text from audio recording.`,
              duration: 3000
            })

          } catch (error) {
            console.error('Transcription error:', error)
            toast({
              title: 'Transcription Error',
              description: error instanceof Error ? error.message : 'Failed to transcribe audio. Please try again.',
              variant: 'destructive'
            })
          } finally {
            setIsProcessing(false)
            setProcessingType('')
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
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state === 'recording') {
      mediaRecorderRef.current.stop()
      setIsRecording(false)

      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
      }
    }
  }

  // Camera capture
  const processCameraImage = async (file: File) => {
    setIsProcessing(true)
    setProcessingType('Processing image...')

    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('visitId', visitId)

      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'OCR processing failed')
      }

      const result = await response.json()

      const newSource: CaptureSource = {
        id: Date.now().toString(),
        type: 'image',
        content: result.text,
        metadata: {
          filename: file.name,
          timestamp: new Date().toISOString(),
          confidence: result.confidence
        }
      }

      setSources(prev => [...prev, newSource])

      toast({
        title: '✅ Image Processed Successfully',
        description: `Added "${file.name}" - Extracted ${result.text.length} characters`,
        duration: 3000
      })

    } catch (error) {
      console.error('Camera capture error:', error)
      toast({
        title: 'Processing Error',
        description: error instanceof Error ? error.message : 'Failed to process image. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
      setProcessingType('')
    }
  }

  const triggerCamera = () => {
    const input = document.getElementById('camera-upload')
    if (input) {
      input.click()
    }
  }

  // File upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (!files) return

    for (const file of Array.from(files)) {
      await processFile(file)
    }
  }

  const processFile = async (file: File) => {
    setIsProcessing(true)
    setProcessingType(`Processing ${file.name}...`)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('visitId', visitId)

      const response = await fetch('/api/upload', {
        method: 'POST',
        body: formData
      })

      if (!response.ok) {
        throw new Error('File processing failed')
      }

      const result = await response.json()

      const newSource: CaptureSource = {
        id: Date.now().toString(),
        type: 'document',
        content: result.text,
        metadata: {
          filename: file.name,
          timestamp: new Date().toISOString(),
          confidence: result.confidence
        }
      }

      setSources(prev => [...prev, newSource])

      toast({
        title: '✅ Document Processed Successfully',
        description: `Added "${file.name}" - Extracted ${result.text.length} characters`,
        duration: 3000
      })

    } catch (error) {
      toast({
        title: 'Processing Error',
        description: 'Failed to process document. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
      setProcessingType('')
    }
  }

  // Text input
  const addTextInput = () => {
    if (textInput.trim()) {
      const newSource: CaptureSource = {
        id: Date.now().toString(),
        type: 'text',
        content: textInput.trim(),
        metadata: {
          timestamp: new Date().toISOString()
        }
      }

      setSources(prev => [...prev, newSource])
      setTextInput('')

      toast({
        title: '✅ Text Added Successfully',
        description: `Added ${textInput.length} characters of text`,
        duration: 3000
      })
    }
  }

  const removeSource = (id: string) => {
    setSources(prev => prev.filter(source => source.id !== id))
    toast({
      title: 'Source Removed',
      description: 'Source has been removed from the visit',
      duration: 2000
    })
  }

  const startAnalysis = async () => {
    if (sources.length === 0) {
      toast({
        title: 'No Sources',
        description: 'Please add at least one source (audio, image, document, or text) before analyzing',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)

    try {
      // Update the visit in database with sources
      const response = await fetch(`/api/visits/${visitId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ sources }),
      });

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to update visit with sources');
      }

      toast({
        title: '✅ Sources Saved Successfully',
        description: `${sources.length} source(s) saved. Starting AI analysis...`,
        duration: 3000
      })

      // Small delay to show success message
      setTimeout(() => {
        onNext()
      }, 500)

    } catch (error) {
      console.error('Error starting analysis:', error)
      toast({
        title: 'Error Saving Sources',
        description: error instanceof Error ? error.message : 'Failed to save sources. Please try again.',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getSourceIcon = (type: string) => {
    switch (type) {
      case 'audio': return <Music className="h-4 w-4" />
      case 'image': return <ImageIcon className="h-4 w-4" />
      case 'document': return <FileText className="h-4 w-4" />
      case 'text': return <Type className="h-4 w-4" />
      default: return <FileText className="h-4 w-4" />
    }
  }

  return (
    <div className="space-y-6">
      {/* Processing Indicator */}
      {(isProcessing || isSaving) && (
        <Card className="border-blue-200 bg-blue-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <Loader2 className="h-5 w-5 animate-spin text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">
                  {isSaving ? 'Saving sources...' : processingType}
                </p>
                <p className="text-sm text-blue-700">
                  {isSaving ? 'Please wait while we save your data' : 'AI is processing your input'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Recording Indicator */}
      {isRecording && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="pt-6">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <div className="h-3 w-3 bg-red-600 rounded-full animate-pulse"></div>
                <span className="font-medium text-red-900">RECORDING</span>
              </div>
              <span className="text-red-700 font-mono">{formatTime(recordingTime)}</span>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Capture Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Capture Information</CardTitle>
          <CardDescription>
            Add medical information using voice, camera, documents, or text. Each source will be confirmed before adding.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Audio Recording */}
          <div className="space-y-2">
            <label className="text-sm font-medium">🎤 Voice Recording (Live Transcription)</label>
            <div className="flex gap-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant={isRecording ? 'destructive' : 'default'}
                className="flex-1"
                disabled={isProcessing}
              >
                {isRecording ? (
                  <>
                    <Square className="mr-2 h-5 w-5" />
                    Stop Recording ({formatTime(recordingTime)})
                  </>
                ) : (
                  <>
                    <Mic className="mr-2 h-5 w-5" />
                    Start Recording
                  </>
                )}
              </Button>
            </div>
            <p className="text-xs text-gray-500">Click to start recording. Audio will be automatically transcribed when you stop.</p>
          </div>

          {/* Camera Capture */}
          <div className="space-y-2">
            <label className="text-sm font-medium">📷 Camera / Photos</label>
            <Button
              onClick={triggerCamera}
              className="w-full"
              disabled={isProcessing || isRecording}
              variant="outline"
            >
              <Camera className="mr-2 h-5 w-5" />
              Take Photo or Upload Image
            </Button>
            <p className="text-xs text-gray-500">Capture handwritten notes, documents, or medical forms. OCR will extract text.</p>
          </div>

          {/* Document Upload */}
          <div className="space-y-2">
            <label className="text-sm font-medium">📄 Documents (PDF, Word, Images)</label>
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="w-full"
              disabled={isProcessing || isRecording}
              variant="outline"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Documents
            </Button>
            <p className="text-xs text-gray-500">Upload PDF, Word documents, or scanned papers. Supports handwritten content.</p>
          </div>

          {/* Text Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium">✍️ Type or Paste Text</label>
            <Textarea
              placeholder="Type or paste medical information here (patient symptoms, history, notes, etc.)..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={4}
              disabled={isProcessing || isRecording}
            />
            <Button
              onClick={addTextInput}
              disabled={!textInput.trim() || isProcessing || isRecording}
              className="w-full"
            >
              <Type className="mr-2 h-4 w-4" />
              ADD Text to Visit
            </Button>
          </div>

          <input
            id="file-upload"
            type="file"
            multiple
            accept=".pdf,.docx,.doc,.txt,.jpg,.jpeg,.png,.gif"
            onChange={handleFileUpload}
            className="hidden"
          />

          <input
            id="camera-upload"
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) {
                processCameraImage(file)
              }
            }}
            className="hidden"
          />
        </CardContent>
      </Card>

      {/* Sources List */}
      {sources.length > 0 && (
        <Card className="border-green-200">
          <CardHeader className="bg-green-50">
            <CardTitle className="flex items-center text-green-900">
              <Check className="mr-2 h-5 w-5" />
              Sources Added ({sources.length})
            </CardTitle>
            <CardDescription className="text-green-700">
              Review your captured information before analysis
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <div className="space-y-3 mb-6">
              {sources.map((source) => (
                <div key={source.id} className="border rounded-lg p-4 bg-gray-50">
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-2">
                      <div className="flex items-center space-x-1 text-xs font-medium px-2 py-1 bg-white border rounded">
                        {getSourceIcon(source.type)}
                        <span>{source.type.toUpperCase()}</span>
                      </div>
                      {source.metadata.filename && (
                        <span className="text-xs text-gray-600">📎 {source.metadata.filename}</span>
                      )}
                      <span className="text-xs text-green-600 flex items-center">
                        <Check className="h-3 w-3 mr-1" />
                        Confirmed
                      </span>
                    </div>
                    <Button
                      onClick={() => removeSource(source.id)}
                      variant="ghost"
                      size="sm"
                    >
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  </div>
                  <div className="text-sm text-gray-700 bg-white p-2 rounded border max-h-24 overflow-y-auto">
                    {source.content.substring(0, 200)}
                    {source.content.length > 200 && '...'}
                  </div>
                  <div className="text-xs text-gray-500 mt-1">
                    {source.content.length} characters
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-between items-center pt-4 border-t">
              <Button
                onClick={() => {
                  setSources([])
                  toast({ title: 'All sources cleared', duration: 2000 })
                }}
                variant="outline"
                disabled={sources.length === 0 || isSaving}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>

              <Button
                onClick={startAnalysis}
                disabled={sources.length === 0 || isSaving}
                size="lg"
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Check className="mr-2 h-5 w-5" />
                    Save & Analyze ({sources.length} source{sources.length !== 1 ? 's' : ''})
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* No Sources Message */}
      {sources.length === 0 && !isProcessing && !isRecording && (
        <Card className="border-gray-200">
          <CardContent className="pt-6 text-center text-gray-500">
            <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p className="font-medium">No sources added yet</p>
            <p className="text-sm">Use one of the capture methods above to add information to this visit</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}