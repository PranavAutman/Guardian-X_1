// app.js - Guardian X: MediaPipe Face Mesh + face-api.js Emotion Recognition + AI Integration

class GuardianAI {
  constructor() {
    this.apiKey = '';
    this.modelName = "gemini-1.5";
    this.temperature = 0.7;
    this.maxTokens = 512;
    this.systemPrompt = `You are Guardian X, an advanced AI assistant with integrated environment sensors, face landmarks tracking, and emotion recognition. Respond precisely incorporating detected emotions and facial data.`;
    this.conversationHistory = [];
    this.loadApiKey();
  }
  
  loadApiKey() {
    try {
      const stored = localStorage.getItem('guardianX_api_key');
      if (stored) this.apiKey = stored;
    } catch {}
  }

  saveApiKey(key) {
    this.apiKey = key;
    localStorage.setItem('guardianX_api_key', key);
  }

  async queryAI(prompt) {
    if (!this.apiKey.trim()) throw new Error("API key is missing.");

    const requestPayload = {
      model: 'gpt-4o-mini',
      messages: [
        {role: 'system', content: this.systemPrompt},
        {role: 'user', content: prompt}
      ],
      temperature: this.temperature,
      max_tokens: this.maxTokens
    };

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: "POST",
      headers: {
        'Authorization': `Bearer ${this.apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(requestPayload)
    });

    if (!response.ok) {
      const err = await response.json();
      throw new Error(err.error?.message || 'AI response error');
    }

    const data = await response.json();
    return data.choices?.[0].message.content.trim() || '';
  }

  async getResponse(userQuery, emotLabels, faceCount, detCount, mode) {
    const emotionSummary = emotLabels.length ? emotLabels.join(', ') : 'neutral';
    const prompt = `Mission Mode: ${mode}.
    There are ${detCount} objects detected and ${faceCount} faces tracked.
    Current facial emotions: ${emotionSummary}.
    User asked: "${userQuery}"
    Provide thoughtful, concise, and context-aware answer reflecting emotions and observations.`;

    return await this.queryAI(prompt);
  }
}

class GuardianXApp {
  constructor() {
    this.ai = new GuardianAI();
    this.mode = "POLICING";
    this.videoElem = null;
    this.canvas = null;
    this.ctx = null;
    this.mediaPipeLandmarker = null;
    this.faceApiModelLoaded = false;
    this.detectedEmotions = [];
    this.faceLandmarks = [];
    this.detectedObjects = [];
    this.streaming = false;

    this.init();
  }

  async init() {
    this.videoElem = document.getElementById('cameraVideo');
    this.canvas = document.getElementById('detectionCanvas');
    this.ctx = this.canvas.getContext('2d');

    await this.loadModels();
    this.setupUI();
    await this.startCamera();
    this.processFrames();
  }

  async loadModels() {
    // Load TensorFlow.js face-api models
    await faceapi.nets.tinyFaceDetector.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
    await faceapi.nets.faceExpressionNet.loadFromUri('https://cdn.jsdelivr.net/npm/@vladmandic/face-api/model/');
    this.faceApiModelLoaded = true;

    // Load MediaPipe Face Landmarker
    const { FaceLandmarker, FilesetResolver } = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
    const resolver = await FilesetResolver.forVisionTasks('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm');
    this.mediaPipeLandmarker = await FaceLandmarker.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath: 'https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task',
        delegate: 'GPU',
      },
      runningMode: 'video',
      numFaces: 5,
      outputFaceBlendshapes: false,
    });
    console.log('MediaPipe face landmarker loaded');
  }

  setupUI() {
    // Example: Mode buttons to switch mode, and API key inputs
    document.getElementById('saveApiKey').onclick = () => {
      const keyInput = document.getElementById('apiKeyInput');
      if (keyInput && keyInput.value.trim()) {
        this.ai.saveApiKey(keyInput.value.trim());
        alert('API Key saved!');
      }
    };

    document.querySelectorAll('.mission-btn').forEach(btn => {
      btn.onclick = e => {
        this.mode = e.target.getAttribute('data-mode') || 'POLICING';
        this.updateModeUI();
      };
    });

    this.updateModeUI();
  }

  updateModeUI() {
    document.querySelectorAll('.mission-btn').forEach(btn => {
      if (btn.getAttribute('data-mode') === this.mode) btn.classList.add('active');
      else btn.classList.remove('active');
    });
    const modeLabel = document.getElementById('modeLabel');
    if (modeLabel) modeLabel.textContent = this.mode;
  }

  async startCamera() {
    try {
      this.streaming = false;
      const stream = await navigator.mediaDevices.getUserMedia({video: { width: 640, height: 480, facingMode: 'user' }, audio: false});
      this.videoElem.srcObject = stream;
      await this.videoElem.play();
      this.canvas.width = this.videoElem.videoWidth;
      this.canvas.height = this.videoElem.videoHeight;
      this.streaming = true;
    } catch (e) {
      console.error('Camera access error:', e);
      alert('Camera access denied or unavailable.');
    }
  }

  async processFrames() {
    if (!this.streaming) return;
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.ctx.drawImage(this.videoElem, 0, 0, this.canvas.width, this.canvas.height);

    // Detect objects using coco SSD - optional: implement if desired

    // MediaPipe Face Landmarks for tracking
    if (this.mediaPipeLandmarker) {
      try {
        const mpResults = this.mediaPipeLandmarker.detect(this.videoElem);
        if (mpResults && mpResults.faceLandmarks) {
          this.faceLandmarks = mpResults.faceLandmarks;
          this.drawFaceLandmarks(this.faceLandmarks);
        } else {
          this.faceLandmarks = [];
        }
      } catch (e) {
        console.warn('MediaPipe detection failed:', e);
      }
    }

    // face-api expression detection
    if (this.faceApiModelLoaded) {
      try {
        const detections = await faceapi
          .detectAllFaces(this.videoElem, new faceapi.TinyFaceDetectorOptions())
          .withFaceExpressions();

        this.detectedEmotions = detections.map(det => {
          const exp = det.expressions;
          const maxEmotion = Object.entries(exp).reduce((a, b) => (b[1] > a[1] ? b : a));
          return `${maxEmotion[0]} (${(maxEmotion[1] * 100).toFixed(0)}%)`;
        });

        // Draw face-api bounding boxes and emotion label
        detections.forEach(det => {
          const box = det.detection.box;
          this.ctx.strokeStyle = 'lime';
          this.ctx.lineWidth = 2;
          this.ctx.strokeRect(box.x, box.y, box.width, box.height);
          const maxEmotionLabel = Object.entries(det.expressions).reduce((a, b) => (b[1] > a[1] ? b : a))[0];
          this.ctx.fillStyle = 'lime';
          this.ctx.font = '20px Arial';
          this.ctx.fillText(`${maxEmotionLabel}`, box.x + 5, box.y - 10);
        });
      } catch (e) {
        console.warn('face-api error:', e);
        this.detectedEmotions = [];
      }
    }

    // Update counters
    document.getElementById('faceCount').textContent = this.faceLandmarks.length || 0;
    document.getElementById('emotionCount').textContent = this.detectedEmotions.length || 0;

    requestAnimationFrame(() => this.processFrames());
  }

  drawFaceLandmarks(landmarks) {
    this.ctx.fillStyle = 'aqua';
    landmarks.forEach(point => {
      this.ctx.beginPath();
      this.ctx.arc(point.x * this.canvas.width, point.y * this.canvas.height, 2, 0, 2 * Math.PI);
      this.ctx.fill();
    });
  }

  // Simple UI conversation handler
  async handleUserInput(text) {
    if (!text) return;
    this.addMessage('user', text);

    const response = await this.ai.getResponse(text, this.detectedEmotions, this.faceLandmarks.length, 0, this.mode);
    this.addMessage('assistant', response);
    this.speak(response);
  }

  addMessage(sender, text) {
    const container = document.getElementById('conversationLog');
    if (!container) return;
    const div = document.createElement('div');
    div.className = sender;
    div.textContent = text;
    container.appendChild(div);
    container.scrollTop = container.scrollHeight;
  }

  speak(text) {
    if (!window.speechSynthesis || this.speaking) return;
    const utter = new SpeechSynthesisUtterance(text);
    utter.rate = 1.0;
    utter.pitch = 1.0;
    utter.volume = 1.0;

    utter.onstart = () => (this.speaking = true);
    utter.onend = () => (this.speaking = false);

    window.speechSynthesis.speak(utter);
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.guardianXApp = new GuardianXApp();

  const sendBtn = document.getElementById('sendButton');
  const inputEl = document.getElementById('userInput');

  if (sendBtn && inputEl) {
    sendBtn.addEventListener('click', () => {
      const text = inputEl.value.trim();
      if (text.length > 0) {
        window.guardianXApp.handleUserInput(text);
        inputEl.value = '';
      }
    });
  }
});
