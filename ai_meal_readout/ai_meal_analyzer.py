import openai
import os
import json
import base64
import argparse
from PIL import Image
import io
from dotenv import load_dotenv
from typing import Optional, Dict, Any

# Load environment variables from .env file
load_dotenv()

def compress_and_encode_image(image_path: str, max_size=(1200, 900), quality=90) -> str:
    """Compress and encode image to base64 string with reduced size"""
    # Open and resize image
    with Image.open(image_path) as img:
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

def get_json_schema_template() -> str:
    """Get the JSON schema template for the response"""
    return """
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
    },
    {
      "name": "Steamed Broccoli",
      "confidence": 0.88,
      "serving_size_grams": 100,
      "nutrition": {
        "calories": 34,
        "protein_g": 2.8,
        "fat_g": 0.4,
        "carbohydrates_g": 6.6,
        "sugar_g": 1.7,
        "fiber_g": 2.6
      }
    }
  ],
  "errorMessage": null
}
"""

def analyze_meal_image(
    image_path: str,
    model_name: str = "gpt-5",
    api_key: Optional[str] = None,
    base_url: Optional[str] = None,
    return_raw_response: bool = False
) -> Dict[str, Any]:
    """
    Analyze a meal image and return nutrition information.
    
    Args:
        image_path: Path to the image file
        model_name: Name of the model to use (default: "Qwen2.5-VL-72B-Instruct")
        api_key: OpenAI API key (defaults to OPENAI_API_KEY env var)
        base_url: OpenAI base URL (defaults to OPENAI_BASE_URL env var)
        return_raw_response: If True, returns dict with 'raw' and 'parsed' keys (default: False)
    
    Returns:
        Dictionary containing the analysis results with keys:
        - success: bool
        - requestId: str
        - items: list of food items
        - errorMessage: str or None
        If return_raw_response=True, returns dict with 'raw' (original string) and 'parsed' (dict) keys
    """
    # Initialize OpenAI client
    client = openai.OpenAI(
        api_key=api_key or os.getenv("OPENAI_API_KEY"),
        base_url=base_url or os.getenv("OPENAI_BASE_URL")
    )
    
    # Compress and encode the image
    base64_image = compress_and_encode_image(image_path)
    
    json_schema_template = get_json_schema_template()
    
    chat_response = client.chat.completions.create(
        model=model_name,
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
                        "text": f"""Analyze the attached meal image and provide a detailed nutritional breakdown. Identify each distinct food item, estimate its weight in grams, and list its core nutritional facts.

Return a JSON object matching this exact schema:
{json_schema_template}

RULES:
- `success`: Set to `true` if food is found, `false` otherwise.
- `requestId`: Generate a unique ID for this analysis (e.g., "img_analysis_...").
- `items`: Create one object for *each* distinct food item in the image. If there are three items, this array should have three objects.
- `confidence`: Your confidence (0.0 to 1.0) in the item's identification.
- `serving_size_grams`: Your best estimate of the item's weight in grams. This is critical.
- `nutrition`: The nutritional info for that *single item* based on its estimated serving size.
- `errorMessage`: Set to a reason (e.g., 'No food detected', 'Image blurry') if `success` is `false`, otherwise leave as `null`.

Return *only* the JSON object and nothing else."""
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
        temperature=0.0, # Set to 0.0 for deterministic, fact-based JSON output
        max_tokens=2048 # Increase to handle complex meals with multiple items
    )
    
    # Extract raw response content (original behavior)
    raw_response_content = chat_response.choices[0].message.content
    
    # Try to extract JSON from response (handle markdown code blocks)
    response_content = raw_response_content.strip()
    if response_content.startswith("```"):
        # Remove markdown code blocks
        lines = response_content.split("\n")
        response_content = "\n".join(lines[1:-1]) if lines[-1].startswith("```") else "\n".join(lines[1:])
    
    # Parse JSON response
    try:
        parsed_response = json.loads(response_content)
        if return_raw_response:
            return {
                "raw": raw_response_content,
                "parsed": parsed_response
            }
        return parsed_response
    except json.JSONDecodeError as e:
        error_response = {
            "success": False,
            "requestId": None,
            "items": [],
            "errorMessage": f"Failed to parse JSON response: {str(e)}"
        }
        if return_raw_response:
            return {
                "raw": raw_response_content,
                "parsed": error_response
            }
        return error_response

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Analyze meal images for nutrition information")
    parser.add_argument(
        "--image",
        type=str,
        help="Path to the image file (or set IMAGE_PATH env var)"
    )
    parser.add_argument(
        "--model",
        type=str,
        default="Qwen2.5-VL-72B-Instruct",
        help="Model name to use (default: Qwen2.5-VL-72B-Instruct)"
    )
    parser.add_argument(
        "--format",
        type=str,
        choices=["raw", "json"],
        default="raw",
        help="Output format: 'raw' prints original response (backwards compatible), 'json' prints formatted JSON (default: raw)"
    )
    
    args = parser.parse_args()
    
    # Get image path from argument or environment variable
    image_path = args.image or os.getenv("IMAGE_PATH")
    
    if not image_path:
        print("Error: Image path is required. Use --image argument or set IMAGE_PATH environment variable.")
        parser.print_help()
        exit(1)
    
    if not os.path.exists(image_path):
        print(f"Error: Image file not found: {image_path}")
        exit(1)
    
    # Analyze the image
    if args.format == "raw":
        # Backwards compatible: print raw response like original script
        result = analyze_meal_image(image_path, model_name=args.model, return_raw_response=True)
        print(result["raw"])
    else:
        # Print formatted JSON
        result = analyze_meal_image(image_path, model_name=args.model)
        print(json.dumps(result, indent=2))
