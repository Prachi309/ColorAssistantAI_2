#!/usr/bin/env python3
"""
Script to pre-download the face parsing model to avoid runtime memory issues.
Run this script before deployment to ensure the model is available locally.
"""

import os
import requests
import torch
from pathlib import Path

def download_model():
    """Download the face parsing model to local cache"""
    
    # Model URL and local path
    model_url = "https://github.com/FacePerceiver/facer/releases/download/models-v1/face_parsing.farl.lapa.main_ema_136500_jit191.pt"
    
    # Get torch cache directory
    cache_dir = torch.hub.get_dir()
    model_dir = Path(cache_dir) / "checkpoints"
    model_dir.mkdir(parents=True, exist_ok=True)
    
    model_path = model_dir / "face_parsing.farl.lapa.main_ema_136500_jit191.pt"
    
    print(f"🔍 Checking if model exists at: {model_path}")
    
    if model_path.exists():
        print(f"✅ Model already exists at {model_path}")
        print(f"📊 File size: {model_path.stat().st_size / (1024*1024):.2f} MB")
        return str(model_path)
    
    print(f"📥 Downloading model from: {model_url}")
    print(f"📁 Saving to: {model_path}")
    
    try:
        # Download with progress
        response = requests.get(model_url, stream=True)
        response.raise_for_status()
        
        total_size = int(response.headers.get('content-length', 0))
        downloaded = 0
        
        with open(model_path, 'wb') as f:
            for chunk in response.iter_content(chunk_size=8192):
                if chunk:
                    f.write(chunk)
                    downloaded += len(chunk)
                    if total_size > 0:
                        progress = (downloaded / total_size) * 100
                        print(f"\r📥 Download progress: {progress:.1f}%", end='', flush=True)
        
        print(f"\n✅ Model downloaded successfully!")
        print(f"📊 File size: {model_path.stat().st_size / (1024*1024):.2f} MB")
        
        return str(model_path)
        
    except Exception as e:
        print(f"\n❌ Error downloading model: {e}")
        if model_path.exists():
            model_path.unlink()  # Remove partial download
        return None

def verify_model():
    """Verify the downloaded model can be loaded"""
    try:
        import facer
        print("🔍 Testing model loading...")
        
        # Try to load the face parser
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        face_parser = facer.face_parser('farl/lapa/448', device=device)
        
        print("✅ Model loaded successfully!")
        return True
        
    except Exception as e:
        print(f"❌ Error loading model: {e}")
        return False

if __name__ == "__main__":
    print("🚀 ColorTheoryAI Model Downloader")
    print("=" * 50)
    
    # Download the model
    model_path = download_model()
    
    if model_path:
        print(f"\n🔍 Verifying model...")
        if verify_model():
            print("\n🎉 Model download and verification completed successfully!")
            print("✅ You can now deploy without runtime model downloads.")
        else:
            print("\n⚠️  Model verification failed. You may need to use the lightweight parser.")
    else:
        print("\n❌ Model download failed. Consider using the lightweight parser instead.") 