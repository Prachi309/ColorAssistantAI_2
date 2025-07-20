#!/usr/bin/env python3
"""
Memory-safe version of functions with explicit memory management
"""

import psutil
import os
import gc
import time
from memory_monitor import log_memory_usage

def get_memory_usage():
    """Get current memory usage in MB"""
    process = psutil.Process(os.getpid())
    return process.memory_info().rss / 1024 / 1024

def memory_safe_get_rgb_codes(path):
    """Memory-safe version of get_rgb_codes with explicit cleanup"""
    
    initial_memory = get_memory_usage()
    print(f"📊 Initial memory: {initial_memory:.2f} MB")
    
    try:
        # Import only when needed
        from functions import compress_image, cleanup_temp_files
        from lightweight_face_parser import LightweightFaceParser
        import torch
        import cv2
        import numpy as np
        
        # Compress image first
        compressed_path = compress_image(path, max_size=600, quality=80)
        
        device = 'cuda' if torch.cuda.is_available() else 'cpu'
        
        # Read and preprocess image
        sample = cv2.imread(compressed_path)
        img = cv2.cvtColor(sample, cv2.COLOR_BGR2RGB)
        
        # Convert to tensor format
        image_tensor = torch.from_numpy(img).float().permute(2, 0, 1).unsqueeze(0) / 255.0
        image_tensor = image_tensor.to(device=device)
        
        # Create lightweight face parser
        face_parser = LightweightFaceParser(device=device)
        
        # Create dummy data structure
        data = {'image_ids': torch.tensor([0])}
        
        # Parse face using lightweight method
        with torch.inference_mode():
            result = face_parser.forward(image_tensor, data)
        
        # Extract lip mask
        seg_logits = result['seg']['logits']
        seg_probs = seg_logits.softmax(dim=1)
        seg_probs = seg_probs.cpu()
        
        # Get lip probability (class 1)
        lip_prob = seg_probs[0, 1]
        binary_mask = (lip_prob >= 0.3).numpy().astype(int)
        
        # Extract RGB codes from lip region
        indices = np.argwhere(binary_mask)
        if len(indices) > 0:
            rgb_codes = img[indices[:, 0], indices[:, 1], :]
        else:
            # Fallback: use lower third of image if no lips detected
            h, w = img.shape[:2]
            lower_region = img[int(h*0.6):, :, :]
            rgb_codes = lower_region.reshape(-1, 3)
        
        # EXPLICIT MEMORY CLEANUP
        print("🧹 Cleaning up memory...")
        
        # Delete all tensors
        del image_tensor, seg_logits, seg_probs, lip_prob, binary_mask, indices
        del face_parser, data, result
        
        # Clear CUDA cache if available
        if torch.cuda.is_available():
            torch.cuda.empty_cache()
            print("✅ CUDA cache cleared")
        
        # Force garbage collection
        gc.collect()
        
        # Log final memory usage
        final_memory = get_memory_usage()
        print(f"📊 Final memory: {final_memory:.2f} MB")
        print(f"📊 Memory change: {final_memory - initial_memory:+.2f} MB")
        
        return rgb_codes
        
    except Exception as e:
        print(f"❌ Error in memory_safe_get_rgb_codes: {e}")
        return np.array([])
    finally:
        # Always cleanup compressed file
        try:
            cleanup_temp_files(compressed_path)
        except:
            pass
        
        # Final cleanup
        gc.collect()
        if torch.cuda.is_available():
            torch.cuda.empty_cache()

if __name__ == "__main__":
    # Test memory safety
    print("🧪 Testing memory-safe functions...")
    
    # Create a test image path (you'll need to provide a real image)
    test_path = "test_image.jpg"  # Replace with actual image path
    
    if os.path.exists(test_path):
        result = memory_safe_get_rgb_codes(test_path)
        print(f"✅ Test completed. Result shape: {result.shape}")
    else:
        print("⚠️  Test image not found. Please provide a test image path.") 