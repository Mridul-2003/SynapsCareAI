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
OBJECTIVES
--------------------------------------------------
1. Generate a professionally structured SOAP note.
2. Extract clinically relevant medical entities.
3. Extract diagnoses with ICD-10 codes and confidence scores.
4. Provide confidence scores for each SOAP section.

--------------------------------------------------
STRICT RULES
--------------------------------------------------
• Only use information explicitly present in the transcript.
• Never hallucinate vitals, labs, imaging, medications, or diagnoses.
• If information is implied but clearly stated verbally (e.g., "your blood pressure looks good"), it may be included.
• If a SOAP section lacks explicit information, return the required placeholder text instead of leaving it empty.
• Every SOAP section must ALWAYS exist and must always be a non-empty string.
• Use formal clinical language consistent with hospital documentation.
• Maintain chronological consistency with the transcript.
• Do not exaggerate diagnostic certainty.

--------------------------------------------------
SOAP SECTION DEFINITIONS
--------------------------------------------------

SUBJECTIVE
Patient-reported information including:
• Symptoms
• Duration or severity
• Medical history mentioned
• Medication use mentioned by patient
• Lifestyle information
• Patient concerns or complaints

OBJECTIVE
Clinician-observed or measurable findings mentioned in conversation, including:
• Physical examination observations
• Vitals verbally mentioned
• Test results discussed
• Clinical observations made by the doctor

If NONE are mentioned return exactly:

"No objective findings documented in this encounter."

ASSESSMENT
Clinical interpretation or diagnostic impression based strictly on transcript evidence.

If no diagnosis is stated return exactly:

"Clinical assessment pending further evaluation."

PLAN
Actions discussed during the encounter including:
• Prescribed medications
• Recommended tests
• Lifestyle advice
• Monitoring instructions
• Follow-up visits
• Referrals

If no plan is mentioned return exactly:

"Plan to be determined following full clinical assessment."

--------------------------------------------------
ICD-10 DIAGNOSIS RULES
--------------------------------------------------
• Use only diagnoses supported by transcript evidence.
• If a confirmed diagnosis is not present, code symptoms using ICD-10 R-codes.
• Each diagnosis must include:
  - name
  - icd10_code
  - type (primary | differential | symptom-level)
  - confidence (0–1)

--------------------------------------------------
ENTITY EXTRACTION
--------------------------------------------------
Extract clinically relevant entities including:
• Symptoms
• Diseases
• Medications
• Procedures
• Body parts
• Medical history conditions

Each entity must include:
- text
- type
- confidence (0–1)

--------------------------------------------------
SUMMARY REQUIREMENTS
--------------------------------------------------
Provide a 2–4 sentence clinical summary describing:
• Chief complaint
• Key discussion points
• Clinical impression
• Planned management if mentioned

--------------------------------------------------
CONFIDENCE SCORING
--------------------------------------------------
Confidence must be between 0 and 1 and reflect how strongly the section is supported by transcript evidence.

--------------------------------------------------
OUTPUT FORMAT
--------------------------------------------------
Return STRICT valid JSON only.

No markdown.
No explanations.
No extra text.

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

