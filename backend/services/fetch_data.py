import boto3
import os
from dotenv import load_dotenv
from datetime import datetime
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
    print(f"DynamoDB response item: {item}")
    if item is None:
        print("❌ Item not found in DynamoDB")
        raise ValueError(f"No record found for consultationID={consultation_id}, createdAt={created_at}")
    
    transcript_list = item.get("transcript")
    if transcript_list:
        start_time = datetime.strptime(transcript_list[0].get('timestamp'), "%Y-%m-%dT%H:%M:%S.%f")
        end_time = datetime.strptime(transcript_list[-1].get('timestamp'), "%Y-%m-%dT%H:%M:%S.%f")
        duration_seconds = (end_time - start_time).total_seconds()
    else:
        duration_seconds = 0
    final_transcript = ""
    for transcript in transcript_list:
        final_transcript += transcript.get("text")
        final_transcript += "\n"
    return final_transcript,duration_seconds




