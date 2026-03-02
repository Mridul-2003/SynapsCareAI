FROM python:3.12-slim

ENV PYTHONUNBUFFERED=1

WORKDIR /app

# install dependencies from the shared requirements file
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# copy api package contents
COPY . .

# expose the port used by api.py
EXPOSE 8000

CMD ["uvicorn", "api:socket_app", "--host", "0.0.0.0", "--port", "8000"]
