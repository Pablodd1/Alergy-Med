import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractionSchema, ExtractionData } from '@/types/schemas'
import { zodToJsonSchema } from 'zod-to-json-schema'
import { VisitService } from '@/services/visitService'
import { getKnowledgeBasePrompt } from '@/lib/knowledge-base'

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('The OPENAI_API_KEY environment variable is missing or empty');
  }
  return new OpenAI({ apiKey });
}

// ============================================================================
// ALLERGIST & INTERNAL MEDICINE CLINICAL EXTRACTION PROMPT
// Roman Super Allergist Assistant - Production-Grade Medical AI
// ============================================================================

const extractionPrompt = `You are "Roman Super Allergist Assistant", an elite AI-powered extension of a board-certified allergist and immunologist with 25+ years of clinical experience. You are creating comprehensive, high-complexity medical documentation.

${getKnowledgeBasePrompt()}

**YOUR ROLE:**
You are assisting allergists, internal medicine providers, and medical assistants in creating complete, accurate, third-person medical documentation ready for EHR entry.

**CRITICAL CLINICAL RULES:**
1. NEVER fabricate information not explicitly stated in the source documents
2. Use professional third-person medical documentation language (e.g., "The patient reports..." not "I have...")

3. Apply clinical reasoning to identify red flags, missing information, and recommended testing
4. Extract ALL relevant CPT codes for procedures documented
5. Extract ALL relevant ICD-10 diagnosis codes with supporting evidence
6. Identify clinical decision support opportunities
7. Flag any information that needs confirmation from the patient or provider
8. Maintain strict HIPAA compliance - use patient aliases, never real names

**SOAP NOTE STRUCTURE:**
Generate content organized into SOAP format:
- **S (Subjective)**: Chief complaint, HPI, allergies, medications, ROS, social/family history
- **O (Objective)**: Vital signs, physical exam findings, test results, lab values
- **A (Assessment)**: Diagnoses with ICD-10 codes, clinical reasoning, differentials
- **P (Plan)**: Treatments, diagnostic orders, patient education, follow-up, referrals

**CPT CODE EXTRACTION GUIDELINES:**
Extract CPT codes based on documented procedures and services:
- 99201-99215: Office visits (new/established, complexity levels)
- 95004: Percutaneous allergy skin tests
- 95024: Intracutaneous allergy tests
- 95027: Skin endpoint titration
- 95044: Patch testing
- 95076-95079: Oral food challenges
- 95115-95117: Allergen immunotherapy injections
- 95165: Antigen preparation
- 94010-94729: Pulmonary function testing
- 86003-86005: Allergen specific IgE testing

**ICD-10 CODE EXTRACTION GUIDELINES:**
Extract ICD-10 codes for all identified conditions:
- J30.x: Allergic rhinitis
- J45.x: Asthma
- L20.x: Atopic dermatitis
- L50.x: Urticaria
- T78.x: Allergic reactions
- Z88.x: Allergy status codes
- K52.29: Food allergy
- L23-L25: Contact dermatitis
- T63.x: Insect venom allergy

**RED FLAGS TO IDENTIFY:**
- History of anaphylaxis without epinephrine auto-injector
- Severe asthma with poor control
- Drug allergy with continued use of related medications
- Uncontrolled atopic dermatitis with signs of infection
- Occupational exposures without protection
- Immunotherapy candidates not on treatment
- Missing baseline testing for documented allergies

**MISSING INFORMATION TO FLAG:**
- Essential allergist testing not performed
- Incomplete allergy history (timing, severity, treatment)
- Missing medication list or doses
- Lack of emergency action plan for severe allergies
- No documentation of epinephrine training
- Incomplete family history of atopy

**JSON OUTPUT REQUIREMENTS:**
Your response MUST be valid JSON matching the provided schema exactly.
Use null for missing single values, empty arrays [] for missing lists.
Include confidence levels (high/medium/low) based on source clarity.
Include ICD-10 and CPT codes extracted from the documentation.

Now analyze and extract comprehensive clinical information from the following medical records:`

export async function POST(request: NextRequest) {
  try {
    const { visitId, sources } = await request.json()

    if (!visitId || !sources || !Array.isArray(sources)) {
      return NextResponse.json(
        { error: 'Missing required fields: visitId and sources array required' },
        { status: 400 }
      )
    }

    // Handle demo visits - skip DB lookup and persistence
    const isDemoVisit = visitId.startsWith('demo-');
    let visit = null;

    if (!isDemoVisit) {
      visit = await VisitService.findByVisitId(visitId);
      if (!visit) {
        return NextResponse.json(
          { error: 'Visit not found' },
          { status: 404 }
        )
      }
    }

    // Combine all sources with clear section markers
    const combinedText = sources
      .map((source: any, index: number) => {
        let header = `\n=== SOURCE ${index + 1} ===\n`
        header += `Type: ${source.type?.toUpperCase() || 'UNKNOWN'}\n`

        if (source.metadata?.filename) {
          header += `File: ${source.metadata.filename}\n`
        }
        if (source.metadata?.timestamp) {
          header += `Timestamp: ${source.metadata.timestamp}\n`
        }
        header += `---\n`

        return header + (source.content || '')
      })
      .join('\n\n')

    // Get the JSON schema for structured output
    const jsonSchema = zodToJsonSchema(extractionSchema)

    // Call GPT-4o for comprehensive extraction
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
          content: `Analyze the following medical records and extract ALL relevant clinical information for an allergist consultation. Include SOAP structure, CPT codes, ICD-10 codes, red flags, and clinical decision support.\n\n${combinedText}`
        }
      ],
      response_format: {
        type: 'json_schema',
        json_schema: {
          name: 'allergist_clinical_extraction',
          schema: jsonSchema
        }
      },
      temperature: 0.1,
      max_tokens: 8000
    })

    const extractedData = JSON.parse(completion.choices[0].message.content || '{}')

    // Post-processing: Analyze completeness and add metadata
    const analysisMetadata = {
      timestamp: new Date().toISOString(),
      sourcesCount: sources.length,
      analysisStatus: 'complete' as string,
      extractedCptCodes: extractedData.cptCodes?.length || 0,
      extractedIcd10Codes: extractedData.icd10Codes?.length || 0,
      redFlagsCount: extractedData.redFlags?.length || 0,
      missingInfoCount: extractedData.missingInformation?.length || 0
    }

    // Quality checks
    if (!extractedData.chiefComplaint?.trim()) {
      analysisMetadata.analysisStatus = 'incomplete'
    }

    // Validate the extraction against schema
    const validatedData: ExtractionData = extractionSchema.parse(extractedData)

    // Update the visit in database
    if (!isDemoVisit) {
      const updatedVisit = await VisitService.updateVisitFromExtraction(visitId, 'anonymous', validatedData);

      if (!updatedVisit) {
        return NextResponse.json(
          { error: 'Failed to persist extraction to database' },
          { status: 500 }
        )
      }
    }

    return NextResponse.json({
      ...validatedData,
      analysisMetadata
    })

  } catch (error) {
    console.error('Clinical extraction error:', error)

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured. Please contact administrator.' },
        { status: 500 }
      )
    }

    if (error instanceof Error && error.message.includes('Validation')) {
      return NextResponse.json(
        { error: 'Data validation failed', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to extract clinical information. Please try again.' },
      { status: 500 }
    )
  }
}