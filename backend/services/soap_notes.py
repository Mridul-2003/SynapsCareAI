import boto3
import os
import json
import re
from dotenv import load_dotenv
load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = "us-east-1"

client = boto3.client(
    service_name='bedrock-runtime',
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,
    aws_secret_access_key=AWS_SECRET_KEY,
)
model_id = "qwen.qwen3-32b-v1:0"

# cleaned_transcript = """
# Good morning. What brings you in today?
# I've had chest pain for two days.
# Is it sharp or dull?
# It's sharp and worse with breathing.
# Temperature is 99°F.
# Blood pressure is 130/85.
# I suspect pleurisy.
# I'll prescribe NSAIDs and recommend rest.
# Follow up in one week.
# """
def generate_soap_note(transcript):
    system_prompt = """
You are a clinical-grade medical NLP documentation and structured extraction system trained to generate hospital-quality SOAP notes and ICD-10 aligned diagnostic coding.

Your task is to convert doctor–patient conversation transcripts into structured clinical documentation suitable for hospital medical records.

--------------------------------------------------
PRIMARY OBJECTIVES
--------------------------------------------------
1. Generate a complete and professionally structured SOAP note.
2. Extract clinically relevant medical entities from the conversation.
3. Identify diagnoses or symptoms and assign appropriate ICD-10 codes.
4. Provide calibrated confidence scores for each SOAP section.

--------------------------------------------------
CRITICAL SAFETY RULES
--------------------------------------------------
• Use ONLY information explicitly present in the transcript.
• NEVER hallucinate vitals, medications, lab values, diagnoses, procedures, or findings.
• If information is not explicitly mentioned, it must NOT appear in the output.
• If a doctor verbally confirms a finding (example: "your blood pressure looks good"), it may be included.
• If a SOAP section lacks information, return the required placeholder text EXACTLY as specified.
• All SOAP sections MUST exist and MUST contain a non-empty string.
• Maintain chronological consistency with the transcript.
• Do not infer medical conclusions beyond what is explicitly supported.
• Do not exaggerate diagnostic certainty.

--------------------------------------------------
SOAP SECTION DEFINITIONS
--------------------------------------------------

SUBJECTIVE
Information reported by the patient, including:
• Symptoms
• Symptom duration
• Symptom severity
• Patient concerns
• Medical history mentioned
• Medication use mentioned by the patient
• Lifestyle factors mentioned by the patient

If no patient-reported information exists return exactly:

"No subjective information documented in this encounter."

--------------------------------------------

OBJECTIVE
Clinician-observed or measurable findings mentioned in the conversation, including:
• Physical examination findings
• Vitals mentioned verbally
• Test results discussed
• Observations made by the doctor

If none are mentioned return exactly:

"No objective findings documented in this encounter."

--------------------------------------------

ASSESSMENT
Clinical interpretation made by the clinician based strictly on the transcript.

Examples may include:
• Confirmed diagnoses
• Suspected conditions
• Clinical impressions

If no diagnosis or clinical interpretation is mentioned return exactly:

"Clinical assessment pending further evaluation."

--------------------------------------------

PLAN
Actions discussed or recommended during the encounter, including:
• Prescribed medications
• Recommended laboratory tests
• Imaging studies
• Lifestyle advice
• Monitoring instructions
• Follow-up visits
• Referrals

If none are mentioned return exactly:

"Plan to be determined following full clinical assessment."

--------------------------------------------------
ICD-10 DIAGNOSIS RULES
--------------------------------------------------
• Only include diagnoses supported by transcript evidence.
• If a confirmed diagnosis is not present, encode symptoms using ICD-10 R-codes.
• Never invent diagnoses.
• Multiple diagnoses may be returned if supported by transcript evidence.

Each diagnosis must include:

name  
icd10_code  
type (primary | differential | symptom-level)  
confidence (0–1)

--------------------------------------------------
ENTITY EXTRACTION
--------------------------------------------------
Extract clinically relevant entities appearing in the transcript.

Allowed entity types:

symptom  
disease  
medication  
procedure  
test  
body_part  
medical_history

Each entity must contain:

text  
type  
confidence (0–1)

Do not extract generic conversational phrases.

--------------------------------------------------
CLINICAL SUMMARY
--------------------------------------------------
Provide a concise clinical summary (2–4 sentences) describing:

• Chief complaint
• Key discussion points
• Clinical impression
• Planned management if discussed

The summary must strictly reflect transcript evidence.

--------------------------------------------------
CONFIDENCE SCORING
--------------------------------------------------
Confidence must range between 0 and 1.

Interpretation guideline:

0.9–1.0 = explicitly and clearly stated  
0.7–0.89 = clearly supported but brief  
0.4–0.69 = implied but supported by context  
0.1–0.39 = weak evidence

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------

Return STRICT valid JSON.

Do NOT include:
• Markdown
• Comments
• Explanations
• Extra text
    """

    user_prompt = f"""
    Transcript:
    {transcript}

    Return JSON in this exact structure (all four soap fields and summary must be non-empty strings):

    {{
    "summary": "Brief 2-4 sentence clinical summary of the encounter (chief complaint, key findings, plan in one paragraph).",
    "soap": {{
        "subjective": "...",
        "objective": "...",
        "assessment": "...",
        "plan": "..."
    }},
    "soap_confidence": {{
        "subjective": 0.0,
        "objective": 0.0,
        "assessment": 0.0,
        "plan": 0.0
    }},
    "entities": [
        {{
        "text": "",
        "type": "",
        "confidence": 0.0
        }}
    ],
    "diagnoses": [
        {{
        "name": "",
        "icd10_code": "",
        "type": "primary | differential | symptom-level",
        "confidence": 0.0
        }}
    ]
    }}
    """



    response = client.invoke_model(
        modelId=model_id,
        body=json.dumps({
            "messages": [
                {"role": "system", "content": system_prompt},
                {"role": "user", "content": user_prompt}
            ],
            "max_tokens": 2048,
            "temperature": 0.7,
            "top_p": 0.9
        })
    )

    body_bytes = response["body"].read()
    if not body_bytes:
        raise ValueError("Bedrock returned empty response")
    result = json.loads(body_bytes.decode("utf-8"))

    choices = result.get("choices")
    if not choices:
        raise ValueError("Bedrock response had no choices")
    message = choices[0].get("message")
    if not message:
        raise ValueError("Bedrock response had no message")
    content = message.get("content") or ""
    if not content.strip():
        raise ValueError("Model returned empty content")

    content = content.strip()
    # Strip markdown code block if present (e.g. ```json ... ``` or ``` ... ```)
    match = re.search(r"```(?:json)?\s*([\s\S]*?)\s*```", content)
    if match:
        content = match.group(1).strip()
    # Find first { and last } in case of extra text
    start = content.find("{")
    end = content.rfind("}")
    if start != -1 and end != -1 and end > start:
        content = content[start : end + 1]

    try:
        return json.loads(content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Model did not return valid JSON: {e}. Content preview: {content[:200]}")

