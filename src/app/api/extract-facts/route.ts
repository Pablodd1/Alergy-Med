import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractionSchema, ExtractionData } from '@/types/schemas'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { getServerSession } from 'next-auth/next'
import { authOptions } from '@/lib/auth'
import { VisitService } from '@/services/visitService'

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('The OPENAI_API_KEY environment variable is missing or empty');
  }
  return new OpenAI({ apiKey });
}

const extractionPrompt = `You are an expert medical AI assistant specializing in allergy and immunology. Your task is to extract structured medical information from clinical notes, patient interviews, and medical documents related to allergy patients.

CRITICAL RULES:
1. NEVER fabricate data that is not explicitly mentioned in the source text
2. If information is unclear, incomplete, or missing, indicate this with "unclear", "unknown", or include it in the "needsConfirmation" field
3. Always include "Needs confirmation / missing data" and "Confidence flags" in your analysis
4. Use clinical reasoning language - avoid definitive statements when data is incomplete
5. Maintain strict patient visit isolation - only extract information from the provided sources

EXTRACTION REQUIREMENTS:
- Extract all relevant allergy history including food, drug, environmental, stinging insects, and latex/other
- Identify atopic comorbidities (asthma, eczema, chronic rhinitis, sinusitis, urticaria/angioedema)
- Extract current medications with doses, frequency, indications, and responses
- Note any relevant past medical, surgical, family, and social history
- Extract review of systems findings
- Identify any relevant physical exam findings
- Extract test results and laboratory data
- Generate assessment candidates based on the evidence
- Create plan candidates with appropriate rationale

JSON OUTPUT SCHEMA:
Your response must be valid JSON matching this exact schema:

{
  "patientAlias": "Patient identifier or initials",
  "visitContext": {
    "date": "Visit date if mentioned",
    "setting": "self|clinic|televisit"
  },
  "chiefComplaint": "Primary reason for visit",
  "hpi": {
    "onset": "When symptoms started",
    "timeline": "Progression of symptoms",
    "frequency": "How often symptoms occur",
    "severity": "Severity description",
    "triggers": ["list of triggers"],
    "relievers": ["list of relievers"],
    "exposures": ["list of exposures"],
    "environment": ["environmental factors"],
    "foodContext": ["food-related context"],
    "medicationContext": ["medication-related context"]
  },
  "allergyHistory": {
    "food": [
      {
        "allergen": "Name of food",
        "reaction": "Type of reaction",
        "severity": "mild|moderate|severe|unknown",
        "timing": "immediate|delayed|unknown",
        "dateOrAge": "When it occurred",
        "treatmentUsed": "Treatment if mentioned",
        "certainty": "confirmed|reported|unclear"
      }
    ],
    "drug": ["same structure as food allergies"],
    "environmental": [
      {
        "allergen": "Environmental allergen",
        "reaction": "Reaction description",
        "seasonality": "Seasonal pattern if any",
        "certainty": "confirmed|reported|unclear"
      }
    ],
    "stingingInsects": ["same structure as food allergies"],
    "latexOther": ["same structure as food allergies"]
  },
  "atopicComorbidities": {
    "asthma": "yes|no|unknown",
    "eczema": "yes|no|unknown",
    "chronicRhinitis": "yes|no|unknown",
    "sinusitis": "yes|no|unknown",
    "urticariaAngioedema": "yes|no|unknown"
  },
  "medications": [
    {
      "name": "Medication name",
      "dose": "Dosage if mentioned",
      "frequency": "Frequency if mentioned",
      "indication": "Reason for medication",
      "response": "Patient response",
      "adverseEffects": "Any side effects"
    }
  ],
  "pmh": ["Past medical history items"],
  "psh": ["Past surgical history items"],
  "fh": ["Family history items"],
  "sh": ["Social history items"],
  "ros": {
    "positives": ["Positive review of systems"],
    "negatives": ["Negative review of systems"]
  },
  "exam": ["Physical exam findings"],
  "testsAndLabs": {
    "allergyTesting": [
      {
        "type": "SPT|sIgE|component|patch|challenge|other",
        "date": "Test date",
        "keyFindings": "Key findings",
        "allergensPositive": ["Positive allergens"],
        "allergensNegative": ["Negative allergens"],
        "confidence": "high|medium|low"
      }
    ],
    "labs": [
      {
        "panel": "Lab panel name",
        "date": "Lab date",
        "abnormalFindings": ["Abnormal findings"],
        "notableNormals": ["Notable normal findings"],
        "confidence": "high|medium|low"
      }
    ],
    "imagingOrOther": [
      {
        "type": "Type of test",
        "date": "Test date",
        "finding": "Key finding",
        "confidence": "high|medium|low"
      }
    ]
  },
  "assessmentCandidates": [
    {
      "problem": "Potential diagnosis/problem",
      "supportingEvidence": ["Evidence supporting this assessment"],
      "confidence": "high|medium|low"
    }
  ],
  "planCandidates": [
    {
      "item": "Plan item",
      "rationale": "Rationale for this plan",
      "priority": "high|medium|low"
    }
  ],
  "needsConfirmation": ["List of items that need confirmation"],
  "sourceQualityFlags": ["Quality flags for source material"]
}

IMPORTANT:
- Use null for missing objects, empty arrays for missing lists
- Be conservative in assessments - indicate uncertainty when appropriate
- Include confidence levels based on source clarity
- Flag any OCR or transcription errors
- Never include patient identifiers (names, DOB, etc.) in extracted data

Now extract the medical information from the following sources:`

