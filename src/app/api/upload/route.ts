import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'
import { ocrResultSchema } from '@/types/schemas'
import { OCRService } from '@/services/ocrService'

async function extractTextFromPDF(buffer: Buffer): Promise<string> {
  try {
    const data = await pdf(buffer)
    return data.text
  } catch (error) {
    console.error('PDF extraction error:', error)
    throw new Error('Failed to extract text from PDF')
  }
}

async function extractTextFromDOCX(buffer: Buffer): Promise<string> {
  try {
    const result = await mammoth.extractRawText({ buffer })
    return result.value
  } catch (error) {
    console.error('DOCX extraction error:', error)
    throw new Error('Failed to extract text from DOCX')
  }
}

async function extractTextFromImage(buffer: Buffer): Promise<{
  text: string
  confidence: number
}> {
  try {
    return await OCRService.processImage(buffer)
  } catch (error) {
    console.error('Image OCR error:', error)
    throw new Error('Failed to extract text from image')
  }
}

async function extractTextFromTXT(buffer: Buffer): Promise<string> {
  try {
    return buffer.toString('utf-8')
  } catch (error) {
    console.error('TXT extraction error:', error)
    throw new Error('Failed to extract text from TXT file')
  }
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File
    const visitId = formData.get('visitId') as string

    if (!file || !visitId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let text = ''
    let confidence = 1.0

    // Extract text based on file type
    if (fileName.endsWith('.pdf')) {
      text = await extractTextFromPDF(buffer)
      // If PDF text extraction returns very little text, try OCR
      if (text.trim().length < 50) {
        console.log('PDF appears to be scanned, attempting OCR...')
        const ocrResult = await extractTextFromImage(buffer)
        text = ocrResult.text
        confidence = ocrResult.confidence
      }
    } else if (fileName.endsWith('.docx')) {
      text = await extractTextFromDOCX(buffer)
    } else if (fileName.endsWith('.txt')) {
      text = await extractTextFromTXT(buffer)
    } else if (fileName.match(/\.(jpg|jpeg|png|gif|bmp|tiff)$/)) {
      const ocrResult = await extractTextFromImage(buffer)
      text = ocrResult.text
      confidence = ocrResult.confidence
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type' },
        { status: 400 }
      )
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'No text could be extracted from the file' },
        { status: 400 }
      )
    }

    const result = {
      text: text.trim(),
      confidence,
      filename: file.name
    }

    // Validate the result
    const validatedResult = ocrResultSchema.parse(result)

    return NextResponse.json(validatedResult)

  } catch (error) {
    console.error('File processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process file: ${errorMessage}` },
      { status: 500 }
    )
  }
}