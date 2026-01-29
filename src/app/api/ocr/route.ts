import { NextRequest, NextResponse } from 'next/server'
import { ocrResultSchema } from '@/types/schemas'

// OCR Provider Interface
interface OCRProvider {
  processImage(imageBuffer: Buffer): Promise<{
    text: string
    confidence: number
    layout?: Array<{
      text: string
      confidence: number
      bbox: { left: number; top: number; width: number; height: number }
    }>
  }>
}

// Azure Read OCR Implementation
class AzureReadOCR implements OCRProvider {
  private endpoint: string
  private apiKey: string

  constructor() {
    this.endpoint = process.env.AZURE_FORM_RECOGNIZER_ENDPOINT || ''
    this.apiKey = process.env.AZURE_FORM_RECOGNIZER_KEY || ''
  }

  async processImage(imageBuffer: Buffer): Promise<{
    text: string
    confidence: number
    layout?: Array<{
      text: string
      confidence: number
      bbox: { left: number; top: number; width: number; height: number }
    }>
  }> {
    if (!this.endpoint || !this.apiKey) {
      throw new Error('Azure Form Recognizer credentials not configured')
    }

    // Start the analysis
    const analyzeResponse = await fetch(`${this.endpoint}/formrecognizer/documentModels/prebuilt-read:analyze?api-version=2023-07-31`, {
      method: 'POST',
      headers: {
        'Ocp-Apim-Subscription-Key': this.apiKey,
        'Content-Type': 'application/octet-stream',
      },
      body: imageBuffer as any,
    })

    if (!analyzeResponse.ok) {
      throw new Error(`Azure analysis failed: ${analyzeResponse.statusText}`)
    }

    const operationLocation = analyzeResponse.headers.get('Operation-Location')
    if (!operationLocation) {
      throw new Error('No operation location returned from Azure')
    }

    // Poll for results
    let result = null
    let attempts = 0
    const maxAttempts = 30

    while (attempts < maxAttempts) {
      const statusResponse = await fetch(operationLocation, {
        headers: {
          'Ocp-Apim-Subscription-Key': this.apiKey,
        },
      })

      const statusData = await statusResponse.json()
      
      if (statusData.status === 'succeeded') {
        result = statusData
        break
      } else if (statusData.status === 'failed') {
        throw new Error('Azure analysis failed')
      }

      await new Promise(resolve => setTimeout(resolve, 1000))
      attempts++
    }

    if (!result) {
      throw new Error('Azure analysis timed out')
    }

    // Extract text and confidence
    const pages = result.analyzeResult?.pages || []
    let fullText = ''
    let totalConfidence = 0
    let confidenceCount = 0
    const layout: Array<{
      text: string
      confidence: number
      bbox: { left: number; top: number; width: number; height: number }
    }> = []

    pages.forEach((page: any) => {
      page.words?.forEach((word: any) => {
        fullText += word.content + ' '
        if (word.confidence) {
          totalConfidence += word.confidence
          confidenceCount++
        }
        
        if (word.boundingBox) {
          layout.push({
            text: word.content,
            confidence: word.confidence || 0,
            bbox: {
              left: Math.min(...word.boundingBox.filter((_: any, i: number) => i % 2 === 0)),
              top: Math.min(...word.boundingBox.filter((_: any, i: number) => i % 2 === 1)),
              width: Math.max(...word.boundingBox.filter((_: any, i: number) => i % 2 === 0)) - Math.min(...word.boundingBox.filter((_: any, i: number) => i % 2 === 0)),
              height: Math.max(...word.boundingBox.filter((_: any, i: number) => i % 2 === 1)) - Math.min(...word.boundingBox.filter((_: any, i: number) => i % 2 === 1))
            }
          })
        }
      })
    })

    const avgConfidence = confidenceCount > 0 ? totalConfidence / confidenceCount : 0

    return {
      text: fullText.trim(),
      confidence: avgConfidence,
      layout: layout.length > 0 ? layout : undefined
    }
  }
}

// Google Document AI Implementation
class GoogleDocumentAIOCR implements OCRProvider {
  private projectId: string
  private location: string
  private processorId: string

