# ColorTheoryAssistant-AI

A full-stack AI-powered web application for personal color analysis, providing users with personalized color palettes, clothing, and makeup recommendations based on their unique features. Users can upload a photo or take a quiz to receive instant, tailored results.

---

## Table of Contents

- [Features](#features)
- [Architecture Overview](#architecture-overview)
- [Backend (API)](#backend-api)
  - [Endpoints](#endpoints)
  - [Models Used](#models-used)
  - [Pretrained Models & Weights](#pretrained-models--weights)
  - [Functions of Each Endpoint](#functions-of-each-endpoint)
  - [Memory Optimization](#memory-optimization)
- [Dependencies](#dependencies)
- [Deployment](#deployment)
- [License](#license)
- [How to Run It Locally](#how-to-run-it-locally)

---



---

## Features 


- **AI Color Analysis**: Upload a photo for instant, AI-driven color and undertone analysis.
 ![heroPage](https://github.com/user-attachments/assets/2fc48d9c-4b8d-4bdc-862e-3cc36d6c994a)
   <img width="1350" height="666" alt="Screenshot 2025-07-20 at 9 46 56 PM" src="https://github.com/user-attachments/assets/a71790f6-0129-477a-84ac-285de8b7323f" />


- **Interactive Quiz**: Get your color season and palette without uploading a photo.

  ![newQuiz](https://github.com/user-attachments/assets/81cf0180-d92b-4055-981a-1c1cc434a87a)

  
- **Personalized Palettes**: Receive curated color palettes, clothing, and makeup suggestions.
  ![WhatsApp Image 2025-07-20 at 22 05 21](https://github.com/user-attachments/assets/ecac3b21-7ecf-4529-8017-abec3f35c5fc)

- **Modern UI/UX**: Clean, responsive, and visually appealing interface.
- **Style Assistant**: Chatbot for style recommendations based on your features and preferences.
 ![WhatsApp Image 2025-07-20 at 21 57 08](https://github.com/user-attachments/assets/9bba4b7b-1c07-4bf9-a1d0-d6474cebefc0)
 ![WhatsApp Image 2025-07-20 at 22 00 43](https://github.com/user-attachments/assets/96ffff57-e8b3-4691-9a28-2fca494a47be)
 ![WhatsApp Image 2025-07-20 at 22 01 54](https://github.com/user-attachments/assets/cd840595-5ca9-4274-a2e1-89b9e72895f0)
---


## Architecture Overview 

- **Frontend**: React (Vite), communicates with backend via REST API.
- **Backend**: FastAPI (Python), exposes endpoints for image and quiz analysis, color extraction, and recommendations.
- **AI/ML**: Uses a combination of deep learning models (PyTorch), lightweight color-based segmentation, and LLMs for recommendations.
  <img width="853" height="573" alt="Flowchart" src="https://github.com/user-attachments/assets/0c399f9f-8585-4487-9ddc-5fe7e476a6a3" />

---

## Backend (API)

### Endpoints

| Endpoint                    | Method | Description                                                                  |
| --------------------------- | ------ | ---------------------------------------------------------------------------- |
| `/`                         | GET    | Root endpoint, returns API info and available endpoints.                     |
| `/image`                    | POST   | Upload an image, returns color season and eye color.                         |
| `/lip`                      | POST   | Upload an image, returns dominant lip color and season.                      |
| `/skin`                     | POST   | Upload an image, returns dominant skin color.                                |
| `/hair`                     | POST   | Upload an image, returns dominant hair color.                                |
| `/eye`                      | POST   | Upload an image, returns dominant eye color.                                 |
| `/analyze_features`         | POST   | Upload an image, returns all features (skin, hair, lips, eyes).              |
| `/palette_llm`              | POST   | Upload an image + prompt, returns a palette and recommendations from an LLM. |
| `/quiz_palette_llm`         | POST   | Submit quiz answers, returns palette and recommendations from an LLM.        |
| `/api/style-recommendation` | POST   | Get style recommendations from LLM based on user answers.                    |
| `/api/serpapi-proxy`        | GET    | Proxy to SerpAPI for image search (used for clothing images in frontend).    |

### Models Used

1. **Skin Tone Classification Model**

   - Type: PyTorch ResNet18
   - Purpose: Classifies skin into one of four color seasons (Spring, Summer, Autumn, Winter).
   - Weights: `facer/cp/best_model_resnet_ALL.pth`
   - Used in: `/image` endpoint

2. **Face Detection**

   - Model: RetinaFace (PyTorch)
   - Purpose: Detects faces in images
   - Used in: Feature extraction for skin, hair, eye

3. **Face Parsing**

   - Model: FaRL
   - Purpose: Segments facial regions
   - Used in: `functions.py` for region extraction

4. **Lightweight Face Parser**

   - Purpose: Fast segmentation using color heuristics
   - Used in: Low-memory deployments

5. **LLM (Language Model)**

   - Model: Mistral (via OpenRouter API)
   - Purpose: Generates text-based recommendations
   - Used in: `/palette_llm`, `/quiz_palette_llm`, `/api/style-recommendation`

### Pretrained Models & Weights

- **Skin Model**: `facer/cp/best_model_resnet_ALL.pth`
- **Face Detection**: RetinaFace (mobilenet0.25/ResNet50)
- **Face Parsing**: FaRL JIT model
- **Lightweight Parser**: Heuristic-based, no weights
- **LLM**: Mistral via OpenRouter API

---

## Dependencies

### Backend (see `facer/requirements.txt`)

- fastapi==0.104.1
- uvicorn==0.24.0
- python-multipart==0.0.6
- opencv-python-headless==4.8.1.78
- numpy==1.24.3
- torch==1.13.1
- torchvision==0.14.1
- mediapipe==0.10.7
- requests==2.31.0
- psutil==5.9.6
- Pillow==10.0.1
- scikit-image==0.21.0
- validators==0.22.0
- matplotlib==3.7.2
- python-dotenv==1.0.0
- scikit-learn==1.3.0

### Frontend (see `frontend-in/package.json`)

- react
- axios
- vite

## Deployment

The backend is deployed using **Railway Pro**, ensuring fast and scalable API hosting.  
The frontend is deployed on **Vercel**, offering seamless CI/CD and optimized performance for the React application.

---

---

## License

## Open-Source Attribution

| Name & Version                  | License Type  | Role in Build / How Used                                                              | Source Link                                   |
| ------------------------------- | ------------- | ------------------------------------------------------------------------------------- | --------------------------------------------- |
| fastapi 0.104.1                 | MIT           |  Main backend web API framework.                                                      | https://github.com/tiangolo/fastapi           |
| uvicorn 0.24.0                  | BSD           |  ASGI server for running FastAPI.                                                     | https://github.com/encode/uvicorn             |
| python-multipart 0.0.6          | Apache 2.0    |  Handles file uploads in FastAPI.                                                     | https://github.com/andrew-d/python-multipart  |
| opencv-python-headless 4.8.1.78 | Apache 2.0    |  Image processing for face, skin, hair, and lip region extraction.                    | https://github.com/opencv/opencv-python       |
| numpy 1.24.3                    | BSD           |  Numerical operations, image array manipulation.                                      | https://github.com/numpy/numpy                |
| torch 1.13.1                    | BSD           |  Deep learning framework for model inference and training.                            | https://github.com/pytorch/pytorch            |
| torchvision 0.14.1              | BSD           |  Pretrained models, image transforms.                                                 | https://github.com/pytorch/vision             |
| mediapipe 0.10.7                | Apache 2.0    |  Face/landmark detection.                                                             | https://github.com/google/mediapipe           |
| requests 2.31.0                 | Apache 2.0    |  HTTP requests (calling LLM APIs, SerpAPI, etc.).                                     | https://github.com/psf/requests               |
| psutil 5.9.6                    | BSD           |  System/memory monitoring.                                                            | https://github.com/giampaolo/psutil           |
| Pillow 10.0.1                   | HPND          |  Image file I/O, manipulation.                                                        | https://github.com/python-pillow/Pillow       |
| scikit-image 0.21.0             | BSD           |  Image processing utilities.                                                          | https://github.com/scikit-image/scikit-image  |
| validators 0.22.0               | MIT           |  Input validation.                                                                    | https://github.com/kvesteri/validators        |
| matplotlib 3.7.2                | PSF           |  Plotting, visualization.                                                             | https://github.com/matplotlib/matplotlib      |
| python-dotenv 1.0.0             | BSD           |  Environment variable management.                                                     | https://github.com/theskumar/python-dotenv    |
| scikit-learn 1.3.0              | BSD           |  KMeans clustering for color extraction.                                              | https://github.com/scikit-learn/scikit-learn  |
| React (frontend)                | MIT           |  Frontend UI framework.                                                               | https://github.com/facebook/react             |
| Vite (frontend)                 | MIT           |  Frontend build tool.                                                                 | https://github.com/vitejs/vite                |
| axios (frontend)                | MIT           |  HTTP client for frontend-backend communication.                                      | https://github.com/axios/axios                |
| FaRL                            | MIT           |  Used pretrained model and code for face parsing/segmentation.                        | https://github.com/FacePerceiver/farl         |
| RetinaFace                      | MIT           |  Used pretrained model and code for face detection.                                   | https://github.com/biubug6/Pytorch_Retinaface |
| Mistral LLM (via OpenRouter)    | Various (API) |  Used as an API for generating recommendations (no local code).                       | https://openrouter.ai/                        |
| SerpAPI Python                  | MIT           |  Used for image search for clothing/makeup inspiration.                               | https://github.com/serpapi/serpapi-python     |

---
## Memory Optimization


1. **Image Compression and Resizing**

   - All uploaded images are compressed and resized before processing.
   - Reduces memory footprint for CPU operations.
   - Functions like `compress_uploaded_image` (backend) and `compress_image` (utility) ensure optimal image size.

2. **Lazy Model Loading**

   - The skin tone classification model (`LazySkinModel` in `skin_model.py`) is loaded only when required.
   - Prevents unnecessary memory usage when endpoints are idle.

3. **Garbage Collection**

   - Explicit calls to `gc.collect()` are made after heavy tasks (model inference, temp file handling).
   - Frees memory immediately and helps prevent memory leaks.

4. **Temporary File Cleanup**

   - Temporary files (e.g., `saved.jpg`, `temp.jpg`) are deleted right after use.
   - Prevents disk and memory bloat.

5. **Lightweight Face Parser Option**

   - A fast, heuristic-based parser is available for low-memory deployments.
   - Eliminates the need for large ML models in free or limited cloud plans.

6. **Memory Monitoring (Optional)**

   - Backend includes optional memory tracking via `memory_monitor.py`.
   - Functions like `log_memory_usage`, `optimize_memory`, and `check_memory_limit` assist in runtime optimization.

7. **Reduced Model Input Size**
   - The ResNet skin tone model uses smaller input dimensions (e.g., 160x160 instead of 224x224).
   - This minimizes memory use during inference.

---

## How to Run It Locally
Inside Facer make a cp folder if not already present and add this file after downloading inside the cp folder (download the pre-trained weights link)
---
[Download Full Report (Google Drive)](https://drive.google.com/file/d/1G0WjItKmB0EuZ8mGKSaJNgK6oWqIvvt1/view?usp=sharing)
---
Required details for running the project
---
[Download Full Report (Google Drive)](https://drive.google.com/file/d/11vddcbZ027WEj6Dvw7q9oJGyRgGIoZoQ/view?usp=sharing)
---
You can use a face image like this(jpg-format)
---
![MV5BYjQwYTk3ZWUtNWI4OC00YzYzLWFlZjAtNWFhZmQ0MTgzMWJmXkEyXkFqcGc@ _V1_](https://github.com/user-attachments/assets/c75b6073-6e25-4860-977a-f370a78b7517)

### Clone the Repository

1. **Fork the repository** on GitHub to your own account.
2. **Clone the forked repo** to your local machine:
   ```bash
   git clone https://github.com/your-username/color-theory-assistant-ai.git
   ```
3. Navigate into the project folder:
   ```bash
   cd color-theory-assistant-ai
   ```

---

###  Backend Setup

1. Move into the backend directory:
   ```bash
   cd facer
   ```
2. Install the backend dependencies:
   ```bash
   pip install -r requirements.txt
   ```
3. Run the backend server:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

---

### Frontend Setup

1. Open a new terminal window and navigate to the frontend directory:
   ```bash
   cd frontend-in
   ```
2. Install the frontend dependencies:
   ```bash
   npm install
   ```
3. Start the frontend development server:
   ```bash
   npm run dev
   ```

The frontend will typically run at `http://localhost:5173` and communicate with the backend running on `http://localhost:8000`.
