import requests
import json

# Test the backend API
def test_backend():
    url = "https://colortheoryassistant-ai.onrender.com/"
    
    try:
        response = requests.get(url)
        print(f"Backend Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Backend Error: {e}")

# Test OpenRouter API key
def test_openrouter():
    api_key = "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"
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "mistralai/mistral-small-3.2-24b-instruct:free",
        "messages": [{"role": "user", "content": "Hello, test message"}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"OpenRouter Status: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"OpenRouter Error: {e}")

if __name__ == "__main__":
    print("Testing Backend...")
    test_backend()
    print("\nTesting OpenRouter...")
    test_openrouter() 