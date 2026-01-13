#!/usr/bin/env python3
"""
HTTP wrapper for Wyoming Whisper with API key authentication
"""

from fastapi import FastAPI, HTTPException, Header, UploadFile, File
from fastapi.responses import JSONResponse
import asyncio
import wave
import io
import os
from wyoming.client import AsyncTcpClient
from wyoming.audio import AudioChunk, AudioStart, AudioStop
from wyoming.asr import Transcribe, Transcript

app = FastAPI()

# Configuration
API_KEY = os.getenv("WHISPER_API_KEY", "lalalalal")
WHISPER_HOST = os.getenv("WHISPER_HOST", "127.0.0.1")
WHISPER_PORT = int(os.getenv("WHISPER_PORT", "10300"))

async def transcribe_audio_bytes(audio_bytes: bytes, language: str = "en"):
    """Transcribe audio using Wyoming protocol"""
    client = AsyncTcpClient(WHISPER_HOST, WHISPER_PORT)
    await client.connect()
    
    try:
        # Open WAV from bytes
        with wave.open(io.BytesIO(audio_bytes), 'rb') as wav_file:
            rate = wav_file.getframerate()
            width = wav_file.getsampwidth()
            channels = wav_file.getnchannels()
            
            # Start transcription
            await client.write_event(Transcribe(language=language).event())
            await client.write_event(
                AudioStart(rate=rate, width=width, channels=channels).event()
            )
            
            # Send audio
            chunk_size = 1024
            while True:
                chunk = wav_file.readframes(chunk_size)
                if not chunk:
                    break
                await client.write_event(
                    AudioChunk(audio=chunk, rate=rate, width=width, channels=channels).event()
                )
            
            await client.write_event(AudioStop().event())
            
            # Get transcription
            while True:
                event = await client.read_event()
                if event is None:
                    break
                if Transcript.is_type(event.type):
                    transcript = Transcript.from_event(event)
                    return transcript.text
    finally:
        await client.disconnect()
    
    return None

def verify_api_key(x_api_key: str = Header(None)):
    """Verify API key from header"""
    if x_api_key != API_KEY:
        raise HTTPException(status_code=401, detail="Invalid API key")
    return x_api_key

@app.post("/transcribe")
async def transcribe(
    file: UploadFile = File(...),
    language: str = "en",
    api_key: str = Header(None, alias="X-API-Key")
):
    """
    Transcribe audio file
    
    Headers:
        X-API-Key: Your secret API key
    
    Body:
        file: Audio file (WAV, MP3, etc.)
        language: Language code (default: en)
    """
    # Verify API key
    verify_api_key(api_key)
    
    # Read file
    audio_bytes = await file.read()
    
    # Convert to WAV if needed (simple check)
    if not file.filename.endswith('.wav'):
        # You'd need to add conversion here
        # For now, require WAV files
        raise HTTPException(
            status_code=400, 
            detail="Please upload WAV files (16kHz, mono, 16-bit recommended)"
        )
    
    # Transcribe
    try:
        text = await transcribe_audio_bytes(audio_bytes, language)
        
        if text is None:
            raise HTTPException(status_code=500, detail="Transcription failed")
        
        return {"text": text, "language": language}
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
async def health():
    """Health check endpoint (no auth required)"""
    return {"status": "ok"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
