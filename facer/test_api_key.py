import requests

def test_api_key(api_key):
    """Test if an API key is valid"""
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
        print(f"Status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ API Key is valid!")
            print(f"Response: {result.get('choices', [{}])[0].get('message', {}).get('content', 'No content')}")
            return True
        else:
            print(f"❌ API Key error: {response.text}")
            return False
            
    except Exception as e:
        print(f"❌ Exception: {e}")
        return False

if __name__ == "__main__":
    print("🔑 OpenRouter API Key Test")
    print("=" * 40)
    
    # Test current key
    current_key = "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"
    print(f"Testing current key: {current_key[:20]}...")
    test_api_key(current_key)
    
    print("\n" + "=" * 40)
    print("To test a new key, update the script with your new API key.")
    print("Or set it in your .env file:")
    print("api_key=YOUR_NEW_API_KEY") 