export async function POST(request: NextRequest) {
  try {
    const { visitId, sources } = await request.json()

    if (!visitId || !sources || !Array.isArray(sources)) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Get user from session
    const session = await getServerSession(authOptions)
    const userId = session?.user?.id || 'demo-user';

    // Find the visit in database
    const visit = await VisitService.findByVisitId(visitId, userId);
    if (!visit) {
      return NextResponse.json(
        { error: 'Visit not found' },
        { status: 404 }
      )
    }

    // Combine all sources into a single text
    const combinedText = sources
      .map((source: any) => {
        let text = source.content || ''
        if (source.metadata?.filename) {
          text = `[File: ${source.metadata.filename}]\n${text}`
        }
        if (source.metadata?.confidence) {
          text = `[OCR Confidence: ${Math.round(source.metadata.confidence * 100)}%]\n${text}`
        }
        return text
      })
      .join('\n\n---\n\n')

    // Get the JSON schema for the extraction
    const jsonSchema = zodToJsonSchema(extractionSchema)

    // Call OpenAI for extraction
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: extractionPrompt
        },
        {
          role: 'user',
          content: combinedText
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'medical_extraction',
          schema: jsonSchema
        }
      },
      temperature: 0.1, // Low temperature for consistent output
      max_tokens: 4000
    })

    const extractedData = JSON.parse(completion.choices[0].message.content || '{}')

    // Add analysis metadata
    const analysisMetadata = {
      timestamp: new Date().toISOString(),
      sourcesCount: sources.length,
      analysisStatus: 'complete' as string,
      missingFields: [] as string[],
      redFlags: [] as string[]
    }

    // Analyze completeness
    if (!extractedData.patientAlias || extractedData.patientAlias.trim() === '') {
      analysisMetadata.missingFields.push('Patient alias is missing')
      analysisMetadata.analysisStatus = 'incomplete'
    }

    if (!extractedData.chiefComplaint || extractedData.chiefComplaint.trim() === '') {
      analysisMetadata.missingFields.push('Chief complaint is missing')
      analysisMetadata.analysisStatus = 'incomplete'
    }

    // Check for severe allergies
    const allAllergies = [
      ...(extractedData.allergyHistory?.food || []),
      ...(extractedData.allergyHistory?.drug || []),
      ...(extractedData.allergyHistory?.environmental || []),
      ...(extractedData.allergyHistory?.stingingInsects || []),
      ...(extractedData.allergyHistory?.latexOther || [])
    ]

    const hasSevereAllergy = allAllergies.some((allergy: any) =>
      allergy.severity && ['severe', 'life-threatening', 'anaphylaxis'].includes(allergy.severity.toLowerCase())
    )

    if (hasSevereAllergy) {
      analysisMetadata.redFlags.push('⚠️ Severe allergic reaction history identified')
    }

    // Validate the extraction
    const validatedData: ExtractionData = extractionSchema.parse(extractedData)

    // Update the visit in database with extracted data
    const updatedVisit = await VisitService.updateVisitFromExtraction(visitId, userId, validatedData);

    if (!updatedVisit) {
      return NextResponse.json(
        { error: 'Failed to update visit with extracted data' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      ...validatedData,
      analysisMetadata
    })

  } catch (error) {
    console.error('Extraction error:', error)

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (error instanceof Error && error.message.includes('Validation')) {
      return NextResponse.json(
        { error: 'Failed to validate extracted data', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to extract medical information' },
      { status: 500 }
    )
  }
}