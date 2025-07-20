#!/usr/bin/env python3
"""
Test script for the lightweight face parser approach
"""

import cv2
import numpy as np
from lightweight_face_parser import LightweightFaceParser

def create_test_image():
    """Create a simple test image with a face-like region"""
    # Create a 224x224 test image
    img = np.ones((224, 224, 3), dtype=np.uint8) * 255  # White background
    
    # Add a face-like region (simple rectangle)
    cv2.rectangle(img, (50, 50), (174, 174), (255, 200, 200), -1)  # Light pink face
    
    # Add lip-like region
    cv2.rectangle(img, (80, 140), (144, 160), (200, 100, 100), -1)  # Reddish lips
    
    return img

def test_lightweight_parser():
    """Test the lightweight face parser"""
    print("🧪 Testing Lightweight Face Parser")
    print("=" * 40)
    
    # Create test image
    test_img = create_test_image()
    
    # Save test image
    cv2.imwrite("test_face.jpg", cv2.cvtColor(test_img, cv2.COLOR_RGB2BGR))
    print("✅ Created test image: test_face.jpg")
    
    # Test lightweight parser
    parser = LightweightFaceParser()
    
    # Convert to tensor format
    import torch
    image_tensor = torch.from_numpy(test_img).float().permute(2, 0, 1).unsqueeze(0) / 255.0
    
    # Create dummy data
    data = {'image_ids': torch.tensor([0])}
    
    # Run parser
    result = parser.forward(image_tensor, data)
    
    # Check results
    seg_logits = result['seg']['logits']
    seg_probs = seg_logits.softmax(dim=1)
    
    print(f"✅ Parser output shape: {seg_logits.shape}")
    print(f"✅ Label names: {result['seg']['label_names']}")
    
    # Get lip mask
    lip_prob = seg_probs[0, 1]  # Lip class
    lip_mask = (lip_prob >= 0.3).numpy().astype(np.uint8) * 255
    
    # Save lip mask
    cv2.imwrite("test_lip_mask.jpg", lip_mask)
    print("✅ Saved lip mask: test_lip_mask.jpg")
    
    # Count lip pixels
    lip_pixels = np.sum(lip_mask > 0)
    print(f"✅ Detected {lip_pixels} lip pixels")
    
    return lip_pixels > 0

if __name__ == "__main__":
    success = test_lightweight_parser()
    if success:
        print("\n🎉 Lightweight parser test PASSED!")
        print("✅ Ready for deployment without heavy model downloads")
    else:
        print("\n⚠️  Lightweight parser test needs adjustment") 