'use client'

import { useState, useRef, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import { useToast } from '@/components/ui/toaster'
import { Mic, Camera, Upload, Type, Play, Square, Trash2, Eye, EyeOff, ArrowRight } from 'lucide-react'

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
  onNext: () => void
}

export function CaptureModule({ visitId, onNext }: CaptureModuleProps) {
  const [sources, setSources] = useState<CaptureSource[]>([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [textInput, setTextInput] = useState('')
  const [showPreview, setShowPreview] = useState(false)
  
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' })
        await transcribeAudio(audioBlob)
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
        description: 'Could not access microphone. Please check permissions.',
        variant: 'destructive'
      })
    }
  }
  
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop()
      setIsRecording(false)
      
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current)
        recordingIntervalRef.current = null
      }
    }
  }
  
  const transcribeAudio = async (audioBlob: Blob) => {
    try {
      const formData = new FormData()
      formData.append('audio', audioBlob, 'recording.wav')
      formData.append('visitId', visitId)
      
      const response = await fetch('/api/transcribe', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('Transcription failed')
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
        description: `Transcribed ${result.text.length} characters`
      })
      
    } catch (error) {
      toast({
        title: 'Transcription Error',
        description: 'Failed to transcribe audio. Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  // Camera capture
  const captureFromCamera = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/*'
    input.capture = 'environment'
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        await processImage(file)
      }
    }
    
    input.click()
  }
  
  const processImage = async (file: File) => {
    try {
      const formData = new FormData()
      formData.append('image', file)
      formData.append('visitId', visitId)
      
      const response = await fetch('/api/ocr', {
        method: 'POST',
        body: formData
      })
      
      if (!response.ok) {
        throw new Error('OCR processing failed')
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
        title: 'Image Processed',
        description: `Extracted ${result.text.length} characters (confidence: ${Math.round(result.confidence * 100)}%)`
      })
      
    } catch (error) {
      toast({
        title: 'OCR Error',
        description: 'Failed to process image. Please try again.',
        variant: 'destructive'
      })
    }
  }
  
  // File upload
  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files
    if (files) {
      Array.from(files).forEach(file => processFile(file))
    }
  }
  
  const processFile = async (file: File) => {
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
        title: 'Document Processed',
        description: `Extracted ${result.text.length} characters from ${file.name}`
      })
      
    } catch (error) {
      toast({
        title: 'Processing Error',
        description: 'Failed to process document. Please try again.',
        variant: 'destructive'
      })
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
        title: 'Text Added',
        description: `Added ${textInput.length} characters`
      })
    }
  }
  
  const removeSource = (id: string) => {
    setSources(prev => prev.filter(source => source.id !== id))
  }
  
  const extractFacts = async () => {
    if (sources.length === 0) {
      toast({
        title: 'No Sources',
        description: 'Please add some sources first',
        variant: 'destructive'
      })
      return
    }
    
    // Store sources in session storage for the review step
    sessionStorage.setItem(`sources_${visitId}`, JSON.stringify(sources))
    onNext()
  }

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  return (
    <div className="space-y-6">
      {/* Capture Controls */}
      <Card>
        <CardHeader>
          <CardTitle>Step 1: Capture Information</CardTitle>
          <CardDescription>Record audio, take photos, upload documents, or type text</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Button
              onClick={isRecording ? stopRecording : startRecording}
              variant={isRecording ? 'destructive' : 'default'}
              className="h-16 text-sm"
            >
              {isRecording ? (
                <>
                  <Square className="mr-2 h-5 w-5" />
                  Stop ({formatTime(recordingTime)})
                </>
              ) : (
                <>
                  <Mic className="mr-2 h-5 w-5" />
                  Record Audio
                </>
              )}
            </Button>
            
            <Button onClick={captureFromCamera} className="h-16 text-sm">
              <Camera className="mr-2 h-5 w-5" />
              Take Photo
            </Button>
            
            <Button
              onClick={() => document.getElementById('file-upload')?.click()}
              className="h-16 text-sm"
            >
              <Upload className="mr-2 h-5 w-5" />
              Upload Files
            </Button>
            
            <Button
              onClick={() => setShowPreview(!showPreview)}
              variant="outline"
              className="h-16 text-sm"
            >
              {showPreview ? (
                <>
                  <EyeOff className="mr-2 h-5 w-5" />
                  Hide Preview
                </>
              ) : (
                <>
                  <Eye className="mr-2 h-5 w-5" />
                  Show Preview
                </>
              )}
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
          
          <div className="space-y-2">
            <Textarea
              placeholder="Or type/paste text here..."
              value={textInput}
              onChange={(e) => setTextInput(e.target.value)}
              rows={4}
            />
            <Button onClick={addTextInput} disabled={!textInput.trim()}>
              <Type className="mr-2 h-4 w-4" />
              Add Text
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Sources Preview */}
      {sources.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Captured Sources ({sources.length})</CardTitle>
            <CardDescription>Review and manage your captured information</CardDescription>
          </CardHeader>
          <CardContent>
            {showPreview && (
              <div className="space-y-4 mb-6">
                {sources.map((source) => (
                  <div key={source.id} className="border rounded-lg p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex items-center space-x-2">
                        <span className="text-xs font-medium px-2 py-1 bg-gray-100 rounded">
                          {source.type.toUpperCase()}
                        </span>
                        {source.metadata.filename && (
                          <span className="text-xs text-gray-600">{source.metadata.filename}</span>
                        )}
                      </div>
                      <Button
                        onClick={() => removeSource(source.id)}
                        variant="ghost"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="text-sm text-gray-700 max-h-32 overflow-y-auto">
                      {source.content}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            <div className="flex justify-between items-center">
              <Button
                onClick={() => setSources([])}
                variant="outline"
                disabled={sources.length === 0}
              >
                <Trash2 className="mr-2 h-4 w-4" />
                Clear All
              </Button>
              
              <Button onClick={extractFacts} disabled={sources.length === 0}>
                Extract Facts
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}