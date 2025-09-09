// app.js – Guardian X AI Assistant with Emotion Detection Fix

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

  async generateResponse(text, objs, faces, emotions, mode) {
    const context = this.formatContext(objs, faces, emotions);
    const prompt = `Mode:${mode} Context:${context}\nQ: ${text}`;
    try {
      if (this.apiKey.trim()) return await this.callGeminiAI(prompt);
    } catch {}
    return "Fallback: Unable to reach AI. " + prompt;
  }

  formatContext(objs = [], faces = [], emotions = []) {
    let parts = [];
    if (objs.length) parts.push(`${objs.length} objects`);
    if (faces.length) parts.push(`${faces.length} faces`);
    if (emotions.length)
      parts.push("Emotions:" + emotions.map((e) => e.emotion + `(${Math.round(e.confidence*100)}%)`).join(","));
    return parts.join(" | ") || "No detections";
  }
}

class GuardianXAssistant {
  constructor() {
    this.ai = new GuardianAIEngine();
    this.detectedObjects = [];
    this.detectedFaces = [];
    this.detectedEmotions = [];
    this.model = null;
    this.faceLandmarker = null;
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
      numFaces: 5
    });
  }

  setupCamera() {
    navigator.mediaDevices
      .getUserMedia({ video: { width: 640, height: 480 } })
      .then((stream) => {
        const video = document.getElementById("cameraVideo");
        video.srcObject = stream;
        video.onloadedmetadata = () => {
          video.play();
          this.startDetectionLoop();
        };
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

      // Face & Emotion Detection
      const faceRes = this.faceLandmarker.detectForVideo(video, performance.now());
      this.detectedFaces = faceRes.faceLandmarks || [];
      this.detectedEmotions = this.extractEmotions(faceRes.faceBlendshapes);

      // Draw Objects
      this.detectedObjects.forEach((o) => {
        ctx.strokeStyle = "#0ff";
        ctx.strokeRect(...o.bbox);
      });

      // Draw Face Landmarks & Emotion Labels
      this.detectedFaces.forEach((lm, i) => {
        const em = this.detectedEmotions[i];
        this.drawLandmarks(ctx, lm, em.emotion, em.confidence);
      });

      // Update UI Lists
      this.updateObjectList();
      this.updateEmotionList();

      requestAnimationFrame(loop);
    };
    loop();
  }

  extractEmotions(blendshapes = []) {
    const results = [];
    const THRESH = 0.05;
    blendshapes.forEach(({ categories }, idx) => {
      console.log(
        "Face",
        idx,
        categories.map((c) => `${c.categoryName}:${c.score.toFixed(2)}`).join(", ")
      );
      let scores = { happy: 0, sad: 0, angry: 0, surprised: 0, neutral: 1 };
      categories.forEach((c) => {
        const n = c.categoryName.toLowerCase(),
          s = c.score;
        if (s < THRESH) return;
        if (n.includes("smile")) scores.happy = Math.max(scores.happy, s);
        else if (n.includes("frown")) scores.sad = Math.max(scores.sad, s);
        else if (n.includes("brow_down")) scores.angry = Math.max(scores.angry, s);
        else if (n.includes("eye_wide") || n.includes("brow_up"))
          scores.surprised = Math.max(scores.surprised, s);
      });
      const sorted = Object.entries(scores).sort((a, b) => b[1] - a[1]);
      const [emotion, confidence] = sorted[0];
      results.push({ faceIndex: idx, emotion, confidence });
    });
    return results;
  }

  drawLandmarks(ctx, landmarks, emotion, conf) {
    ctx.fillStyle = emotion === "happy" ? "lime" : emotion === "sad" ? "blue" : "white";
    landmarks.forEach((p) => ctx.fillRect(p.x * ctx.canvas.width, p.y * ctx.canvas.height, 2, 2));
    // Label
    const p0 = landmarks[0];
    ctx.fillText(`${emotion} ${Math.round(conf * 100)}%`, p0.x * ctx.canvas.width, p0.y * ctx.canvas.height - 10);
  }

  updateObjectList() {
    const ul = document.getElementById("objectList");
    ul.innerHTML = this.detectedObjects.map((o) => `<li>${o.class} (${Math.round(o.score*100)}%)</li>`).join("");
    document.getElementById("peopleCount").innerText = this.detectedObjects.filter((o) => o.class === "person").length;
    document.getElementById("totalObjects").innerText = this.detectedObjects.length;
  }

  updateEmotionList() {
    const ul = document.getElementById("emotionList");
    ul.innerHTML = this.detectedEmotions
      .map((e) => `<li>Face ${e.faceIndex + 1}: ${e.emotion} (${Math.round(e.confidence*100)}%)</li>`)
      .join("");
  }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
  window.guardian = new GuardianXAssistant();
});
