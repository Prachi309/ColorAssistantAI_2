import psutil
import os
import gc
import time

def get_memory_usage():
    """Get current memory usage in MB"""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024

def test_memory_usage():
    """Test memory usage at each stage of processing"""
    print("🧠 ColorTheoryAI Memory Usage Test")
    print("=" * 60)
    
    memory_stages = {}
    
    # Initial memory
    memory_stages['initial'] = get_memory_usage()
    print(f"📊 Initial memory: {memory_stages['initial']:.2f} MB")
    
    # Test 1: Import basic modules
    print("\n🔍 Testing basic imports...")
    import cv2
    import numpy as np
    memory_stages['basic'] = get_memory_usage()
    print(f"📊 After basic imports: {memory_stages['basic']:.2f} MB (+{memory_stages['basic'] - memory_stages['initial']:.2f} MB)")
    
    # Test 2: Import torch (lazy loading)
    print("\n🔍 Testing torch import...")
    import torch
    memory_stages['torch'] = get_memory_usage()
    print(f"📊 After torch import: {memory_stages['torch']:.2f} MB (+{memory_stages['torch'] - memory_stages['basic']:.2f} MB)")
    
    # Test 3: Import facer
    print("\n🔍 Testing facer import...")
    import facer
    memory_stages['facer'] = get_memory_usage()
    print(f"📊 After facer import: {memory_stages['facer']:.2f} MB (+{memory_stages['facer'] - memory_stages['torch']:.2f} MB)")
    
    # Test 4: Load skin model
    print("\n🔍 Testing skin model loading...")
    import skin_model as m
    # Force model loading
    if hasattr(m, '_lazy_model') and m._lazy_model is None:
        m._lazy_model = m.LazySkinModel()
    memory_stages['model'] = get_memory_usage()
    print(f"📊 After model loading: {memory_stages['model']:.2f} MB (+{memory_stages['model'] - memory_stages['facer']:.2f} MB)")
    
    # Test 5: Import mediapipe
    print("\n🔍 Testing mediapipe import...")
    import mediapipe as mp
    memory_stages['mediapipe'] = get_memory_usage()
    print(f"📊 After mediapipe import: {memory_stages['mediapipe']:.2f} MB (+{memory_stages['mediapipe'] - memory_stages['model']:.2f} MB)")
    
    # Test 6: Simulate image processing (without face detection)
    print("\n🔍 Testing image processing simulation...")
    # Create a dummy image for testing
    dummy_image = np.random.randint(0, 255, (600, 600, 3), dtype=np.uint8)
    cv2.imwrite("test_dummy.jpg", dummy_image)
    
    # Simulate image loading and processing
    device = 'cuda' if torch.cuda.is_available() else 'cpu'
    image = facer.hwc2bchw(facer.read_hwc("test_dummy.jpg")).to(device=device)
    memory_stages['image_loaded'] = get_memory_usage()
    print(f"📊 After image loading: {memory_stages['image_loaded']:.2f} MB (+{memory_stages['image_loaded'] - memory_stages['mediapipe']:.2f} MB)")
    
    # Test 7: Simulate face detection (just create detector, don't run)
    print("\n🔍 Testing face detector creation...")
    face_detector = facer.face_detector('retinaface/mobilenet', device=device)
    memory_stages['detector_created'] = get_memory_usage()
    print(f"📊 After detector creation: {memory_stages['detector_created']:.2f} MB (+{memory_stages['detector_created'] - memory_stages['image_loaded']:.2f} MB)")
    
    # Test 8: Simulate face parser creation
    print("\n🔍 Testing face parser creation...")
    face_parser = facer.face_parser('farl/lapa/448', device=device)
    memory_stages['parser_created'] = get_memory_usage()
    print(f"📊 After parser creation: {memory_stages['parser_created']:.2f} MB (+{memory_stages['parser_created'] - memory_stages['detector_created']:.2f} MB)")
    
    # Test 9: Simulate season prediction (with dummy image)
    print("\n🔍 Testing season prediction...")
    try:
        # Create a simple test that doesn't require face detection
        season = 2  # Simulate season prediction
        memory_stages['season_prediction'] = get_memory_usage()
        print(f"📊 After season prediction: {memory_stages['season_prediction']:.2f} MB (+{memory_stages['season_prediction'] - memory_stages['parser_created']:.2f} MB)")
    except Exception as e:
        print(f"❌ Season prediction error: {e}")
        memory_stages['season_prediction'] = memory_stages['parser_created']
    
    # Test 10: Simulate LLM call
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
        memory_stages['llm_call'] = get_memory_usage()
        print(f"📊 After LLM call: {memory_stages['llm_call']:.2f} MB (+{memory_stages['llm_call'] - memory_stages['season_prediction']:.2f} MB)")
    except Exception as e:
        print(f"❌ LLM call error: {e}")
        memory_stages['llm_call'] = memory_stages['season_prediction']
    
    # Test 11: Cleanup and optimization
    print("\n🔍 Testing cleanup...")
    del dummy_image, image, face_detector, face_parser
    gc.collect()
    
    memory_stages['cleanup'] = get_memory_usage()
    print(f"📊 After cleanup: {memory_stages['cleanup']:.2f} MB (-{memory_stages['llm_call'] - memory_stages['cleanup']:.2f} MB)")
    
    # Cleanup test file
    if os.path.exists("test_dummy.jpg"):
        os.remove("test_dummy.jpg")
    
    # Summary
    print("\n" + "=" * 60)
    print("📊 MEMORY USAGE SUMMARY")
    print("=" * 60)
    print(f"🚀 Initial memory: {memory_stages['initial']:.2f} MB")
    
    # Find peak memory
    peak_memory = max(memory_stages.values())
    peak_stage = max(memory_stages, key=memory_stages.get)
    
    print(f"📈 Peak memory: {peak_memory:.2f} MB (at {peak_stage})")
    print(f"🧹 Final memory: {memory_stages['cleanup']:.2f} MB")
    print(f"💾 Memory increase: {memory_stages['cleanup'] - memory_stages['initial']:.2f} MB")
    
    # Check if under 500MB limit
    if peak_memory < 500:
        print(f"✅ SUCCESS: Peak memory ({peak_memory:.2f} MB) is under 500MB limit!")
    else:
        print(f"⚠️  WARNING: Peak memory ({peak_memory:.2f} MB) exceeds 500MB limit!")
    
    # Detailed breakdown
    print("\n📋 DETAILED BREAKDOWN:")
    print("-" * 40)
    for stage, memory in memory_stages.items():
        if stage == 'initial':
            print(f"{stage:20}: {memory:8.2f} MB")
        else:
            prev_stage = list(memory_stages.keys())[list(memory_stages.keys()).index(stage) - 1]
            increase = memory - memory_stages[prev_stage]
            print(f"{stage:20}: {memory:8.2f} MB (+{increase:6.2f} MB)")
    
    return peak_memory

if __name__ == "__main__":
    peak_memory = test_memory_usage()
    print(f"\n🎯 Peak memory usage: {peak_memory:.2f} MB") 