  constructor() {
    this.projectId = process.env.GOOGLE_CLOUD_PROJECT_ID || ''
    this.location = process.env.GOOGLE_CLOUD_LOCATION || 'us'
    this.processorId = process.env.GOOGLE_DOCUMENT_AI_PROCESSOR_ID || ''
  }

  async processImage(imageBuffer: Buffer): Promise<{
    text: string
    confidence: number
    layout?: Array<{
      text: string
      confidence: number
      bbox: { left: number; top: number; width: number; height: number }
    }>
  }> {
    if (!this.projectId || !this.processorId) {
      throw new Error('Google Document AI credentials not configured')
    }

    // This is a simplified implementation. In a real app, you'd use the Google Cloud client library
    const url = `https://${this.location}-documentai.googleapis.com/v1/projects/${this.projectId}/locations/${this.location}/processors/${this.processorId}:process`
    
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${await this.getAccessToken()}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        rawDocument: {
          content: imageBuffer.toString('base64'),
          mimeType: 'image/jpeg'
        }
      })
    })

    if (!response.ok) {
      throw new Error(`Google Document AI failed: ${response.statusText}`)
    }

    const result = await response.json()
    
    // Extract text from the response
    const document = result.document
    const text = document.text || ''
    
    // Calculate confidence from entities if available
    let confidence = 0.8 // Default confidence for Document AI
    if (document.entities && document.entities.length > 0) {
      const avgConfidence = document.entities.reduce((sum: number, entity: any) => 
        sum + (entity.confidence || 0.8), 0) / document.entities.length
      confidence = avgConfidence
    }

    return {
      text: text.trim(),
      confidence,
      layout: undefined // Simplified for now
    }
  }

  private async getAccessToken(): Promise<string> {
    // In a real implementation, you'd use Google Cloud authentication
    // For now, this is a placeholder
    if (!process.env.GOOGLE_APPLICATION_CREDENTIALS) {
      throw new Error('Google Application Credentials not configured')
    }
    
    // This would normally use the Google Auth library
    throw new Error('Google Auth not implemented in this demo')
  }
}

// Mock OCR for development/demo mode
class MockOCROCR implements OCRProvider {
  async processImage(imageBuffer: Buffer): Promise<{
    text: string
    confidence: number
    layout?: Array<{
      text: string
      confidence: number
      bbox: { left: number; top: number; width: number; height: number }
    }>
  }> {
    // Simulate OCR processing
    await new Promise(resolve => setTimeout(resolve, 2000))
    
    // Mock text based on file size (very simple heuristic)
    const mockText = `Patient: John Doe
DOB: 01/15/1985
Allergies: Penicillin (rash), Shellfish (anaphylaxis)
Current Medications: Loratadine 10mg daily
HPI: 35-year-old male presents with seasonal allergic rhinitis symptoms...
Exam: Alert, oriented, no acute distress
Assessment: Allergic rhinitis, seasonal
Plan: Continue current medications, consider immunotherapy`

    return {
      text: mockText,
      confidence: 0.85,
      layout: undefined
    }
  }
}

function getOCRProvider(): OCRProvider {
  const provider = process.env.OCR_PROVIDER || 'mock'
  
  switch (provider) {
    case 'azure':
      return new AzureReadOCR()
    case 'google':
      return new GoogleDocumentAIOCR()
    case 'mock':
    default:
      return new MockOCROCR()
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const imageFile = formData.get('image') as File
    const visitId = formData.get('visitId') as string

    if (!imageFile || !visitId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert image file to buffer
    const imageBuffer = Buffer.from(await imageFile.arrayBuffer())

    // Process with OCR provider
    const ocrProvider = getOCRProvider()
    const result = await ocrProvider.processImage(imageBuffer)

    // Validate the result
    const validatedResult = ocrResultSchema.parse(result)

    // Here you would typically save to database
    // For now, we'll just return the result

    return NextResponse.json(validatedResult)

  } catch (error) {
    console.error('OCR error:', error)
    
    if (error instanceof Error && error.message.includes('credentials')) {
      return NextResponse.json(
        { error: 'OCR service not configured. Please check environment variables.' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to process image' },
      { status: 500 }
    )
  }
}