import openai
import os
from dotenv import load_dotenv

load_dotenv()

client = openai.OpenAI(
    api_key=os.getenv("gen-EC1QZ5IoD4Paw0C6h1z2n1xnxy0RT3NiNL6zTuLsaSocYVQy"),
    base_url=os.getenv("https://llm-server.llmhub.t-systems.net/v2")
)

try:
    # Try to list available models
    models = client.models.list()
    print("Available models:")
    for model in models.data:
        print(f"  - {model.id}")
except Exception as e:
    print(f"Could not list models: {e}")
    print("\nTrying to use gpt-5 anyway...")
    try:
        response = client.chat.completions.create(
            model="gpt-5",
            messages=[{"role": "user", "content": "test"}]
        )
        print("✅ gpt-5 works!")
    except Exception as e2:
        print(f"❌ gpt-5 failed: {e2}")