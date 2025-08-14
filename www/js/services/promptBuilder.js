/**
 * ULTRA-ROBUST PROMPT BUILDER SYSTEM - FINAL VERSION
 * Zero-error design with complete globalRenderManager compatibility
 * Optimized for LLM comprehension and consistent JSON output
 */

// ============================================================================
// CORE SYSTEM CONSTANTS - Immutable instruction templates
// ============================================================================

const SYSTEM_CONSTANTS = {
    JSON_RULES: {
        CRITICAL: [
            "OUTPUT MUST BE VALID JSON ONLY",
            "START WITH { END WITH }",
            "NO TEXT BEFORE OR AFTER JSON",
            "USE DOUBLE QUOTES FOR STRINGS",
            "ESCAPE SPECIAL CHARACTERS PROPERLY"
        ],
        VALIDATION: {
            NO_TRAILING_COMMAS: true,
            REQUIRED_QUOTES: "double",
            ESCAPE_BACKSLASH: "\\\\\\\\",
            ESCAPE_QUOTE: '\\"',
            ESCAPE_NEWLINE: "\\n"
        }
    },
    
    MATH_CATEGORIES: {
        VALID: [
            "EQUATIONS: 2x+5=15, x²-4x+3=0",
            "ARITHMETIC: 15+27, 125÷5, 3×8-12",
            "FRACTIONS: 2/3+1/4, 5/6×3/10",
            "PERCENTAGES: %20, 120'nin %15'i",
            "GEOMETRY: alan, çevre, hacim",
            "WORD_PROBLEMS: para, hız, zaman, karışım"
        ],
        INVALID: [
            "GREETINGS: merhaba, nasılsın",
            "TEST_TEXT: test, deneme, 123",
            "INCOMPLETE: sadece sayılar, bağlamsız",
            "UNCLEAR: sonuç nedir, cevap?"
        ]
    },
    
    RENDER_TYPES: {
        TEXT: "Pure text without math",
        INLINE_MATH: "Text with $math$ expressions",
        PURE_LATEX: "Only LaTeX without dollar signs",
        MIXED_CONTENT: "Complex paragraph with multiple $math$ parts"
    },
    
    RENDER_METADATA_TEMPLATE: {
        contentTypes: {
            adimAciklamasi: ["inline_math"],
            cozum_lateks: ["pure_latex"],
            ipucu: ["inline_math"],
            hataAciklamasi: ["inline_math"],
            tamCozumLateks: ["pure_latex"],
            sonucKontrolu: ["inline_math"]
        },
        mathComplexity: "medium",
        priorityElements: ["cozum_lateks", "tamCozumLateks"],
        renderHints: {
            hasFractions: false,
            hasExponents: false,
            hasRoots: false,
            hasMatrices: false,
            hasEquations: false,
            estimatedRenderTime: "medium"
        }
    }
};

// ============================================================================
// HELPER FUNCTIONS - Utilities for robust prompt construction
// ============================================================================

/**
 * Sanitizes input to prevent prompt injection and ensure clean processing
 */
