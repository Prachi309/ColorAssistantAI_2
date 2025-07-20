# Render Deployment Guide for ColorTheoryAI

## 🚀 Quick Deploy (Recommended: Lightweight Version)

### Option 1: Use Lightweight Face Parser (No Model Downloads)

This approach uses a lightweight color-based face parser that doesn't require downloading heavy ML models.

1. **Deploy to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `facer` directory as the root directory

2. **Environment Variables:**
   ```
   API_KEY=your_openrouter_api_key_here
   ```

3. **Build Command:**
   ```
   pip install -r requirements.txt
   ```

4. **Start Command:**
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

5. **Plan:** Free plan should work (under 500MB memory)

### Option 2: Pre-download Model (Higher Memory Usage)

If you prefer the original ML-based approach:

1. **Deploy to Render:**
   - Go to [Render Dashboard](https://dashboard.render.com/)
   - Click "New +" → "Web Service"
   - Connect your GitHub repository
   - Select the `facer` directory as the root directory

2. **Environment Variables:**
   ```
   API_KEY=your_openrouter_api_key_here
   ```

3. **Build Command:**
   ```
   pip install -r requirements.txt && python download_model.py
   ```

4. **Start Command:**
   ```
   uvicorn main:app --host 0.0.0.0 --port $PORT
   ```

5. **Plan:** Pro plan recommended (1GB memory)

## 🔧 Troubleshooting

### 502 Bad Gateway Error
- Check Render logs for startup errors
- Ensure all environment variables are set
- Verify the start command is correct

### Memory Limit Exceeded
- Use the lightweight face parser (Option 1)
- Upgrade to Pro plan if using original ML models
- Check memory usage in Render logs

### Model Download Issues
- Use the lightweight parser instead
- Or pre-download the model during build

## 📊 Memory Usage Comparison

| Approach | Peak Memory | Render Plan |
|----------|-------------|-------------|
| Lightweight Parser | ~250MB | Free |
| Original ML Models | ~800MB+ | Pro |

## 🎯 Recommended Approach

**Use Option 1 (Lightweight Parser)** for:
- Free Render deployment
- Faster startup times
- Lower memory usage
- No model download issues

The lightweight parser provides good lip color analysis using color-based segmentation instead of heavy ML models. 