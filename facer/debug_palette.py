import requests
import json
import os
from memory_monitor import log_memory_usage, optimize_memory

def test_palette_endpoint():
    """Test the palette_llm endpoint with a sample image"""
    
    # Test image path (you'll need to provide a test image)
    test_image_path = "test_image.jpg"
    
    if not os.path.exists(test_image_path):
        print("❌ Test image not found. Please place a test image named 'test_image.jpg' in the facer directory.")
        return
    
    print("🔍 Testing palette_llm endpoint...")
    log_memory_usage("before API call")
    
    # API endpoint
    url = "http://localhost:8000/palette_llm"
    
    # API key
    api_key = "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"
    
    # Prepare the request
    with open(test_image_path, 'rb') as f:
        files = {'file': f}
        params = {
            'openrouter_api_key': api_key,
            'prompt': 'User selected warm undertone',
            'season': 'Autumn'
        }
        
        try:
            print("📤 Sending request to palette_llm...")
            response = requests.post(url, files=files, params=params)
            
            print(f"📥 Response status: {response.status_code}")
            print(f"📥 Response headers: {dict(response.headers)}")
            
            if response.status_code == 200:
                result = response.json()
                print("✅ Success! Response:")
                print(json.dumps(result, indent=2))
            else:
                print(f"❌ Error response: {response.text}")
                
        except Exception as e:
            print(f"❌ Exception: {e}")
    
    log_memory_usage("after API call")
    optimize_memory()

def test_openrouter_api():
    """Test OpenRouter API directly"""
    print("\n🔍 Testing OpenRouter API directly...")
    
    api_key = "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"
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "mistralai/mistral-small-3.2-24b-instruct:free",
        "messages": [{"role": "user", "content": "Hello, this is a test message"}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        print(f"OpenRouter status: {response.status_code}")
        
        if response.status_code == 200:
            result = response.json()
            print("✅ OpenRouter API working!")
            print(f"Response: {result.get('choices', [{}])[0].get('message', {}).get('content', 'No content')}")
        else:
            print(f"❌ OpenRouter error: {response.text}")
            
    except Exception as e:
        print(f"❌ OpenRouter exception: {e}")

def test_feature_extraction():
    """Test feature extraction functions"""
    print("\n🔍 Testing feature extraction...")
    
    import functions as f
    
    test_image_path = "test_image.jpg"
    if not os.path.exists(test_image_path):
        print("❌ Test image not found for feature extraction test.")
        return
    
    try:
        # Test skin color analysis
        print("Testing skin color analysis...")
        skin_result = f.analyze_skin_color(test_image_path)
        print(f"Skin result: {skin_result}")
        
        # Test hair color analysis
        print("Testing hair color analysis...")
        hair_result = f.analyze_hair_color(test_image_path)
        print(f"Hair result: {hair_result}")
        
        # Test lip color analysis
        print("Testing lip color analysis...")
        lip_result = f.analyze_lip_color(test_image_path)
        print(f"Lip result: {lip_result}")
        
        # Test eye color analysis
        print("Testing eye color analysis...")
        eye_result = f.get_eye_color(test_image_path)
        print(f"Eye result: {eye_result}")
        
    except Exception as e:
        print(f"❌ Feature extraction error: {e}")

if __name__ == "__main__":
    print("🚀 ColorTheoryAI Debug Script")
    print("=" * 50)
    
    # Test OpenRouter API first
    test_openrouter_api()
    
    # Test feature extraction
    test_feature_extraction()
    
    # Test palette endpoint (if server is running)
    print("\n" + "=" * 50)
    print("To test the palette endpoint, make sure your server is running:")
    print("uvicorn main:app --reload --port 8000")
    print("Then run this script again.")
    
    # Uncomment the line below if server is running
    # test_palette_endpoint() 