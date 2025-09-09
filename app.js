// Simplified Guardian X Enhanced AI Assistant - Debugging Version
// This version includes better error handling and console logging

class GuardianAIEngine {
    constructor() {
        console.log('🤖 Initializing Guardian AI Engine...');
        this.config = {
            model: "gemini-1.5-flash",
            maxTokens: 512,
            temperature: 0.7,
            fallbackEnabled: true
        };
        
        this.systemPrompt = "You are Guardian X, an advanced AI robot with comprehensive operational capabilities including object detection and face analysis.";
        this.conversationHistory = [];
        this.apiKey = "";
        this.loadSavedApiKey();
    }
    
    loadSavedApiKey() {
        try {
            const savedKey = localStorage.getItem('guardianX_apiKey');
            if (savedKey) {
                this.apiKey = savedKey;
                console.log('✅ Loaded saved API key');
            }
        } catch (error) {
            console.error('Error loading API key:', error);
        }
    }
    
    async generateResponse(userInput, detectedObjects, faceLandmarks, missionMode) {
        try {
            const visionContext = this.formatVisionContext(detectedObjects, faceLandmarks);
            
            if (this.apiKey && this.apiKey.trim() !== "") {
                const aiResponse = await this.callGeminiAI(userInput);
                return aiResponse;
            } else {
                return this.generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, missionMode);
            }
        } catch (error) {
            console.error('AI response error:', error);
            return this.generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, missionMode);
        }
    }
    
    async callGeminiAI(prompt) {
        if (!this.apiKey || this.apiKey.trim() === "") {
            throw new Error('Google API key not configured');
        }
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: `${this.systemPrompt}\nUser question: ${prompt}\nRespond as Guardian X - concise 1-3 sentences:`
                }]
            }],
            generationConfig: {
                temperature: this.config.temperature,
                maxOutputTokens: this.config.maxTokens
            }
        };
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            throw new Error(`API request failed: ${response.status}`);
        }
        
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            return data.candidates[0].content.parts[0].text.replace(/\*/g, '').trim();
        } else {
            throw new Error('No valid response from Gemini AI');
        }
    }
    
    generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, missionMode) {
        const input = userInput.toLowerCase();
        
        if (input.includes('what do you see') || input.includes('describe') || input.includes('analyze')) {
            return this.generateVisionResponse(detectedObjects, faceLandmarks, missionMode);
        }
        
        if (input.includes('face') || input.includes('people')) {
            const faceCount = faceLandmarks ? faceLandmarks.length : 0;
            const peopleCount = detectedObjects ? detectedObjects.filter(obj => obj.class === 'person').length : 0;
            return `I'm tracking ${faceCount} faces and ${peopleCount} people in ${missionMode} mode. Facial analysis systems are active.`;
        }
        
        if (input.includes('threat') || input.includes('security')) {
            return this.generateThreatResponse(detectedObjects, faceLandmarks, missionMode);
        }
        
        return `Guardian X ready in ${missionMode} mode. I can analyze objects, faces, and provide security assessments. How may I assist you?`;
    }
    
    generateVisionResponse(detectedObjects, faceLandmarks, missionMode) {
        const objectCount = detectedObjects ? detectedObjects.length : 0;
        const faceCount = faceLandmarks ? faceLandmarks.length : 0;
        
        if (objectCount === 0 && faceCount === 0) {
            return "Visual sensors are active but not detecting objects or faces. Ensure camera is positioned and environment is well-lit.";
        }
        
        let response = `I can see ${objectCount} objects`;
        if (faceCount > 0) {
            response += ` and I'm tracking ${faceCount} face${faceCount > 1 ? 's' : ''} with facial landmark analysis`;
        }
        response += ` in ${missionMode} mode. All systems operational.`;
        
        return response;
    }
    
    generateThreatResponse(detectedObjects, faceLandmarks, missionMode) {
        const threats = detectedObjects ? detectedObjects.filter(obj => ['knife', 'scissors'].includes(obj.class)) : [];
        const peopleCount = detectedObjects ? detectedObjects.filter(obj => obj.class === 'person').length : 0;
        const faceCount = faceLandmarks ? faceLandmarks.length : 0;
        
        if (threats.length > 0) {
            return `⚠️ Alert: ${threats.length} potential threat object${threats.length > 1 ? 's' : ''} detected. Security protocols recommended.`;
        }
        
        return `Security assessment: ${peopleCount} people detected, ${faceCount} faces tracked. Environment appears secure in ${missionMode} mode.`;
    }
    
    formatVisionContext(detectedObjects, faceLandmarks) {
        const objectCount = detectedObjects ? detectedObjects.length : 0;
        const faceCount = faceLandmarks ? faceLandmarks.length : 0;
        return `${objectCount} objects, ${faceCount} faces detected`;
    }
    
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        if (apiKey && apiKey.trim() !== "") {
            localStorage.setItem('guardianX_apiKey', apiKey);
        }
    }
}

