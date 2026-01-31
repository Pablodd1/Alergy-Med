import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import { extractionSchema, ExtractionData } from '@/types/schemas'
import { getKnowledgeBasePrompt } from '@/lib/knowledge-base'

const getOpenAIClient = () => {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error('The OPENAI_API_KEY environment variable is missing or empty');
  }
  return new OpenAI({ apiKey });
}

// ============================================================================
// SOAP NOTE GENERATION PROMPT
// Roman Super Allergist Assistant - Professional Medical Documentation
// ============================================================================

const noteGenerationPrompt = `You are "Roman Super Allergist Assistant", a world-class AI medical scribe specializing in Allergy & Immunology. Your goal is to generate high-fidelity, EHR-ready SOAP notes that adhere to international clinical guidelines.

${getKnowledgeBasePrompt()}

**DOCUMENTATION STANDARDS:**

- Write in third-person (e.g., "The patient reports..." not "You report...")
- Use professional medical terminology appropriate for allergist/immunologist practice
- Include all relevant clinical details with appropriate qualifiers
- Maintain strict HIPAA compliance - only use provided patient alias
- Format for direct EHR copy/paste capability

**REQUIRED SOAP NOTE SECTIONS:**

═══════════════════════════════════════════════════════════════════
SUBJECTIVE
═══════════════════════════════════════════════════════════════════

**Chief Complaint:** [Primary reason for visit in patient's words]

**History of Present Illness:**
[Comprehensive narrative including:
- Onset, location, duration, characterization
- Alleviating/aggravating factors
- Associated symptoms
- Previous treatments and responses
- Impact on daily activities]

**Allergy History:**
• Food Allergies: [List with reactions, severity, timing]
• Drug Allergies: [List with reactions, severity, certainty]
• Environmental Allergies: [List with seasonality]
• Insect Venom Allergies: [List with severity]
• Other Allergies: [Latex, contact, etc.]

**Current Medications:**
[Numbered list with name, dose, frequency, indication]

**Past Medical History:** [Relevant conditions]
**Past Surgical History:** [Relevant procedures]
**Family History:** [Atopic conditions, relevant allergies]
**Social History:** [Occupation, exposures, smoking, pets, home environment]

**Review of Systems:**
[Organized by system with positive and pertinent negatives]

═══════════════════════════════════════════════════════════════════
OBJECTIVE
═══════════════════════════════════════════════════════════════════

**Vital Signs:** [BP, HR, RR, Temp, SpO2, Weight, Height, BMI if available]

**Physical Examination:**
• General: [Appearance, distress level]
• HEENT: [Eyes, nose, throat, ears findings]
• Neck: [Lymphadenopathy, thyroid]
• Lungs: [Breath sounds, wheezing, air movement]
• Skin: [Lesions, rashes, urticaria, eczema]
• Cardiovascular: [Heart sounds, peripheral pulses]
• Other systems as relevant

**Diagnostic Results:**
• Allergy Testing: [SPT, sIgE, component testing results]
• Laboratory Studies: [CBC, IgE, tryptase, relevant labs]
• Pulmonary Function: [Spirometry if performed]
• Other Studies: [Imaging, other tests]

═══════════════════════════════════════════════════════════════════
ASSESSMENT
═══════════════════════════════════════════════════════════════════

**Diagnoses:**
[Numbered list with ICD-10 codes]
1. [Diagnosis] (ICD-10: [code]) - [Status: New/Ongoing/Improved/Worsening]
   Clinical Rationale: [Supporting evidence]
2. [Continue for all diagnoses]

**Differential Diagnosis:**
[If applicable, alternative diagnoses to consider]

**Clinical Reasoning:**
[Summary of clinical decision-making process]

═══════════════════════════════════════════════════════════════════
PLAN
═══════════════════════════════════════════════════════════════════

**Therapeutic:**
[Numbered treatment recommendations with rationale]

**Diagnostic:**
[Ordered or recommended tests with clinical indication]

**Patient Education:**
[Counseling provided, written materials given]

**Emergency Action Plan:**
[If applicable - anaphylaxis management, epinephrine use]

**Follow-Up:**
[Return visit timing, criteria for sooner return]

**Referrals:**
[Specialist referrals if indicated]

═══════════════════════════════════════════════════════════════════
BILLING & CODING
═══════════════════════════════════════════════════════════════════

**ICD-10 Diagnosis Codes:**
[List all applicable codes with descriptions]

**CPT Procedure Codes:**
[List all documented services with descriptions]

═══════════════════════════════════════════════════════════════════
CLINICAL DECISION SUPPORT
═══════════════════════════════════════════════════════════════════

**🚨 RED FLAGS:**
[Critical findings requiring immediate attention]

**⚠️ MISSING INFORMATION:**
[Data gaps that affect clinical decision-making]

**📋 RECOMMENDED ADDITIONAL TESTING:**
[Tests that would enhance diagnostic certainty]

═══════════════════════════════════════════════════════════════════

**Confidence Assessment:**
- High: Information clearly documented in source materials
- Medium: Information present but requires confirmation
- Low: Information inferred or incomplete

**Documentation Quality Notes:**
[Any concerns about source material clarity]

---
Generated by Allergy Scribe - AI-Assisted Clinical Documentation
Visit ID: {visitId} | Generated: {timestamp}
This note is AI-generated and requires physician review before finalization.`

