import os
import subprocess
import tempfile
import logging
import httpx
import asyncio
from pathlib import Path
from fastapi.concurrency import run_in_threadpool

logger = logging.getLogger("forward_proxy.audio_service")

def convert_to_wav_sync(audio_bytes: bytes, original_filename: str = "audio.tmp") -> bytes:
    """
    Convert audio bytes to WAV format using ffmpeg (Synchronous).
    """
    with tempfile.TemporaryDirectory() as temp_dir:
        input_path = Path(temp_dir) / original_filename
        output_path = Path(temp_dir) / "output.wav"
        
        # Write input file
        with open(input_path, "wb") as f:
            f.write(audio_bytes)
            
        logger.info(f"Converting {original_filename} to WAV...")
        
        cmd = [
            'ffmpeg', '-y',
            '-i', str(input_path),
            '-ar', '16000',
            '-ac', '1',
            '-sample_fmt', 's16',
            str(output_path)
        ]
        
        try:
            # Run ffmpeg
            subprocess.run(cmd, check=True, capture_output=True)
            
            # Read output
            if output_path.exists():
                with open(output_path, "rb") as f:
                    return f.read()
            else:
                raise FileNotFoundError("FFmpeg failed to produce output file")
                
        except subprocess.CalledProcessError as e:
            logger.error(f"FFmpeg error: {e.stderr.decode()}")
            raise RuntimeError(f"Audio conversion failed: {e.stderr.decode()}")

async def transcribe_audio(audio_bytes: bytes, filename: str = "audio.wav") -> str:
    """
    Transcribe audio using the Whisper API.
    Handles conversion to WAV if necessary.
    """
    whisper_url = os.getenv("WHISPER_API_URL", "http://pangolin.7cc.xyz:10303/transcribe")
    whisper_key = os.getenv("WHISPER_API_KEY", "1234")
    
    # Convert to WAV if not already
    if not filename.lower().endswith('.wav'):
        try:
            # Run conversion in threadpool to avoid blocking event loop
            audio_bytes = await run_in_threadpool(convert_to_wav_sync, audio_bytes, filename)
            filename = "audio.wav"
        except Exception as e:
            logger.warning(f"Conversion failed, attempting to send original file: {e}")
            
    headers = {"X-API-Key": whisper_key}
    # MIME type for WAV is audio/wav, but the API might just look at extension or content
    files = {'file': (filename, audio_bytes, 'audio/wav')} 
    
    logger.info(f"Sending audio to Whisper API: {whisper_url}")
    
    async with httpx.AsyncClient() as client:
        response = await client.post(whisper_url, headers=headers, files=files, data={"language": "en"}, timeout=60.0)
        
    if response.status_code == 200:
        result = response.json()
        return result.get("text", "")
    else:
        logger.error(f"Whisper API error: {response.status_code} - {response.text}")
        raise RuntimeError(f"Transcription failed: {response.text}")
