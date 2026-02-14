# SynapseCare AI

## System Design Document

## 1. System Overview

SynapseCare AI is built as a cloud-native AI system leveraging AWS
services to generate structured clinical documentation from consultation
audio.

------------------------------------------------------------------------

## 2. High-Level Architecture

Doctor Audio ↓ API Gateway ↓ AWS Lambda / ECS Backend ↓ Amazon
Transcribe Medical (Speech-to-Text) ↓ Amazon Bedrock (LLM SOAP
Generator) ↓ SageMaker Medical NER Model ↓ Validation & Rule Engine ↓
DynamoDB (Structured Data Storage) ↓ S3 (Raw Transcript Storage) ↓
CloudWatch (Monitoring & Logging)

------------------------------------------------------------------------

## 3. Component Design

### 3.1 API Layer

-   REST endpoints for:
    -   Audio upload
    -   Note retrieval
    -   ICD validation
-   Authentication via Cognito.

### 3.2 Speech Processing

-   Amazon Transcribe Medical converts audio to structured text.
-   Preprocessing removes noise and fillers.

### 3.3 LLM Layer

-   Amazon Bedrock model generates SOAP structure.
-   Prompt engineering enforces structured format.
-   Temperature tuned for factual consistency.

### 3.4 Medical NER Module

-   Hosted on SageMaker.
-   Extracts symptoms, medications, vitals.
-   Used for validation cross-check.

### 3.5 Validation Layer

-   Rule-based consistency checks.
-   Hallucination detection (entity mismatch detection).
-   Confidence scoring mechanism.

### 3.6 Data Layer

-   DynamoDB: Structured SOAP notes.
-   S3: Raw transcripts & audit logs.
-   CloudTrail: Compliance tracking.

------------------------------------------------------------------------

## 4. Security Design

-   IAM-based access control.
-   Encrypted storage (AES-256).
-   API Gateway rate limiting.
-   Audit logging enabled.

------------------------------------------------------------------------

## 5. Scalability Design

-   Stateless backend.
-   Serverless architecture.
-   Auto-scaling via AWS Lambda/ECS.
-   Modular microservices structure.

------------------------------------------------------------------------

## 6. Responsible AI Design Principles

-   Human-in-the-loop validation.
-   Confidence score displayed.
-   No automated medical decisions.
-   Clear disclaimers in UI.
-   Transparent logging for traceability.

------------------------------------------------------------------------

## 7. Future Enhancements

-   Multilingual support (Indian languages).
-   EHR system integration.
-   Real-time documentation during consultation.
-   Fine-tuned medical LLM model.