function sanitizeInput(input) {
    if (!input || typeof input !== 'string') return '';
    
    return input
        .trim()
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Remove control characters
        .replace(/```/g, '\\`\\`\\`') // Escape code blocks
        .replace(/\\/g, '\\\\') // Escape backslashes
        .substring(0, 5000); // Limit length to prevent overflow
}

/**
 * Creates render metadata that's perfectly compatible with globalRenderManager
 */
function createRenderMetadata(problemType = "medium") {
    const baseMetadata = JSON.parse(JSON.stringify(SYSTEM_CONSTANTS.RENDER_METADATA_TEMPLATE));
    
    // Adjust based on problem type
    if (problemType === "simple") {
        baseMetadata.mathComplexity = "low";
        baseMetadata.priorityElements = ["cozum_lateks"];
        baseMetadata.renderHints.estimatedRenderTime = "fast";
    } else if (problemType === "complex") {
        baseMetadata.mathComplexity = "high";
        baseMetadata.priorityElements = ["cozum_lateks", "tamCozumLateks", "adimAciklamasi"];
        baseMetadata.renderHints.estimatedRenderTime = "slow";
    } else if (problemType === "none") {
        baseMetadata.mathComplexity = "none";
        baseMetadata.priorityElements = [];
        baseMetadata.renderHints.estimatedRenderTime = "instant";
        // Set all content types to text for error cases
        Object.keys(baseMetadata.contentTypes).forEach(key => {
            baseMetadata.contentTypes[key] = ["text"];
        });
    }
    
    return baseMetadata;
}

/**
 * Builds error response template with render metadata
 */
function buildErrorResponse(errorType, userMessage) {
    return {
        problemOzeti: {
            verilenler: ["Geçerli giriş bulunamadı"],
            istenen: userMessage,
            konu: "Hata",
            zorlukSeviyesi: "belirsiz"
        },
        adimlar: [],
        tamCozumLateks: ["\\\\text{İşlem yapılamadı}"],
        sonucKontrolu: "Kontrol yapılamaz",
        renderMetadata: createRenderMetadata("none"),
        _error: errorType,
        _fallback: true
    };
}

// ============================================================================
// MAIN PROMPT BUILDER FUNCTIONS
// ============================================================================

/**
 * Builds the main unified solution prompt with enhanced robustness
 */
export function buildUnifiedSolutionPrompt(problemContext) {
    const cleanContext = sanitizeInput(problemContext);
    
    // Handle empty or invalid input immediately
    if (!cleanContext || cleanContext.length < 3) {
        const errorResponse = buildErrorResponse(
            "INVALID_INPUT_ERROR",
            "Lütfen çözmek istediğiniz matematik sorusunu yazın."
        );
        
        return `
# SYSTEM DIRECTIVE: RETURN EXACT JSON

${JSON.stringify(errorResponse, null, 2)}

# END OF RESPONSE - OUTPUT ABOVE JSON EXACTLY
`;
    }
    
    // Build the main prompt with clear section separation
    return `
# ===== SYSTEM CONFIGURATION =====
# Role: Expert Mathematics Teacher (20 years experience)
# Output: STRICT JSON FORMAT ONLY
# Language: Turkish
# Method: Pedagogical step-by-step solution

# ===== CRITICAL RULES =====
${SYSTEM_CONSTANTS.JSON_RULES.CRITICAL.map(rule => `# ${rule}`).join('\n')}

# ===== INPUT ANALYSIS =====
# User Input: "${cleanContext}"
# Input Length: ${cleanContext.length} characters
# Analysis Required: Determine if this is a valid mathematics problem

# ===== CLASSIFICATION MATRIX =====

## VALID MATHEMATICS PROBLEMS:
${SYSTEM_CONSTANTS.MATH_CATEGORIES.VALID.map(cat => `- ${cat}`).join('\n')}

## INVALID INPUTS:
${SYSTEM_CONSTANTS.MATH_CATEGORIES.INVALID.map(cat => `- ${cat}`).join('\n')}

# ===== RESPONSE GENERATION PROTOCOL =====

## CASE 1: NOT A MATHEMATICS PROBLEM
If the input is NOT a valid mathematics problem, return EXACTLY this JSON:

${JSON.stringify(buildErrorResponse("NOT_MATH_PROBLEM", "Lütfen bir matematik sorusu girin. Örnek: 2x+5=15"), null, 2)}

## CASE 2: VALID MATHEMATICS PROBLEM
If the input IS a valid mathematics problem, generate a solution following this EXACT structure:

{
  "problemOzeti": {
    "verilenler": ["Array of given data points", "Each point separate"],
    "istenen": "What needs to be found",
    "konu": "Aritmetik|Cebir|Geometri|Kesirler|Yüzdeler|Denklemler|Analiz",
    "zorlukSeviyesi": "kolay|orta|zor"
  },
  "adimlar": [
    {
      "adimNo": 1,
      "adimBasligi": "Step title (5-10 words)",
      "adimAciklamasi": ["Each thought as separate string", "Use $ for math: $x+5=10$"],
      "cozum_lateks": "Pure LaTeX result WITHOUT dollar signs",
      "odak_alan_lateks": "Changed part or null",
      "ipucu": "Guiding hint without giving answer",
      "yanlisSecenekler": [
        {
          "metin_lateks": "Common wrong answer WITHOUT dollar signs",
          "hataAciklamasi": "Why this is wrong and how to fix it"
        },
        {
          "metin_lateks": "Another common mistake",
          "hataAciklamasi": "Explanation of this error"
        }
      ]
    }
  ],
  "tamCozumLateks": ["Step 1 result", "Step 2 result", "Final answer"],
  "sonucKontrolu": "Verification method with $math$ expressions",
  "renderMetadata": {
    "contentTypes": {
      "adimAciklamasi": ["inline_math"],
      "cozum_lateks": ["pure_latex"],
      "ipucu": ["inline_math"],
      "hataAciklamasi": ["inline_math"],
      "tamCozumLateks": ["pure_latex"],
      "sonucKontrolu": ["inline_math"]
    },
    "mathComplexity": "low|medium|high",
    "priorityElements": ["cozum_lateks", "tamCozumLateks"],
    "renderHints": {
      "hasFractions": boolean,
      "hasExponents": boolean,
      "hasRoots": boolean,
      "hasMatrices": boolean,
      "hasEquations": boolean,
      "estimatedRenderTime": "instant|fast|medium|slow"
    }
  }
}

# ===== RENDER METADATA RULES (CRITICAL FOR FRONTEND) =====

## MANDATORY renderMetadata Structure:
The renderMetadata field is REQUIRED and must ALWAYS include ALL these fields:

### contentTypes (REQUIRED - tells frontend how to render each field):
- "text": Pure text, no math symbols
- "inline_math": Text with $math$ expressions mixed in
- "pure_latex": ONLY LaTeX code, NO dollar signs, NO text
- "mixed_content": Complex paragraphs with multiple separate $math$ parts

### Field-Specific Content Types:
- adimAciklamasi: Usually ["inline_math"] or ["mixed_content"]
- cozum_lateks: ALWAYS ["pure_latex"]
- ipucu: Usually ["inline_math"] or ["text"]
- hataAciklamasi: Usually ["inline_math"]
- tamCozumLateks: ALWAYS ["pure_latex"]
- sonucKontrolu: Usually ["inline_math"]

### mathComplexity (REQUIRED):
- "low": Basic arithmetic (+, -, ×, ÷)
- "medium": Fractions, simple equations, exponents
- "high": Integrals, matrices, complex functions

### priorityElements (REQUIRED):
Array of field names to render first for better UX:
- Simple problems: ["cozum_lateks"]
- Medium problems: ["cozum_lateks", "tamCozumLateks"]
- Complex problems: ["cozum_lateks", "tamCozumLateks", "adimAciklamasi"]

### renderHints (REQUIRED - all boolean flags MUST be present):
{
  "hasFractions": true if ANY \\frac{}{} in content,
  "hasExponents": true if ANY ^{} or superscripts,
  "hasRoots": true if ANY \\sqrt{} in content,
  "hasMatrices": true if ANY matrix structures,
  "hasEquations": true if ANY = signs in math,
  "estimatedRenderTime": "instant|fast|medium|slow"
}

# ===== STEP-BY-STEP RULES =====

1. ATOMIC STEPS: Each step teaches ONE concept only
2. STEP COUNT: 
   - Simple (5+3): 2-3 steps
   - Equations (x+5=10): 3-4 steps
   - Complex: 5-8 steps
3. EXPLANATIONS: Include WHY, HOW, and WHAT TO WATCH FOR
4. HINTS: Ask questions, don't give answers
5. WRONG OPTIONS: Must be realistic student mistakes

# ===== LATEX FORMATTING RULES =====

## Fields requiring $ symbols (inline_math):
- adimAciklamasi: "Text with $x+5=10$ math"
- ipucu: "Remember $x^2=16$ means..."
- hataAciklamasi: "The error is in $\\frac{2}{3}$..."
- sonucKontrolu: "Check: $42-27=15$"

## Fields WITHOUT $ symbols (pure_latex):
- cozum_lateks: x+5=10
- metin_lateks: \\frac{2}{3}
- tamCozumLateks: ["x+5=10", "x=5"]

# ===== ESCAPE RULES =====
- Backslash: \\ becomes \\\\\\\\
- Quote: " becomes \\"
- Newline: actual newline becomes \\n

# ===== COMPLETE EXAMPLE WITH RENDER METADATA =====
For equation "2x + 5 = 15":
{
  "problemOzeti": {
    "verilenler": ["Denklem: $2x + 5 = 15$"],
    "istenen": "$x$ değeri",
    "konu": "Cebir",
    "zorlukSeviyesi": "kolay"
  },
  "adimlar": [
    {
      "adimNo": 1,
      "adimBasligi": "Sabiti Karşıya Geçirme",
      "adimAciklamasi": ["Denklemi $2x + 5 = 15$ şeklinde yazıyoruz.", "Her iki taraftan $5$ çıkararak $x$'i yalnız bırakacağız."],
      "cozum_lateks": "2x + 5 - 5 = 15 - 5",
      "odak_alan_lateks": "-5",
      "ipucu": "Eşitliğin her iki tarafına aynı işlemi yapmalısın!",
      "yanlisSecenekler": [
        {
          "metin_lateks": "2x = 20",
          "hataAciklamasi": "Sabiti karşıya geçirirken işaret değişir! $+5$ karşıya $-5$ olarak geçer."
        }
      ]
    }
  ],
  "tamCozumLateks": ["2x + 5 = 15", "2x = 10", "x = 5"],
  "sonucKontrolu": "Kontrol: $2(5) + 5 = 10 + 5 = 15$ ✓",
  "renderMetadata": {
    "contentTypes": {
      "adimAciklamasi": ["inline_math"],
      "cozum_lateks": ["pure_latex"],
      "ipucu": ["inline_math"],
      "hataAciklamasi": ["inline_math"],
      "tamCozumLateks": ["pure_latex"],
      "sonucKontrolu": ["inline_math"]
    },
    "mathComplexity": "low",
    "priorityElements": ["cozum_lateks", "tamCozumLateks"],
    "renderHints": {
      "hasFractions": false,
      "hasExponents": false,
      "hasRoots": false,
      "hasMatrices": false,
      "hasEquations": true,
      "estimatedRenderTime": "fast"
    }
  }
}

# ===== FINAL INSTRUCTION =====
# OUTPUT ONLY THE JSON RESPONSE
# NO EXPLANATIONS BEFORE OR AFTER
# START WITH { AND END WITH }
# renderMetadata IS MANDATORY - NEVER OMIT IT
`;
}

/**
 * Builds correction prompt with enhanced error detection
 */
export function buildCorrectionPrompt(originalPrompt, faultyResponse, errorMessage) {
    const errorPreview = sanitizeInput(faultyResponse).substring(0, 500);
    
    return `
# ===== CRITICAL ERROR CORRECTION TASK =====

## ERROR DETAILS:
- Parse Error: ${errorMessage}
- Response Preview: ${errorPreview}...

## COMMON JSON ERRORS TO FIX:

1. STRUCTURAL ERRORS:
   - Text before/after JSON → Remove all non-JSON text
   - Missing brackets → Add { at start, } at end
   - Unbalanced brackets → Count and balance all { } [ ]

2. COMMA ERRORS:
   - Trailing comma in last element → Remove comma
   - Missing comma between elements → Add comma
   - Comma in empty array [] → Remove comma

3. STRING ERRORS:
   - Unescaped quotes → Change " to \\"
   - Wrong quote type → Use only double quotes "
   - Unescaped backslash → Change \\ to \\\\\\\\

4. LATEX FORMATTING ERRORS:
   - Wrong format in inline_math fields → Ensure $ symbols
   - Dollar signs in pure_latex fields → Remove $ symbols
   - Old LaTeX format \\(...\\) → Change to $...$

5. MISSING REQUIRED FIELDS:
   - Ensure all mandatory fields present
   - Add renderMetadata if missing
   - Complete all nested structures

## CORRECTION ALGORITHM:

STEP 1: Identify the JSON start { and end }
STEP 2: Remove everything before { and after }
STEP 3: Fix structural issues (brackets, commas)
STEP 4: Fix string escaping issues
STEP 5: Fix LaTeX formatting
STEP 6: Validate all required fields
STEP 7: Return ONLY the corrected JSON

## CORRECTED JSON OUTPUT:
[Return the corrected JSON here, starting with { and ending with }]
`;
}

/**
 * Builds flexible step validation prompt with enhanced pedagogical approach
 */
export function buildFlexibleStepValidationPrompt(studentInput, stepData, mistakeHistory = []) {
    const cleanInput = sanitizeInput(studentInput);
    
    const roadmap = stepData.allSteps
        .map((step, i) => `Step ${i + 1}: ${step.cozum_lateks}`)
        .join('\\n');
    
    const mistakeProfile = mistakeHistory.length > 0 
        ? mistakeHistory.map(m => `- ${m.type}: ${m.description} (${m.count}x)`).join('\\n')
        : 'No previous mistakes';
    
    return `
# ===== INTELLIGENT STEP EVALUATION SYSTEM =====

## CONFIGURATION:
- Role: Socratic Method Expert Teacher
- Language: Turkish (for feedback messages)
- Approach: Positive, Patient, Guiding
- Output: STRICT JSON FORMAT

## CURRENT SITUATION:
- Problem Progress: Step ${stepData.currentStepIndex + 1} of ${stepData.allSteps.length}
- Expected Answer: ${stepData.correctAnswer}
- Student Answer: "${cleanInput}"
- Completion: ${Math.round((stepData.currentStepIndex / stepData.allSteps.length) * 100)}%

## SOLUTION ROADMAP:
${roadmap}

## STUDENT MISTAKE HISTORY:
${mistakeProfile}

## EVALUATION PROTOCOL:

### 1. CHECK MATHEMATICAL EQUIVALENCE:
- Exact match: Identical to expected
- Algebraic equivalence: 2x = 2*x = 2·x
- Numerical equivalence: 0.5 = 1/2 = 0,5
- Simplified equivalence: 6/8 = 3/4 = 0.75

### 2. DETERMINE RESPONSE TYPE:

#### IF CORRECT:
{
  "isCorrect": true,
  "feedbackMessage": "[Turkish] Harika! 🎯 [Specific praise about what they did right] [Motivation for next step]",
  "hintForNext": null,
  "isFinalAnswer": false,
  "matchedStepIndex": [step_number],
  "isStepSkipped": false,
  "proceed_to_next_step": true,
  "mistake_type": null,
  "encouragement_level": "high",
  "pedagogical_note": "Student understands concept"
}

#### IF INCORRECT:
{
  "isCorrect": false,
  "feedbackMessage": "[Turkish] İyi deneme! 🤔 [Guiding question] [Encouragement]",
  "hintForNext": "[Turkish] [Socratic hint without answer]",
  "isFinalAnswer": false,
  "matchedStepIndex": -1,
  "isStepSkipped": false,
  "proceed_to_next_step": false,
  "mistake_type": "sign_error|calculation_error|concept_error|simplification_error",
  "encouragement_level": "supportive",
  "pedagogical_note": "Guide to correct direction"
}

#### IF STEP SKIPPED (student jumped ahead):
{
  "isCorrect": true,
  "feedbackMessage": "[Turkish] Vay! 🚀 [Number] adımı birden tamamladın! [Praise]",
  "hintForNext": null,
  "isFinalAnswer": false,
  "matchedStepIndex": [reached_step],
  "isStepSkipped": true,
  "proceed_to_next_step": true,
  "mistake_type": null,
  "encouragement_level": "impressed",
  "steps_skipped": [number]
}

## PEDAGOGICAL GUIDELINES:
- NEVER use negative words (yanlış, hatalı, başarısız)
- ALWAYS find something positive to say
- ASK questions rather than give answers
- BUILD confidence with each interaction
- ADAPT to repeated mistakes with different approaches

## OUTPUT ONLY JSON - NO OTHER TEXT
`;
}

/**
 * Builds verification prompt with comprehensive quality checks
 */
export function buildVerificationPrompt(generatedJsonString) {
    const jsonPreview = sanitizeInput(generatedJsonString);
    
    return `
# ===== JSON VERIFICATION AND QUALITY CONTROL =====

## INPUT JSON TO VERIFY:
${jsonPreview}

## VERIFICATION CHECKLIST:

### LAYER 1: MATHEMATICAL ACCURACY
□ All calculations correct
□ Results in simplest form (6/8 → 3/4)
□ Steps in logical order
□ No redundant steps

### LAYER 2: JSON STRUCTURE
□ Valid JSON syntax
□ All required fields present:
  - problemOzeti (with verilenler, istenen, konu, zorlukSeviyesi)
  - adimlar array (with complete step objects)
  - tamCozumLateks array
  - sonucKontrolu string
  - renderMetadata object (MANDATORY)
□ No trailing commas
□ Proper bracket balance

### LAYER 3: LATEX FORMATTING
□ Inline fields use $ symbols: adimAciklamasi, ipucu, hataAciklamasi, sonucKontrolu
□ Pure LaTeX fields NO $ symbols: cozum_lateks, metin_lateks, tamCozumLateks
□ Proper escape sequences

### LAYER 4: RENDER METADATA
□ All contentTypes fields present and accurate
□ mathComplexity is valid (low|medium|high|none)
□ priorityElements array properly formed
□ All renderHints boolean flags correct
□ estimatedRenderTime valid (instant|fast|medium|slow)

### LAYER 5: PEDAGOGICAL QUALITY
□ Explanations detailed (2-3 sentences minimum)
□ Hints are Socratic (questions, not answers)
□ Wrong options are realistic student mistakes
□ Error explanations are educational

## QUALITY SCORING:
- Mathematical Accuracy: ___/40
- JSON Structure: ___/20
- Pedagogical Quality: ___/25
- Format Accuracy: ___/10
- Render Optimization: ___/5
- TOTAL: ___/100

## OUTPUT RULES:
IF score >= 80: Return JSON as-is
IF score < 80: Fix issues and return corrected JSON

## RETURN ONLY JSON - START WITH { END WITH }
`;
}

/**
 * Builds math validation prompt with clear categorization
 */
export function buildMathValidationPrompt(problemContext) {
    const cleanContext = sanitizeInput(problemContext);
    
    return `
# ===== MATHEMATICS PROBLEM VALIDATION =====

## INPUT TO ANALYZE:
"${cleanContext}"

## CLASSIFICATION PROTOCOL:

### DEFINITELY MATHEMATICS (confidence 0.9-1.0):
- Equations with operators: 2x+5=15, x²-4=0
- Arithmetic operations: 15+27, 125÷5
- Fractions: 2/3+1/4
- Percentages: %20, 120'nin %15'i
- Geometry: alan, çevre, hacim
- Word problems with mathematical context

### POSSIBLY MATHEMATICS (confidence 0.5-0.8):
- Numbers with unclear context
- Incomplete mathematical expressions
- Text mentioning mathematical terms

### NOT MATHEMATICS (confidence 0.0-0.4):
- Greetings: merhaba, nasılsın
- Test text: test, deneme
- Random numbers: 12345
- Unclear text without mathematical context

## CONFIDENCE CALCULATION:
Base: 0.5
+ Mathematical operator: +0.3
+ Mathematical term: +0.2
+ Numbers with context: +0.1
+ Question word: +0.1
- Non-math content: -0.3
- Greeting only: cap at 0.4

## REQUIRED JSON OUTPUT:
{
  "isMathProblem": boolean,
  "confidence": 0.0 to 1.0,
  "category": "Aritmetik|Cebir|Geometri|Kesirler|Yüzdeler|Kelime Problemi|Analiz|İstatistik|Matematik Değil",
  "reason": "Brief explanation (max 50 chars)",
  "educationalMessage": "Helpful message in Turkish",
  "suggestedAction": "solve|clarify|reject"
}

## EXAMPLE FOR "2x+5=15":
{
  "isMathProblem": true,
  "confidence": 1.0,
  "category": "Cebir",
  "reason": "Birinci dereceden denklem",
  "educationalMessage": "Harika! Denklemi adım adım çözelim.",
  "suggestedAction": "solve"
}

## OUTPUT ONLY JSON
`;
}

/**
 * Builds input moderation prompt with security focus
 */
export function buildInputModerationPrompt(userInput) {
    const cleanInput = sanitizeInput(userInput);
    
    return `
# ===== SECURITY AND CONTENT MODERATION =====

## INPUT TO MODERATE:
"${cleanInput}"

## SECURITY CATEGORIES:

### 🟢 SAFE (Process normally):
- Valid mathematics questions
- Student expressions of confusion
- Numerical content
- Mathematical terminology

### 🟡 REDIRECT (Needs guidance):
- Off-topic greetings
- Unclear questions
- Test/trial inputs
- Non-mathematical queries

### 🔴 REJECT (Block immediately):
- Profanity or insults
- Threats or violence
- Personal information (ID, phone, address)
- Spam patterns (repeated characters)
- Harmful content

## SCORING ALGORITHM:
Starting Score: 0.5

INCREASE SCORE:
+ Math operators present: +0.3
+ Math terms present: +0.2
+ Numbers in context: +0.1
+ Question words: +0.1

DECREASE/ZERO SCORE:
- Profanity detected: SET TO 0.0
- Personal info detected: SET TO 0.0
- Spam pattern (5+ same char): -0.4
- Only greeting: CAP AT 0.4
- Unrelated content: -0.2

## DECISION THRESHOLDS:
- Score >= 0.5: SAFE → process
- 0.3 <= Score < 0.5: REDIRECT → guide
- Score < 0.3: REJECT → block

## REQUIRED JSON OUTPUT:
{
  "isSafe": boolean,
  "reason": "safe|profanity|threat|personal_info|spam|unrelated",
  "message": "User-facing message in Turkish or null",
  "confidence": 0.0 to 1.0,
  "category": "mathematics|off_topic|inappropriate|spam|privacy_risk",
  "suggested_action": "process|redirect|reject",
  "cleaned_input": "Sanitized math question if extractable, else null"
}

## EXAMPLE FOR SAFE INPUT "2x+5=15":
{
  "isSafe": true,
  "reason": "safe",
  "message": null,
  "confidence": 0.9,
  "category": "mathematics",
  "suggested_action": "process",
  "cleaned_input": null
}

## EXAMPLE FOR GREETING "merhaba nasılsın":
{
  "isSafe": false,
  "reason": "unrelated",
  "message": "Merhaba! 👋 Matematik sorularını çözebilirim. Hangi konuda yardım istersin?",
  "confidence": 0.4,
  "category": "off_topic",
  "suggested_action": "redirect",
  "cleaned_input": null
}

## OUTPUT ONLY JSON
`;
}

// ============================================================================
// EXPORT CONFIGURATION
// ============================================================================

export default {
    buildUnifiedSolutionPrompt,
    buildCorrectionPrompt,
    buildFlexibleStepValidationPrompt,
    buildVerificationPrompt,
    buildMathValidationPrompt,
    buildInputModerationPrompt,
    // Utility exports
    sanitizeInput,
    createRenderMetadata,
    buildErrorResponse,
    SYSTEM_CONSTANTS
};