import cv2
import numpy as np
from typing import Dict, Any
import torch
import gc

class LightweightFaceParser:
    """Lightweight face parser that uses simple color-based segmentation instead of heavy ML models"""
    
    def __init__(self, device=None):
        self.device = device
        print("✅ Using lightweight face parser (no model download required)")
    
    def parse_lips(self, image):
        """Extract lip region using color-based segmentation"""
        try:
            # Convert to HSV for better color segmentation
            hsv = cv2.cvtColor(image, cv2.COLOR_RGB2HSV)
            
            # Define lip color ranges in HSV
            # Lower lip range (reddish/pinkish)
            lower_lip1 = np.array([0, 50, 50])
            upper_lip1 = np.array([10, 255, 255])
            
            # Upper lip range (darker red)
            lower_lip2 = np.array([170, 50, 50])
            upper_lip2 = np.array([180, 255, 255])
            
            # Create masks for both lip color ranges
            mask1 = cv2.inRange(hsv, lower_lip1, upper_lip1)
            mask2 = cv2.inRange(hsv, lower_lip2, upper_lip2)
            
            # Combine masks
            lip_mask = mask1 + mask2
            
            # Apply morphological operations to clean up the mask
            kernel = np.ones((3,3), np.uint8)
            lip_mask = cv2.morphologyEx(lip_mask, cv2.MORPH_CLOSE, kernel)
            lip_mask = cv2.morphologyEx(lip_mask, cv2.MORPH_OPEN, kernel)
            
            # Find contours and keep only the largest one (likely the lips)
            contours, _ = cv2.findContours(lip_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
            
            if contours:
                # Get the largest contour
                largest_contour = max(contours, key=cv2.contourArea)
                
                # Create a clean mask from the largest contour
                clean_mask = np.zeros_like(lip_mask)
                cv2.fillPoly(clean_mask, [largest_contour], 255)
                
                # Clean up intermediate variables
                del hsv, mask1, mask2, lip_mask, kernel, contours, largest_contour
                return clean_mask
            
            # Clean up intermediate variables
            del hsv, mask1, mask2, lip_mask, kernel, contours
            return lip_mask
            
        except Exception as e:
            print(f"Error in lip parsing: {e}")
            # Return a simple mask covering the lower third of the image
            h, w = image.shape[:2]
            mask = np.zeros((h, w), dtype=np.uint8)
            mask[int(h*0.6):, :] = 255
            return mask
    
    def forward(self, images, data):
        """Forward pass that mimics the FaRL interface"""
        try:
            # Convert tensor to numpy if needed
            if torch.is_tensor(images):
                if images.dim() == 4:  # Batch of images
                    images = images.squeeze(0)  # Take first image
                images = images.permute(1, 2, 0).cpu().numpy()
                images = (images * 255).astype(np.uint8)
            
            # Parse lips
            lip_mask = self.parse_lips(images)
            
            # Convert mask to tensor format expected by the rest of the pipeline
            mask_tensor = torch.from_numpy(lip_mask).float() / 255.0
            mask_tensor = mask_tensor.unsqueeze(0).unsqueeze(0)  # Add batch and channel dims
            
            # Create a simple segmentation output
            # We'll create a binary segmentation: background (0) and lips (1)
            seg_logits = torch.zeros((1, 2, mask_tensor.shape[2], mask_tensor.shape[3]))
            seg_logits[0, 0] = 1 - mask_tensor[0, 0]  # Background
            seg_logits[0, 1] = mask_tensor[0, 0]      # Lips
            
            # Store results in the expected format
            data['seg'] = {
                'logits': seg_logits,
                'label_names': ['background', 'lips']
            }
            
            # Clean up intermediate tensors
            del mask_tensor
            
            return data
            
        except Exception as e:
            print(f"Error in lightweight face parser forward pass: {e}")
            # Return a fallback result
            h, w = images.shape[:2] if hasattr(images, 'shape') else (224, 224)
            seg_logits = torch.zeros((1, 2, h, w))
            seg_logits[0, 0, :, :] = 1  # All background
            data['seg'] = {
                'logits': seg_logits,
                'label_names': ['background', 'lips']
            }
            return data 