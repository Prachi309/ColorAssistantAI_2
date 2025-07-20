import psutil
import os
import gc
import time
from memory_monitor import log_memory_usage, optimize_memory

def get_memory_usage():
    """Get current memory usage in MB"""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024

def test_memory_usage():
    """Test memory usage at each stage of processing"""
    print("🧠 ColorTheoryAI Memory Usage Test")
    print("=" * 60)
    
    # Initial memory
    initial_memory = get_memory_usage()
    print(f"📊 Initial memory: {initial_memory:.2f} MB")
    
    # Test 1: Import basic modules
    print("\n🔍 Testing basic imports...")
    import cv2
    import numpy as np
    basic_memory = get_memory_usage()
    print(f"📊 After basic imports: {basic_memory:.2f} MB (+{basic_memory - initial_memory:.2f} MB)")
    
    # Test 2: Import torch (lazy loading)
    print("\n🔍 Testing torch import...")
    import torch
    torch_memory = get_memory_usage()
    print(f"📊 After torch import: {torch_memory:.2f} MB (+{torch_memory - basic_memory:.2f} MB)")
    
    # Test 3: Import facer
    print("\n🔍 Testing facer import...")
    import facer
    facer_memory = get_memory_usage()
    print(f"📊 After facer import: {facer_memory:.2f} MB (+{facer_memory - torch_memory:.2f} MB)")
    
    # Test 4: Load skin model
    print("\n🔍 Testing skin model loading...")
    import skin_model as m
    # Force model loading
    if hasattr(m, '_lazy_model') and m._lazy_model is None:
        m._lazy_model = m.LazySkinModel()
    model_memory = get_memory_usage()
    print(f"📊 After model loading: {model_memory:.2f} MB (+{model_memory - facer_memory:.2f} MB)")
    
    # Test 5: Import mediapipe
    print("\n🔍 Testing mediapipe import...")
    import mediapipe as mp
    mediapipe_memory = get_memory_usage()
    print(f"📊 After mediapipe import: {mediapipe_memory:.2f} MB (+{mediapipe_memory - model_memory:.2f} MB)")
    
    # Test 6: Simulate image processing
    print("\n🔍 Testing image processing simulation...")
    # Create a dummy image for testing
    dummy_image = np.random.randint(0, 255, (600, 600, 3), dtype=np.uint8)
    cv2.imwrite("test_dummy.jpg", dummy_image)
    
    # Simulate face detection
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    image = facer.hwc2bchw(facer.read_hwc("test_dummy.jpg")).to(device=device)
    face_detector = facer.face_detector('retinaface/mobilenet', device=device)
    
    with torch.inference_mode():
        faces = face_detector(image)
    
    processing_memory = get_memory_usage()
    print(f"📊 After face detection: {processing_memory:.2f} MB (+{processing_memory - mediapipe_memory:.2f} MB)")
    
    # Test 7: Simulate face parsing
    print("\n🔍 Testing face parsing...")
    face_parser = facer.face_parser('farl/lapa/448', device=device)
    with torch.inference_mode():
        faces = face_parser(image, faces)
    
    parsing_memory = get_memory_usage()
    print(f"📊 After face parsing: {parsing_memory:.2f} MB (+{parsing_memory - processing_memory:.2f} MB)")
    
    # Test 8: Simulate season prediction
    print("\n🔍 Testing season prediction...")
    try:
        season = m.get_season("test_dummy.jpg")
        season_memory = get_memory_usage()
        print(f"📊 After season prediction: {season_memory:.2f} MB (+{season_memory - parsing_memory:.2f} MB)")
    except Exception as e:
        print(f"❌ Season prediction error: {e}")
        season_memory = parsing_memory
    
    # Test 9: Simulate LLM call
    print("\n🔍 Testing LLM call simulation...")
    import requests
    
    # Simulate a small LLM request
    api_key = "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"
    url = "https://openrouter.ai/api/v1/chat/completions"
    
    headers = {
        "Authorization": f"Bearer {api_key}",
        "Content-Type": "application/json"
    }
    
    data = {
        "model": "mistralai/mistral-small-3.2-24b-instruct:free",
        "messages": [{"role": "user", "content": "Test message"}]
    }
    
    try:
        response = requests.post(url, headers=headers, json=data)
        llm_memory = get_memory_usage()
        print(f"📊 After LLM call: {llm_memory:.2f} MB (+{llm_memory - season_memory:.2f} MB)")
    except Exception as e:
        print(f"❌ LLM call error: {e}")
        llm_memory = season_memory
    
    # Test 10: Cleanup and optimization
    print("\n🔍 Testing cleanup...")
    del dummy_image, image, faces, face_detector, face_parser
    gc.collect()
    optimize_memory()
    
    cleanup_memory = get_memory_usage()
    print(f"📊 After cleanup: {cleanup_memory:.2f} MB (-{llm_memory - cleanup_memory:.2f} MB)")
    
    # Cleanup test file
    if os.path.exists("test_dummy.jpg"):
        os.remove("test_dummy.jpg")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 MEMORY USAGE SUMMARY")
    print("=" * 60)
    print(f"🚀 Initial memory: {initial_memory:.2f} MB")
    print(f"📈 Peak memory: {max(basic_memory, torch_memory, facer_memory, model_memory, mediapipe_memory, processing_memory, parsing_memory, season_memory, llm_memory):.2f} MB")
    print(f"🧹 Final memory: {cleanup_memory:.2f} MB")
    print(f"💾 Memory increase: {cleanup_memory - initial_memory:.2f} MB")
    
    # Check if under 500MB limit
    peak_memory = max(basic_memory, torch_memory, facer_memory, model_memory, mediapipe_memory, processing_memory, parsing_memory, season_memory, llm_memory)
    if peak_memory < 500:
        print(f"✅ SUCCESS: Peak memory ({peak_memory:.2f} MB) is under 500MB limit!")
    else:
        print(f"⚠️  WARNING: Peak memory ({peak_memory:.2f} MB) exceeds 500MB limit!")
    
    return peak_memory

if __name__ == "__main__":
    peak_memory = test_memory_usage()
    print(f"\n🎯 Peak memory usage: {peak_memory:.2f} MB") 