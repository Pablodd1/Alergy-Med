import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { transcriptionResultSchema } from '@/types/schemas'

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('The OPENAI_API_KEY environment variable is missing or empty');
  }
  return new OpenAI({ apiKey });
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File
    const visitId = formData.get('visitId') as string

    if (!audioFile || !visitId) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Convert audio file to buffer
    const audioBuffer = Buffer.from(await audioFile.arrayBuffer())

    // Transcribe using OpenAI Whisper
    const openai = getOpenAIClient()
    const response = await openai.audio.transcriptions.create({
      file: new File([audioBuffer], 'audio.webm', { type: 'audio/webm' }),
      model: 'whisper-1',
      response_format: 'verbose_json',
      timestamp_granularities: ['segment'],
    })

    // Parse segments if available
    const segments = response.segments?.map((segment: any) => ({
      start: segment.start,
      end: segment.end,
      text: segment.text.trim(),
    })) || []

    const result = {
      text: response.text.trim(),
      segments,
    }

    // Validate the result
    const validatedResult = transcriptionResultSchema.parse(result)

    // Here you would typically save to database
    // For now, we'll just return the result

    return NextResponse.json(validatedResult)

  } catch (error) {
    console.error('Transcription error:', error)

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to transcribe audio' },
      { status: 500 }
    )
  }
}