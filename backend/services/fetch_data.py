import boto3
import os
from dotenv import load_dotenv
load_dotenv()

AWS_ACCESS_KEY = os.getenv("AWS_ACCESS_KEY")
AWS_SECRET_KEY = os.getenv("AWS_SECRET_KEY")
AWS_REGION = "ap-southeast-2"

dynbamodb = boto3.resource('dynamodb',region_name=AWS_REGION)
table = dynbamodb.Table(os.environ['DYNAMODB_TABLE'])

def get_transcript_data(consultation_id:str,created_at:str)->dict:

    response = table.get_item(
        Key={
            "consultationID": consultation_id,
            "createdAt": created_at
        }
    )
    response = response.get('Item').get("transcript")
    final_transcript = ""
    for transcript in response:
        final_transcript += transcript.get("text")
        final_transcript +="\n"
    return final_transcript


