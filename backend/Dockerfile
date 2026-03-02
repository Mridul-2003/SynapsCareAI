FROM python:3.12-slim

# avoid buffering in logs
ENV PYTHONUNBUFFERED=1

WORKDIR /app

# copy dependency list and install
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy the rest of the backend source code
COPY . .

# expose the port used by main.py
EXPOSE 8001

# launch uvicorn when container starts
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8001"]
