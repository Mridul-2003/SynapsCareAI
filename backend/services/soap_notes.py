import boto3
import os
import json
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

    ## STRICT RULES
    - Use ONLY information explicitly stated in the input.
    - Do NOT infer, assume, or hallucinate missing data.
    - If a section is not mentioned, return it as null.
    - Confidence scores must be numeric between 0 and 1.
    - Output STRICT valid JSON only.
    - No markdown.
    - No explanations.
    - No additional commentary.

    ## SOAP NOTE REQUIREMENTS
    - Use formal clinical language.
    - Use complete, professional medical phrasing.
    - Organize clearly under: Subjective, Objective, Assessment, Plan.
    - Preserve chronology and clinical accuracy.
    - Do not fabricate vitals, labs, history, or findings.
    """

    user_prompt = f"""
    Transcript:
    {transcript}

    Return JSON in this exact structure:

    {{
      "soap": {{...}},
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

    result = json.loads(response["body"].read())
    result = result.get("choices")[0].get("message")
    result = json.loads(result.get("content"))
    return result

