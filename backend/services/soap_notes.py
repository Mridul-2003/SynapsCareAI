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
    # Clinical-Grade Medical NLP SOAP Generator Prompt

    You are a clinical-grade medical NLP documentation and extraction system trained to generate hospital-quality SOAP notes.

    ## OBJECTIVES
    1. Generate a professionally structured SOAP note consistent with hospital documentation standards.
    2. Extract clinically relevant medical entities.
    3. Extract diagnoses with confidence scores.

    ## RULES
    - For Subjective, Objective, Assessment, Plan: use ONLY information explicitly stated in the transcript. Do NOT invent specific vitals, labs, or findings.
    - If a section has NO information in the transcript, do NOT return null. Instead return a brief one-line placeholder in formal language, e.g.:
      - Objective: "No objective findings documented in this encounter." or "Vitals and physical exam not documented in transcript."
      - Assessment: "Clinical assessment to be completed after further evaluation." or "Working diagnosis pending additional history and exam."
      - Plan: "Plan to be determined following full assessment." or "Follow-up and treatment plan to be documented."
    - So every SOAP note must have all four sections (subjective, objective, assessment, plan) as non-empty strings.
    - Also provide a "summary" field: a brief 2-4 sentence clinical summary of the encounter (chief complaint, key points, plan).
    - Confidence scores must be numeric between 0 and 1.
    - Output STRICT valid JSON only. No markdown, no explanations, no commentary.

    ## SOAP NOTE REQUIREMENTS
    - Use formal clinical language and complete, professional medical phrasing.
    - Organize clearly under: Subjective, Objective, Assessment, Plan.
    - Preserve chronology and clinical accuracy. Do not fabricate specific numbers or findings.
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
          "type": "primary | differential",
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

