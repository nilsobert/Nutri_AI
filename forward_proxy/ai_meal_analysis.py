import os
import base64
import io
import json
import logging
from PIL import Image
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()
logger = logging.getLogger("forward_proxy.ai_meal_analysis")

def compress_and_encode_image(image_input, max_size=(1200, 900), quality=90):
    """
    Compress and encode image to base64 string with reduced size.
    image_input can be a file path (str) or bytes/file-like object.
    """
    try:
        # Open image
        if isinstance(image_input, str):
            img = Image.open(image_input)
        else:
            img = Image.open(io.BytesIO(image_input))
            
        with img:
            # Convert to RGB if necessary (removes alpha channel)
            if img.mode in ('RGBA', 'LA', 'P'):
                img = img.convert('RGB')
            
            # Resize if larger than max_size while maintaining aspect ratio
            img.thumbnail(max_size, Image.Resampling.LANCZOS)
            
            # Save to bytes with compression
            buffer = io.BytesIO()
            img.save(buffer, format='JPEG', quality=quality, optimize=True)
            buffer.seek(0)
            
            return base64.b64encode(buffer.getvalue()).decode('utf-8')
    except Exception as e:
        logger.error(f"Error compressing image: {e}")
        raise

async def analyze_meal_image(image_bytes: bytes, text_context: str = None):
    """
    Analyze a meal image using a VLM and return nutritional info.
    """
    client = AsyncOpenAI(
        api_key=os.getenv("OPENAI_API_KEY"),
        base_url=os.getenv("OPENAI_BASE_URL")
    )

    # Compress and encode the image
    base64_image = compress_and_encode_image(image_bytes)

    json_schema_template = """
{
  "success": true,
  "requestId": "img_analysis_...",
  "items": [
    {
      "name": "Grilled Chicken Breast",
      "confidence": 0.9,
      "serving_size_grams": 150,
      "nutrition": {
        "calories": 248,
        "protein_g": 46.5,
        "fat_g": 5.4,
        "carbohydrates_g": 0,
        "sugar_g": 0,
        "fiber_g": 0
      }
    }
  ],
  "errorMessage": null
}
"""

    prompt_text = f"""Analyze the attached meal image and provide a detailed nutritional breakdown. Identify each distinct food item, estimate its weight in grams, and list its core nutritional facts.

Return a JSON object matching this exact schema:
{json_schema_template}

RULES:
- `success`: Set to `true` if food is found, `false` otherwise.
- `requestId`: Generate a unique ID for this analysis.
- `items`: Create one object for *each* distinct food item in the image.
- `confidence`: Your confidence (0.0 to 1.0).
- `serving_size_grams`: Your best estimate of the item's weight in grams.
- `nutrition`: The nutritional info for that *single item*.
- `errorMessage`: Set to a reason if `success` is `false`, otherwise `null`.

Return *only* the JSON object and nothing else."""

    if text_context:
        prompt_text += f"\n\nAdditional Context: {text_context}"

    try:
        response = await client.chat.completions.create(
            model="Qwen2.5-VL-72B-Instruct",
            messages=[
                {
                    "role": "system", 
                    "content": "You are an expert nutrition assistant. Your task is to accurately identify all food items in the provided image, estimate their serving size in grams, and calculate their complete nutritional information. You must respond only with the requested JSON object."
                },
                {
                    "role": "user", 
                    "content": [
                        {
                            "type": "text",
                            "text": prompt_text
                        },
                        {
                            "type": "image_url",
                            "image_url": {
                                "url": f"data:image/jpeg;base64,{base64_image}"
                            }
                        }
                    ]
                }
            ],
            temperature=0.0,
            max_tokens=2048
        )
        
        content = response.choices[0].message.content
        
        # Parse JSON from content
        if "```json" in content:
            content = content.split("```json")[1].split("```")[0].strip()
        elif "```" in content:
            content = content.split("```")[1].split("```")[0].strip()
            
        return json.loads(content)

    except Exception as e:
        logger.error(f"VLM Analysis failed: {e}")
        raise
