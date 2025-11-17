
"""
Test script for self-hosted faster-whisper via HTTP API
"""

import requests
from pathlib import Path
import subprocess

def convert_mp3_to_wav_ffmpeg(mp3_path, wav_path=None):
    """Convert MP3 to WAV using ffmpeg command"""
    if wav_path is None:
        wav_path = Path(mp3_path).with_suffix('.wav')
    
    print(f"Converting {mp3_path} to WAV format...")
    
    cmd = [
        'ffmpeg', '-y',
        '-i', mp3_path,
        '-ar', '16000',
        '-ac', '1',
        '-sample_fmt', 's16',
        str(wav_path)
    ]
    
    try:
        subprocess.run(cmd, check=True, capture_output=True)
        print(f"Converted to: {wav_path}")
        return str(wav_path)
    except subprocess.CalledProcessError as e:
        print(f"Error converting file: {e}")
        raise

def transcribe_audio(audio_file_path, api_url="http://pangolin.7cc.xyz:10303/transcribe", api_key="1234", language="en"):
    """
    Transcribe an audio file using the HTTP API
    
    Args:
        audio_file_path: Path to WAV file
        api_url: Full URL to the transcribe endpoint
        api_key: API key for authentication
        language: Language code
    """
    print(f"Sending request to {api_url}...")
    
    with open(audio_file_path, 'rb') as f:
        response = requests.post(
            api_url,
            headers={"X-API-Key": api_key},
            files={"file": f},
            data={"language": language}
        )
    
    if response.status_code == 200:
        result = response.json()
        print("\n" + "="*60)
        print("TRANSCRIPTION:")
        print("="*60)
        print(result["text"])
        print("="*60)
        print(f"Language: {result['language']}")
        return result["text"]
    else:
        print(f"Error: HTTP {response.status_code}")
        print(response.text)
        return None

def main():
    """Main function"""
    audio_file = "audio.mp3"
    
    if not Path(audio_file).exists():
        print(f"Error: {audio_file} not found!")
        return
    
    # Convert MP3 to WAV
    if audio_file.endswith('.mp3'):
        audio_file = convert_mp3_to_wav_ffmpeg(audio_file)
    
    # Transcribe
    result = transcribe_audio(audio_file)
    
    if result:
        print(f"\n✓ Transcription successful!")
    else:
        print(f"\n✗ Transcription failed!")

if __name__ == "__main__":
    print("Whisper Self-Hosted Test Script (HTTP API)")
    print("="*60)
    main()

