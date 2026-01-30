import { NextRequest, NextResponse } from 'next/server'
import pdf from 'pdf-parse'
import mammoth from 'mammoth'

// ============================================================================
// FILE UPLOAD API - Document Text Extraction
// Supports: PDF, DOCX, DOC, TXT, RTF
// ============================================================================

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
        { error: 'Missing required fields: file and visitId' },
        { status: 400 }
      )
    }

    const buffer = Buffer.from(await file.arrayBuffer())
    const fileName = file.name.toLowerCase()
    let text = ''

    // Extract text based on file type
    if (fileName.endsWith('.pdf')) {
      text = await extractTextFromPDF(buffer)
    } else if (fileName.endsWith('.docx') || fileName.endsWith('.doc')) {
      text = await extractTextFromDOCX(buffer)
    } else if (fileName.endsWith('.txt') || fileName.endsWith('.rtf')) {
      text = await extractTextFromTXT(buffer)
    } else {
      return NextResponse.json(
        { error: 'Unsupported file type. Please upload PDF, DOCX, DOC, TXT, or RTF files.' },
        { status: 400 }
      )
    }

    if (!text.trim()) {
      return NextResponse.json(
        { error: 'No text could be extracted from the file. The file may be empty or contain only images.' },
        { status: 400 }
      )
    }

    // Return extracted text
    return NextResponse.json({
      text: text.trim(),
      filename: file.name,
      wordCount: text.trim().split(/\s+/).length,
      extractedAt: new Date().toISOString()
    })

  } catch (error) {
    console.error('File processing error:', error)
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    return NextResponse.json(
      { error: `Failed to process file: ${errorMessage}` },
      { status: 500 }
    )
  }
}