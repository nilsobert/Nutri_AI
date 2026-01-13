FROM python:3.11-slim

WORKDIR /app

RUN pip install fastapi uvicorn wyoming python-multipart

COPY http_wrapper.py .

CMD ["python", "http_wrapper.py"]
