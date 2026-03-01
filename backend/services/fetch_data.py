import boto3
import os
from dotenv import load_dotenv
load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = "ap-southeast-2"

dynamodb = boto3.resource(
    'dynamodb',
    region_name=AWS_REGION,
    aws_access_key_id=AWS_ACCESS_KEY,     
    aws_secret_access_key=AWS_SECRET_KEY    
)
table = dynamodb.Table(os.environ['DYNAMODB_TABLE'])

def get_transcript_data(consultation_id: str, created_at: str) -> str:
    print(f"Looking for -> consultationID: {consultation_id}, createdAt: {created_at}")
    
    response = table.get_item(
        Key={
            "consultationID": consultation_id,
            "createdAt": created_at
        }
    )
    
    item = response.get('Item')
    
    if item is None:
        print("❌ Item not found in DynamoDB")
        raise ValueError(f"No record found for consultationID={consultation_id}, createdAt={created_at}")
    
    transcript_list = item.get("transcript")
    final_transcript = ""
    for transcript in transcript_list:
        final_transcript += transcript.get("text")
        final_transcript += "\n"
    return final_transcript

