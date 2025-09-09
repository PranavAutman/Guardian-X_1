// app.js – Guardian X AI Assistant with Full Facial Expression Signals

class GuardianAIEngine {
  constructor() {
    this.config = {
      model: "gemini-1.5-flash",
      maxTokens: 512,
      temperature: 0.7,
      fallbackEnabled: true
    };
    this.systemPrompt =
      "You are Guardian X, an advanced AI robot with comprehensive operational capabilities including object detection and face analysis.";
    this.conversationHistory = [];
    this.apiKey = "";
    this.loadSavedApiKey();
  }

  loadSavedApiKey() {
    try {
      const saved = localStorage.getItem("guardianX_apiKey");
      if (saved) this.apiKey = saved;
    } catch {}
  }

  async callGeminiAI(prompt) {
    if (!this.apiKey.trim()) throw new Error("API key not configured");
    const body = {
      contents: [{ parts: [{ text: `${this.systemPrompt}\nUser: ${prompt}` }] }],
      generationConfig: { temperature: this.config.temperature, maxOutputTokens: this.config.maxTokens }
    };
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.apiKey}`,
      { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }
    );
    if (!res.ok) throw new Error(`AI error ${res.status}`);
    const { candidates } = await res.json();
    return candidates[0]?.content.parts[0].text.trim();
  }

  async generateResponse(text, detectedObjects, faceActions, mode) {
    const context = this.formatContext(detectedObjects, faceActions);
    const prompt = `Mode:${mode} Context:${context}\nQ: ${text}`;
    try {
      if (this.apiKey.trim()) return await this.callGeminiAI(prompt);
    } catch {}
    return "Fallback: Unable to reach AI. " + prompt;
  }

  formatContext(detectedObjects = [], faceActions = []) {
    let parts = [];
    if (detectedObjects.length) parts.push(`${detectedObjects.length} objects detected`);
    if (faceActions.length) parts.push(`Facial expressions: ${faceActions.join(", ")}`);
    else parts.push("Facial expressions: neutral");
    return parts.join(" | ") || "No detections";
  }

  setApiKey(apiKey) {
    this.apiKey = apiKey;
    if (apiKey && apiKey.trim() !== "") {
      localStorage.setItem("guardianX_apiKey", apiKey);
    }
  }
}

class GuardianXAssistant {
  constructor() {
    this.ai = new GuardianAIEngine();
    this.detectedObjects = [];
    this.detectedFaceActions = [];
    this.model = null;
    this.faceLandmarker = null;
    this.cameraStream = null;
    this.isDetecting = false;
    this.init();
  }

  async init() {
    await tf.ready();
    this.model = await cocoSsd.load();
    await this.loadFaceLandmarker();
    this.setupCamera();
  }

  async loadFaceLandmarker() {
    const { FaceLandmarker, FilesetResolver } = await import(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3"
    );
    const resolver = await FilesetResolver.forVisionTasks(
      "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
    );
    this.faceLandmarker = await FaceLandmarker.createFromOptions(resolver, {
      baseOptions: {
        modelAssetPath:
          "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
        delegate: "GPU"
      },
      outputFaceBlendshapes: true,
      runningMode: "VIDEO",
      numFaces: 1
    });
  }

  setupCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        const video = document.getElementById("cameraVideo");
        this.cameraStream = stream;
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          this.startDetectionLoop();
        };
      })
      .catch((err) => {
        console.error("Camera access denied or unavailable", err);
      });
  }

  startDetectionLoop() {
    const video = document.getElementById("cameraVideo");
    const canvas = document.getElementById("detectionCanvas");
    const ctx = canvas.getContext("2d");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;

    const loop = async () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      // Object Detection
      this.detectedObjects = await this.model.detect(video);

      // Facial Action Signal Extraction
      let faceActions = [];
      if (this.faceLandmarker) {
        try {
          const faceRes = this.faceLandmarker.detectForVideo(video, performance.now());
          const blendshapes = faceRes.faceBlendshapes?.[0];
          if (blendshapes && blendshapes.categories) {
            faceActions = this.extractFaceActions(blendshapes.categories);
          }
          this.drawDetections(ctx, this.detectedObjects, faceRes.faceLandmarks?.[0]);
        } catch (err) {
          console.warn("Face landmarker detection error:", err);
          this.drawDetections(ctx, this.detectedObjects);
        }
      } else {
        this.drawDetections(ctx, this.detectedObjects);
      }

      this.detectedFaceActions = faceActions;

      requestAnimationFrame(loop);
    };
    loop();
  }

  extractFaceActions(categories) {
    const actions = [];
    const THRESH = 0.1; // Threshold for action detection

    let browRaise = 0,
      browLower = 0,
      mouthOpen = 0,
      eyeCloseLeft = 0,
      eyeCloseRight = 0,
      lipFrown = 0;

    categories.forEach(({ categoryName, score }) => {
      const name = categoryName.toLowerCase();
      if (score < THRESH) return;

      if (name.includes("brow_raise") || name.includes("brow_up") || name.includes("brow_outer_up")) {
        browRaise = Math.max(browRaise, score);
      } else if (name.includes("brow_furrow") || name.includes("brow_lower") || name.includes("brow_down")) {
        browLower = Math.max(browLower, score);
      } else if (name.includes("jaw_open")) {
        mouthOpen = Math.max(mouthOpen, score);
      } else if (name.includes("eye_closed_left") || name.includes("eye_closed")) {
        eyeCloseLeft = Math.max(eyeCloseLeft, score);
      } else if (name.includes("eye_closed_right")) {
        eyeCloseRight = Math.max(eyeCloseRight, score);
      } else if (name.includes("mouth_frown") || name.includes("lip_corner_down")) {
        lipFrown = Math.max(lipFrown, score);
      }
    });

    if (browRaise > 0.25) actions.push("eyebrows raised");
    if (browLower > 0.25) actions.push("eyebrows furrowed");
    if (mouthOpen > 0.3) actions.push("mouth open");
    if (eyeCloseLeft > 0.2 && eyeCloseRight > 0.2) actions.push("eyes closed");
    else if (eyeCloseLeft > 0.2) actions.push("left eye closed");
    else if (eyeCloseRight > 0.2) actions.push("right eye closed");
    if (lipFrown > 0.2) actions.push("lip frown");

    if (actions.length === 0) actions.push("neutral expression");

    return actions;
  }

  drawDetections(ctx, predictions, faceLandmarks) {
    ctx.font = "14px Courier New";
    ctx.textBaseline = "top";
    ctx.lineWidth = 3;

    // Draw object detections
    predictions.forEach((pred) => {
      const [x, y, width, height] = pred.bbox;
      let color = "#0ff";
      if (pred.class === "person") color = "#0f8";
      if (["knife", "scissors"].includes(pred.class)) color = "#f33";

      ctx.strokeStyle = color;
      ctx.shadowColor = color;
      ctx.shadowBlur = 10;
      ctx.strokeRect(x, y, width, height);

      const label = `${pred.class} ${Math.round(pred.score * 100)}%`;
      const textWidth = ctx.measureText(label).width;

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(x, y - 25, textWidth + 12, 25);

      ctx.fillStyle = color;
      ctx.fillText(label, x + 6, y - 20);
    });

    // Draw face landmarks if available
    if (faceLandmarks) {
      ctx.fillStyle = "#FFD700";
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 1;

      faceLandmarks.forEach((lm) => {
        const x = lm.x * ctx.canvas.width;
        const y = lm.y * ctx.canvas.height;
        ctx.beginPath();
        ctx.arc(x, y, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      });
    }
  }

  async processVoiceCommand(command, isManual = false) {
    if (!command.trim()) return;

    const timestamp = new Date().toLocaleTimeString();
    this.addMessage("user", command, timestamp);

    try {
      const response = await this.ai.generateResponse(
        command,
        this.detectedObjects,
        this.detectedFaceActions,
        this.currentMission || "POLICING"
      );
      this.addMessage("assistant", response, timestamp);
      this.speak(response);
    } catch (error) {
      console.error("Error processing command:", error);
      this.addMessage(
        "assistant",
        "I had trouble understanding that. Please try again.",
        timestamp
      );
      this.speak("I had trouble understanding that. Please try again.");
    }
  }

  addMessage(type, text, timestamp = null) {
    const container = document.getElementById("conversationLog");
    if (!container) return;
    const msg = document.createElement("div");
    msg.className = `message ${type}`;

    const avatar = type === "user" ? "👤" : "🤖";
    timestamp = timestamp || new Date().toLocaleTimeString();

    msg.innerHTML = `
      <div class="message-avatar">${avatar}</div>
      <div class="message-content">
        <div class="message-text">${text}</div>
        <div class="message-time">${timestamp}</div>
      </div>
    `;

    container.appendChild(msg);
    container.scrollTop = container.scrollHeight;
  }

  speak(text) {
    if (!window.speechSynthesis) return;
    if (this.speaking) return;

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = 0.9;
    utterance.pitch = 0.8;
    utterance.volume = 0.8;

    utterance.onstart = () => (this.speaking = true);
    utterance.onend = () => (this.speaking = false);

    window.speechSynthesis.speak(utterance);
  }
}

// Initialize system on DOM load
document.addEventListener("DOMContentLoaded", () => {
  window.guardianXAssistant = new GuardianXAssistant();
});