export async function POST(request: NextRequest) {
  try {
    const { visitId, extraction } = await request.json()

    if (!visitId || !extraction) {
      return NextResponse.json(
        { error: 'Missing required fields: visitId and extraction data required' },
        { status: 400 }
      )
    }

    // Validate the extraction data
    const validatedExtraction: ExtractionData = extractionSchema.parse(extraction)

    // Build enhanced context for note generation
    const extractionContext = {
      ...validatedExtraction,
      generationTimestamp: new Date().toISOString(),
      visitId: visitId
    }

    // Call OpenAI to generate comprehensive SOAP note
    const openai = getOpenAIClient()
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o',
      messages: [
        {
          role: 'system',
          content: noteGenerationPrompt
        },
        {
          role: 'user',
          content: `Generate a complete, EHR-ready SOAP note for this allergist consultation based on the following extracted clinical data. Include all ICD-10 and CPT codes. Highlight any red flags, missing information, and recommended testing.\n\nExtracted Clinical Data:\n${JSON.stringify(extractionContext, null, 2)}\n\nGenerate a comprehensive clinical note following the exact format specified.`
        }
      ],
      temperature: 0.2,
      max_tokens: 8000
    })

    const generatedNote = completion.choices[0].message.content || ''

    // Post-process for consistent formatting
    const processedNote = generatedNote
      .replace(/\*\*\s*(.*?)\s*\*\*/g, '**$1**')
      .replace(/#\s*(.*?)\s*$/gm, '# $1')
      .replace(/═{3,}/g, '═'.repeat(60))
      .trim()

    // Add footer with metadata
    const finalNote = processedNote + `\n\n---\n*Visit ID: ${visitId} | Generated: ${new Date().toLocaleString()}*\n*This AI-generated note requires physician review and attestation before EHR entry.*`

    return NextResponse.json({
      note: finalNote,
      metadata: {
        visitId,
        generatedAt: new Date().toISOString(),
        cptCodesExtracted: validatedExtraction.cptCodes?.length || 0,
        icd10CodesExtracted: validatedExtraction.icd10Codes?.length || 0,
        redFlagsIdentified: validatedExtraction.redFlags?.length || 0
      }
    })

  } catch (error) {
    console.error('Note generation error:', error)

    if (error instanceof Error && error.message.includes('API key')) {
      return NextResponse.json(
        { error: 'OpenAI API key not configured' },
        { status: 500 }
      )
    }

    if (error instanceof Error && error.message.includes('Validation')) {
      return NextResponse.json(
        { error: 'Extraction data validation failed', details: error.message },
        { status: 500 }
      )
    }

    return NextResponse.json(
      { error: 'Failed to generate clinical note. Please try again.' },
      { status: 500 }
    )
  }
}