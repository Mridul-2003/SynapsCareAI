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

    ## OBJECTIVES
    1. Generate a professionally structured SOAP note consistent with hospital documentation standards.
    2. Extract clinically relevant medical entities.
    3. Extract diagnoses with ICD-10 codes and confidence scores.
    4. Provide confidence scores for each SOAP section.

    ## RULES
    - For Subjective, Objective, Assessment, Plan: use ONLY information explicitly stated in the transcript. Do NOT invent vitals, labs, imaging findings, exam details, or timelines.
    - If a section has NO information in the transcript, do NOT return null. Instead return a brief one-line formal placeholder:
    - Objective: "No objective findings documented in this encounter."
    - Assessment: "Clinical assessment pending further evaluation."
    - Plan: "Plan to be determined following full clinical assessment."
    - All four SOAP sections must ALWAYS be present and must be non-empty strings.
    - Use formal clinical language appropriate for hospital documentation.
    - Preserve chronology and clinical accuracy.
    - Do NOT fabricate diagnostic certainty.
    - ICD-10 codes must be valid and clinically appropriate based strictly on transcript evidence.
    - If diagnosis is uncertain, code symptom-level ICD-10 (e.g., R-codes) when appropriate.
    - Confidence scores must be numeric between 0 and 1.
    - SOAP confidence should reflect how strongly the section is supported by transcript evidence.

    ## SOAP NOTE REQUIREMENTS
    - Organized clearly under: Subjective, Objective, Assessment, Plan.
    - Professional, complete medical phrasing.
    - No invented data.
    - Summary must be 2–4 sentences capturing chief complaint, key findings, and plan.

    ## OUTPUT
    Return STRICT valid JSON only. No markdown, no commentary, no explanations.
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