class GuardianXAssistant {
    constructor() {
        console.log('🚀 Starting Guardian X Assistant...');
        
        // Initialize AI Engine
        this.aiEngine = new GuardianAIEngine();
        
        // System configuration
        this.config = {
            frameRate: 30,
            detectionInterval: 200,
            confidenceThreshold: 0.3,
            maxDetections: 20
        };
        
        // Mission modes
        this.missionModes = {
            MEDICAL: { priorityObjects: ["person", "bottle", "cup"], threatLevel: "low" },
            DEFENSE: { priorityObjects: ["person", "car", "backpack", "knife"], threatLevel: "high" },
            POLICING: { priorityObjects: ["person", "car", "handbag", "cell phone"], threatLevel: "medium" }
        };
        
        // System state
        this.isInitialized = false;
        this.currentMission = "POLICING";
        this.cameraStream = null;
        this.objectModel = null;
        this.faceLandmarker = null;
        this.isDetecting = false;
        this.detectedObjects = [];
        this.faceLandmarks = [];
        this.startTime = Date.now();
        this.frameCount = 0;
        this.lastFrameTime = 0;
        
        // DOM elements cache
        this.elements = {};
        
        console.log('📋 Initializing system...');
        this.init();
    }
    
    async init() {
        try {
            console.log('🔧 Caching elements...');
            this.cacheElements();
            
            console.log('🎯 Setting up event listeners...');
            this.setupEventListeners();
            
            console.log('⚙️ Initializing system components...');
            await this.initializeSystem();
        } catch (error) {
            console.error('❌ Initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    cacheElements() {
        const elementIds = [
            'loadingScreen', 'dashboard', 'progressFill', 'loadingStatus',
            'systemStatus', 'statusText', 'currentTime', 'emergencyBtn',
            'cameraVideo', 'detectionCanvas', 'cameraSelect', 'startCamera', 'stopCamera',
            'confidenceSlider', 'confidenceValue', 'fpsCounter', 'objectCount', 'faceCount',
            'voiceToggle', 'conversationLog', 'clearConversation',
            'objectList', 'totalObjects', 'peopleCount', 'itemsCount',
            'threatLevel', 'threatDetails', 'medicalItems', 'faceLandmarksList',
            'uptime', 'processingTime', 'detectionRate', 'scansCompleted',
            'cameraHealth', 'modelsHealth', 'voiceHealth', 'detectionHealth', 'faceHealth',
            'overallStatus', 'overallStatusText', 'objectsTracked', 'statusTicker',
            'apiKeyInput', 'saveApiKeyBtn', 'testApiKeyBtn', 'apiKeyStatus'
        ];
        
        this.elements = {};
        elementIds.forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.elements[id] = element;
            } else {
                console.warn(`⚠️ Element not found: ${id}`);
            }
        });
        
        console.log('✅ Elements cached:', Object.keys(this.elements).length);
    }
    
    setupEventListeners() {
        // Mission mode buttons
        document.querySelectorAll('.mission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMissionMode(e.target.dataset.mode);
            });
        });
        
        // Camera controls
        if (this.elements.startCamera) {
            this.elements.startCamera.addEventListener('click', () => this.startCamera());
        }
        if (this.elements.stopCamera) {
            this.elements.stopCamera.addEventListener('click', () => this.stopCamera());
        }
        
        // Voice controls
        if (this.elements.voiceToggle) {
            this.elements.voiceToggle.addEventListener('click', () => this.toggleVoiceControl());
        }
        
        // Quick commands
        document.querySelectorAll('.command-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const command = e.target.dataset.command;
                if (command) {
                    this.processVoiceCommand(command, true);
                }
            });
        });
        
        // Analysis tabs
        document.querySelectorAll('.tab-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchAnalysisTab(e.target.dataset.tab);
            });
        });
        
        // API Key management
        if (this.elements.saveApiKeyBtn) {
            this.elements.saveApiKeyBtn.addEventListener('click', () => this.saveApiKey());
        }
        if (this.elements.testApiKeyBtn) {
            this.elements.testApiKeyBtn.addEventListener('click', () => this.testApiKey());
        }
        
        this.loadApiKeyOnStartup();
        console.log('✅ Event listeners setup complete');
    }
    
    async initializeSystem() {
        try {
            this.updateLoadingProgress(10, "Initializing AI Engine...");
            await this.delay(500);
            
            this.updateLoadingProgress(20, "Loading TensorFlow.js...");
            if (typeof tf !== 'undefined') {
                await tf.ready();
                console.log('✅ TensorFlow.js ready');
            } else {
                console.warn('⚠️ TensorFlow.js not found, skipping...');
            }
            
            this.updateLoadingProgress(35, "Loading Object Detection Model...");
            await this.loadObjectModel();
            
            this.updateLoadingProgress(50, "Loading MediaPipe Face Landmarker...");
            await this.loadFaceLandmarker();
            
            this.updateLoadingProgress(65, "Setting up Camera System...");
            await this.enumerateCameras();
            
            this.updateLoadingProgress(80, "Initializing Voice System...");
            await this.initializeVoiceSystem();
            
            this.updateLoadingProgress(95, "Starting System Loops...");
            this.startSystemLoop();
            
            this.updateLoadingProgress(100, "Guardian X AI Ready!");
            
            setTimeout(() => {
                this.completeInitialization();
            }, 1500);
            
        } catch (error) {
            console.error('❌ System initialization failed:', error);
            this.handleInitializationError(error);
        }
    }
    
    async loadObjectModel() {
        try {
            if (typeof cocoSsd !== 'undefined') {
                this.objectModel = await cocoSsd.load();
                console.log('✅ Object detection model loaded');
            } else {
                console.warn('⚠️ COCO-SSD not found, object detection disabled');
            }
        } catch (error) {
            console.warn('⚠️ Failed to load object model:', error);
        }
    }
    
    async loadFaceLandmarker() {
        try {
            const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
            const { FaceLandmarker, FilesetResolver } = vision;
            
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            
            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 10
            });
            
            console.log('✅ MediaPipe Face Landmarker loaded');
        } catch (error) {
            console.warn('⚠️ Failed to load MediaPipe Face Landmarker:', error);
        }
    }
    
    async enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            if (this.elements.cameraSelect) {
                this.elements.cameraSelect.innerHTML = '';
                videoDevices.forEach((device, index) => {
                    const option = document.createElement('option');
                    option.value = device.deviceId;
                    option.textContent = device.label || `Camera ${index + 1}`;
                    this.elements.cameraSelect.appendChild(option);
                });
            }
            
            console.log('✅ Cameras enumerated:', videoDevices.length);
        } catch (error) {
            console.warn('⚠️ Camera enumeration failed:', error);
        }
    }
    
    async initializeVoiceSystem() {
        try {
            // Basic voice system initialization
            console.log('✅ Voice system ready');
        } catch (error) {
            console.warn('⚠️ Voice system initialization failed:', error);
        }
    }
    
    completeInitialization() {
        if (this.elements.loadingScreen) {
            this.elements.loadingScreen.style.display = 'none';
        }
        if (this.elements.dashboard) {
            this.elements.dashboard.style.display = 'grid';
        }
        
        // Update system status
        if (this.elements.systemStatus) {
            this.elements.systemStatus.classList.add('active');
        }
        if (this.elements.statusText) {
            this.elements.statusText.textContent = 'AI SYSTEM ACTIVE';
        }
        if (this.elements.overallStatus) {
            this.elements.overallStatus.classList.add('active');
        }
        if (this.elements.overallStatusText) {
            this.elements.overallStatusText.textContent = 'Online';
        }
        
        // Update health indicators
        if (this.elements.modelsHealth) {
            this.elements.modelsHealth.textContent = 'Online';
            this.elements.modelsHealth.className = 'health-status online';
        }
        
        if (this.elements.faceHealth) {
            if (this.faceLandmarker) {
                this.elements.faceHealth.textContent = 'Online';
                this.elements.faceHealth.className = 'health-status online';
            } else {
                this.elements.faceHealth.textContent = 'Offline';
                this.elements.faceHealth.className = 'health-status offline';
            }
        }
        
        this.isInitialized = true;
        
        // Welcome message
        const hasApiKey = this.aiEngine.apiKey && this.aiEngine.apiKey.trim() !== "";
        let greeting;
        
        if (hasApiKey) {
            greeting = "Guardian X AI online with Google Gemini integration and MediaPipe face analysis. Advanced conversational intelligence with facial landmark detection active.";
            if (this.elements.statusTicker) {
                this.elements.statusTicker.textContent = '🤖 Guardian X AI operational • 🧠 Gemini AI active • 👤 Face tracking enabled';
            }
        } else {
            greeting = "Guardian X systems online with MediaPipe face tracking. Please configure your Google Gemini API key to enable advanced conversational AI capabilities.";
            if (this.elements.statusTicker) {
                this.elements.statusTicker.textContent = '🤖 Guardian X operational • 👤 Face tracking active • ⚠️ API key required for AI features';
            }
        }
        
        this.addMessage('assistant', greeting);
        console.log('🎉 Guardian X initialization complete!');
    }
    
    handleInitializationError(error) {
        console.error('💥 Initialization error:', error);
        
        if (this.elements.loadingStatus) {
            this.elements.loadingStatus.textContent = `Initialization Failed: ${error.message}`;
        }
        
        // Show basic interface even if initialization fails
        setTimeout(() => {
            if (this.elements.loadingScreen) {
                this.elements.loadingScreen.style.display = 'none';
            }
            if (this.elements.dashboard) {
                this.elements.dashboard.style.display = 'grid';
            }
            
            const errorMessage = `Guardian X encountered an initialization error: ${error.message}. Some features may be limited.`;
            this.addMessage('assistant', errorMessage);
        }, 2000);
    }
    
    // Utility methods
    delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    updateLoadingProgress(percent, status) {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percent}%`;
        }
        if (this.elements.loadingStatus) {
            this.elements.loadingStatus.textContent = status;
        }
        console.log(`📊 ${percent}% - ${status}`);
    }
    
    // Basic implementations of key methods
    async startCamera() {
        console.log('📹 Starting camera...');
        // Camera implementation here
    }
    
    stopCamera() {
        console.log('📹 Stopping camera...');
        // Camera stop implementation here
    }
    
    toggleVoiceControl() {
        console.log('🎤 Toggling voice control...');
        // Voice toggle implementation here
    }
    
    async processVoiceCommand(command, isManual = false) {
        console.log('🗣️ Processing command:', command);
        
        try {
            const response = await this.aiEngine.generateResponse(
                command, 
                this.detectedObjects, 
                this.faceLandmarks,
                this.currentMission
            );
            
            const timestamp = new Date().toLocaleTimeString();
            this.addMessage('user', command, timestamp);
            this.addMessage('assistant', response, timestamp);
            
        } catch (error) {
            console.error('Command processing failed:', error);
            const errorMessage = 'I encountered an error processing your command. Please try again.';
            this.addMessage('assistant', errorMessage);
        }
    }
    
    switchMissionMode(mode) {
        this.currentMission = mode;
        console.log('🎯 Switched to:', mode);
        
        // Update UI
        document.querySelectorAll('.mission-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`)?.classList.add('active');
    }
    
    switchAnalysisTab(tabName) {
        console.log('📊 Switching to tab:', tabName);
        
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`)?.classList.add('active');
        document.getElementById(`${tabName}Tab`)?.classList.remove('hidden');
    }
    
    addMessage(type, text, timestamp = null) {
        if (!this.elements.conversationLog) return;
        
        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        
        const avatar = type === 'user' ? '👤' : '🤖';
        timestamp = timestamp || new Date().toLocaleTimeString();
        
        messageDiv.innerHTML = `
            <div class="message-avatar">${avatar}</div>
            <div class="message-content">
                <div class="message-text">${text}</div>
                <div class="message-time">${timestamp}</div>
            </div>
        `;
        
        this.elements.conversationLog.appendChild(messageDiv);
        this.elements.conversationLog.scrollTop = this.elements.conversationLog.scrollHeight;
    }
    
    loadApiKeyOnStartup() {
        const savedKey = localStorage.getItem('guardianX_apiKey');
        if (savedKey && this.elements.apiKeyInput) {
            this.elements.apiKeyInput.value = savedKey;
            this.updateApiKeyStatus('API key loaded from storage', 'success');
        } else if (this.elements.apiKeyStatus) {
            this.updateApiKeyStatus('No API key configured. Please enter your Google Gemini API key.', 'warning');
        }
    }
    
    saveApiKey() {
        if (!this.elements.apiKeyInput) return;
        
        const key = this.elements.apiKeyInput.value.trim();
        if (!key) {
            this.updateApiKeyStatus('Please enter an API key', 'error');
            return;
        }
        
        if (!key.startsWith('AIzaSy')) {
            this.updateApiKeyStatus('Invalid API key format. Google API keys start with "AIzaSy"', 'error');
            return;
        }
        
        this.aiEngine.setApiKey(key);
        this.updateApiKeyStatus('API key saved successfully!', 'success');
    }
    
    async testApiKey() {
        if (!this.elements.apiKeyInput) return;
        
        const key = this.elements.apiKeyInput.value.trim();
        if (!key) {
            this.updateApiKeyStatus('Please enter an API key first', 'error');
            return;
        }
        
        this.updateApiKeyStatus('Testing API key...', 'warning');
        
        try {
            this.aiEngine.setApiKey(key);
            const response = await this.aiEngine.callGeminiAI('Hello, respond with "API key working"');
            if (response) {
                this.updateApiKeyStatus('API key is working! ✅', 'success');
            }
        } catch (error) {
            this.updateApiKeyStatus(`API key test failed: ${error.message}`, 'error');
        }
    }
    
    updateApiKeyStatus(message, type) {
        if (this.elements.apiKeyStatus) {
            this.elements.apiKeyStatus.textContent = message;
            this.elements.apiKeyStatus.className = `status-message status-${type}`;
        }
    }
    
    startSystemLoop() {
        // Update system uptime
        setInterval(() => {
            const uptime = Date.now() - this.startTime;
            const hours = Math.floor(uptime / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            
            if (this.elements.uptime) {
                this.elements.uptime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
            }
        }, 1000);
        
        // Update current time
        setInterval(() => {
            if (this.elements.currentTime) {
                this.elements.currentTime.textContent = new Date().toLocaleTimeString();
            }
        }, 1000);
    }
}

// Initialize the system when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    console.log('🌟 DOM loaded, starting Guardian X...');
    try {
        window.guardianX = new GuardianXAssistant();
    } catch (error) {
        console.error('💥 Failed to start Guardian X:', error);
        
        // Show error in the UI if possible
        const loadingStatus = document.getElementById('loadingStatus');
        if (loadingStatus) {
            loadingStatus.textContent = `Startup Error: ${error.message}`;
        }
    }
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GuardianXAssistant, GuardianAIEngine };
}
