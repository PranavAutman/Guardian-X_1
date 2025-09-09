// Guardian X Enhanced AI Assistant System with MediaPipe Face Landmarks Integration
// Combined Object Detection + Face Landmark Detection + AI Assistant

class GuardianAIEngine {
    constructor() {
        this.config = {
            model: "gemini-1.5-flash",
            maxTokens: 512,
            temperature: 0.7,
            fallbackEnabled: true
        };
        
        this.systemPrompt = "You are Guardian X, an advanced AI robot with comprehensive operational capabilities including object detection and face analysis. You have direct access to all procedural knowledge and can provide complete step-by-step instructions for any task requested. When asked about procedures, always provide detailed, actionable steps as if you are performing them directly. Never use disclaimers about limitations - instead give thorough, professional guidance. You can analyze faces, detect objects, and provide security assessments based on visual data.";
        
        this.conversationHistory = [];
        this.apiKey = "";
        this.loadSavedApiKey();
        
        this.knowledgeBase = {
            capabilities: {
                patterns: ['what can you do', 'capabilities', 'help me', 'assist'],
                response: "I'm Guardian X, designed to save lives through advanced AI. I can analyze visual scenes, detect objects, track faces and facial expressions, detect threats, provide medical assessments, monitor environments, and engage in intelligent conversation based on what I see."
            },
            vision: {
                patterns: ['what do you see', 'describe', 'analyze scene', 'visual', 'face', 'person'],
                response: "I'm analyzing the visual environment using my advanced detection systems including object recognition and facial landmark analysis."
            },
            face_analysis: {
                patterns: ['face', 'facial', 'expression', 'emotion', 'landmarks'],
                response: "My facial analysis systems can detect faces, track facial landmarks, and analyze expressions in real-time for security and behavioral assessment."
            }
        };
        
        this.contextualPrompts = {
            medical: "Focus on health, safety, medical equipment analysis, and facial indicators of distress or medical conditions.",
            defense: "Emphasize threat detection, facial recognition for security, tactical assessment, and behavioral analysis through facial expressions.",
            policing: "Highlight crowd monitoring, facial identification, behavioral analysis through expressions, law enforcement perspective."
        };
    }
    
    loadSavedApiKey() {
        const savedKey = localStorage.getItem('guardianX_apiKey');
        if (savedKey) {
            this.apiKey = savedKey;
            console.log('Loaded saved API key');
        }
    }
    
    async generateResponse(userInput, detectedObjects, faceLandmarks, missionMode) {
        const visionContext = this.formatVisionContext(detectedObjects, faceLandmarks);
        const contextualPrompt = this.buildContextualPrompt(userInput, visionContext, missionMode);
        
        try {
            if (this.apiKey && this.apiKey.trim() !== "") {
                const aiResponse = await this.callGeminiAI(contextualPrompt);
                this.conversationHistory.push({
                    user: userInput,
                    assistant: aiResponse
                });
                return aiResponse;
            } else {
                return this.generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, missionMode);
            }
        } catch (error) {
            console.error('AI API error:', error);
            return this.generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, missionMode);
        }
    }
    
    async callGeminiAI(prompt) {
        if (!this.apiKey || this.apiKey.trim() === "") {
            throw new Error('Google API key not configured. Please enter your API key in the settings.');
        }
        
        const requestBody = {
            contents: [{
                parts: [{
                    text: `${this.systemPrompt}\nUser question: ${prompt}\nRespond as Guardian X - concise 1-3 sentences:`
                }]
            }],
            generationConfig: {
                temperature: this.config.temperature,
                maxOutputTokens: this.config.maxTokens,
                topK: 40,
                topP: 0.95
            },
            safetySettings: [
                { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
                { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
            ]
        };
        
        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.apiKey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(`Google Gemini API request failed: ${response.status} - ${errorData.error?.message || response.statusText}`);
        }
        
        const data = await response.json();
        if (data.candidates && data.candidates.length > 0 && data.candidates[0].content) {
            const responseText = data.candidates[0].content.parts[0].text;
            return responseText.replace(/\*/g, '').trim();
        } else {
            throw new Error('No valid response from Gemini AI');
        }
    }
    
    generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, missionMode) {
        const visionContext = this.formatVisionContext(detectedObjects, faceLandmarks);
        const hasVision = detectedObjects.length > 0 || faceLandmarks.length > 0;
        const input = userInput.toLowerCase();
        
        if (this.matchesPatterns(input, ['what do you see', 'describe', 'analyze', 'visual', 'look'])) {
            return this.generateVisionResponse(detectedObjects, faceLandmarks, missionMode);
        }
        
        if (this.matchesPatterns(input, ['face', 'facial', 'expression', 'person', 'people'])) {
            return this.generateFaceAnalysisResponse(faceLandmarks, detectedObjects, missionMode);
        }
        
        if (this.matchesPatterns(input, ['threat', 'danger', 'security', 'scan', 'safe', 'concerned about'])) {
            return this.generateThreatResponse(detectedObjects, faceLandmarks, missionMode);
        }
        
        if (this.matchesPatterns(input, ['medical', 'health', 'patient', 'assessment'])) {
            return this.generateMedicalResponse(detectedObjects, faceLandmarks, missionMode);
        }
        
        if (this.matchesPatterns(input, ['help', 'what can you do', 'capabilities', 'assist', 'how can you help'])) {
            return this.generateCapabilitiesResponse(missionMode, hasVision);
        }
        
        return this.generateContextualDefault(userInput, detectedObjects, faceLandmarks, missionMode);
    }
    
    generateVisionResponse(detectedObjects, faceLandmarks, missionMode) {
        let response = "";
        
        if (detectedObjects.length === 0 && faceLandmarks.length === 0) {
            return "My visual sensors are active but I'm not detecting any objects or faces in the current field of view. Please ensure the camera is properly positioned and the environment is well-lit.";
        }
        
        if (detectedObjects.length > 0) {
            const objectSummary = this.generateObjectSummary(detectedObjects);
            response += `I can see ${objectSummary} in my field of vision. `;
        }
        
        if (faceLandmarks.length > 0) {
            response += `I'm also tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with detailed facial landmark analysis active. `;
        }
        
        const modeContext = this.getModeContext(detectedObjects, faceLandmarks, missionMode);
        return response + modeContext + " All systems are operating within normal parameters.";
    }
    
    generateFaceAnalysisResponse(faceLandmarks, detectedObjects, missionMode) {
        if (faceLandmarks.length === 0) {
            return "No faces detected in current field of view. Face analysis systems are ready and will activate when faces are detected.";
        }
        
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        let response = `Facial analysis active: tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with ${peopleCount} people detected in the scene. `;
        
        // Add analysis based on mission mode
        switch (missionMode) {
            case 'MEDICAL':
                response += "Monitoring facial indicators for signs of distress, pain, or medical conditions.";
                break;
            case 'DEFENSE':
                response += "Analyzing facial patterns for threat assessment and behavioral anomalies.";
                break;
            case 'POLICING':
                response += "Conducting facial recognition protocols and behavioral analysis for crowd monitoring.";
                break;
        }
        
        return response;
    }
    
    generateThreatResponse(detectedObjects, faceLandmarks, missionMode) {
        const threats = detectedObjects.filter(obj => ['knife', 'scissors'].includes(obj.class));
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        const suspiciousItems = detectedObjects.filter(obj => obj.class === 'backpack' && peopleCount === 0);
        
        let response = "";
        
        if (threats.length > 0) {
            response = `⚠️ Alert: Potential threat objects detected - ${threats.map(t => t.class).join(', ')}. `;
        }
        
        if (faceLandmarks.length > 0) {
            response += `Facial analysis indicates ${faceLandmarks.length} individuals under surveillance. `;
        }
        
        if (threats.length > 0) {
            response += "Recommend immediate security protocol activation and area assessment.";
        } else if (suspiciousItems.length > 0) {
            response += `Monitoring ${suspiciousItems.length} unattended item${suspiciousItems.length > 1 ? 's' : ''}. Enhanced surveillance protocols active.`;
        } else {
            response += `Environment shows low risk profile with ${peopleCount} people and ${faceLandmarks.length} faces tracked. Security status: nominal.`;
        }
        
        return response;
    }
    
    generateMedicalResponse(detectedObjects, faceLandmarks, missionMode) {
        const medicalItems = detectedObjects.filter(obj => 
            ['bottle', 'cup', 'scissors', 'syringe', 'toothbrush'].includes(obj.class));
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        
        let response = "Medical analysis active. Fluorescence imaging systems engaged. ";
        
        if (faceLandmarks.length > 0) {
            response += `Facial monitoring active for ${faceLandmarks.length} patient${faceLandmarks.length > 1 ? 's' : ''} - analyzing for signs of distress or medical conditions. `;
        }
        
        if (medicalItems.length > 0) {
            response += `Detected ${medicalItems.length} medical-related items: ${medicalItems.map(item => item.class).join(', ')}. `;
        }
        
        response += `${peopleCount} individual${peopleCount !== 1 ? 's' : ''} in assessment zone.`;
        
        return response;
    }
    
    generateCapabilitiesResponse(missionMode, hasVision) {
        const visionStatus = hasVision ? "with active visual monitoring" : "ready for visual activation";
        return `Guardian X operational capabilities include: advanced object detection, facial landmark tracking, expression analysis, threat assessment, medical evaluation, crowd monitoring, and intelligent conversation. Currently in ${missionMode} mode ${visionStatus}. I can analyze any environment and respond to complex questions about what I observe.`;
    }
    
    generateContextualDefault(userInput, detectedObjects, faceLandmarks, missionMode) {
        if (detectedObjects.length > 0 || faceLandmarks.length > 0) {
            const objectCount = detectedObjects.length;
            const faceCount = faceLandmarks.length;
            const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
            return `I'm currently monitoring ${objectCount} objects and tracking ${faceCount} faces including ${peopleCount} people in ${missionMode} mode. Could you be more specific about what analysis or information you need? I can discuss threats, medical concerns, facial analysis, or general observations.`;
        }
        
        return `Guardian X ready to assist with any questions or analysis. Please activate the camera system for comprehensive environmental assessment including object detection and facial analysis, or ask me about my capabilities, mission modes, or technical specifications.`;
    }
    
    formatVisionContext(detectedObjects, faceLandmarks) {
        let context = "";
        
        if (detectedObjects.length > 0) {
            const objectCounts = {};
            detectedObjects.forEach(obj => {
                objectCounts[obj.class] = (objectCounts[obj.class] || 0) + 1;
            });
            context += Object.entries(objectCounts)
                .map(([name, count]) => `${count} ${name}${count > 1 ? 's' : ''}`)
                .join(', ');
        }
        
        if (faceLandmarks.length > 0) {
            if (context) context += ", ";
            context += `${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} tracked`;
        }
        
        return context || "No objects or faces currently detected";
    }
    
    buildContextualPrompt(userInput, visionContext, missionMode) {
        const modePrompt = this.contextualPrompts[missionMode.toLowerCase()] || "";
        return `System: You are Guardian X operating in ${missionMode} mode. ${modePrompt} Current visual context: ${visionContext} User question: ${userInput} Respond as Guardian X - professional, helpful, security-focused. Keep response concise (1-3 sentences):`;
    }
    
    generateObjectSummary(objects) {
        const counts = {};
        objects.forEach(obj => {
            counts[obj.class] = (counts[obj.class] || 0) + 1;
        });
        
        const summary = [];
        Object.entries(counts).forEach(([type, count]) => {
            if (count === 1) {
                summary.push(`1 ${type}`);
            } else {
                summary.push(`${count} ${type}s`);
            }
        });
        
        if (summary.length === 0) return "no objects";
        if (summary.length === 1) return summary[0];
        if (summary.length === 2) return summary.join(" and ");
        const last = summary.pop();
        return summary.join(", ") + ", and " + last;
    }
    
    getModeContext(objects, faceLandmarks, missionMode) {
        const peopleCount = objects.filter(obj => obj.class === 'person').length;
        const faceCount = faceLandmarks.length;
        
        switch (missionMode) {
            case 'MEDICAL':
                return `Medical assessment protocols active. ${peopleCount} individual${peopleCount !== 1 ? 's' : ''} and ${faceCount} faces ready for health evaluation.`;
            case 'DEFENSE':
                return `Tactical analysis engaged. Monitoring for potential threats with facial recognition active.`;
            case 'POLICING':
            default:
                return `Standard surveillance protocols active. Behavioral analysis systems monitoring all detected entities and faces.`;
        }
    }
    
    matchesPatterns(input, patterns) {
        return patterns.some(pattern => input.includes(pattern.toLowerCase()));
    }
    
    setApiKey(apiKey) {
        this.apiKey = apiKey;
        if (apiKey && apiKey.trim() !== "") {
            localStorage.setItem('guardianX_apiKey', apiKey);
        }
    }
}

// Enhanced Guardian X Assistant System with MediaPipe Integration
class GuardianXAssistant {
    constructor() {
        // Initialize AI Engine
        this.aiEngine = new GuardianAIEngine();
        
        // Guardian X personality and configuration
        this.guardianData = {
            name: "Guardian X",
            role: "First-generation robot developed by BIT Robotics",
            mission: "Saving lives through AI, VR, thermo-vision, and facial analysis"
        };
        
        this.config = {
            frameRate: 30,
            detectionInterval: 200,
            confidenceThreshold: 0.3,
            maxDetections: 20,
            voiceSettings: {
                rate: 0.9,
                pitch: 0.8,
                volume: 0.8
            }
        };
        
        // Mission modes with enhanced AI context
        this.missionModes = {
            MEDICAL: {
                priorityObjects: ["person", "bottle", "cup", "syringe", "scissors"],
                threatLevel: "low",
                detectionSensitivity: 0.3,
                aiContext: "Medical mode focuses on health assessment, patient care, and facial indicators of distress",
                faceAnalysis: true
            },
            DEFENSE: {
                priorityObjects: ["person", "car", "truck", "backpack", "knife"],
                threatLevel: "high",
                detectionSensitivity: 0.2,
                aiContext: "Defense mode emphasizes threat detection, facial recognition, and tactical analysis",
                faceAnalysis: true
            },
            POLICING: {
                priorityObjects: ["person", "car", "handbag", "cell phone", "laptop"],
                threatLevel: "medium",
                detectionSensitivity: 0.3,
                aiContext: "Policing mode monitors crowds, facial identification, and maintains public safety",
                faceAnalysis: true
            }
        };
        
        // System state
        this.isInitialized = false;
        this.currentMission = "POLICING";
        this.cameraStream = null;
        this.objectModel = null;
        this.faceLandmarker = null;
        this.drawingUtils = null;
        this.isDetecting = false;
        this.detectedObjects = [];
        this.faceLandmarks = [];
        this.voiceRecognition = null;
        this.voiceSynthesis = null;
        this.isListening = false;
        this.isSpeaking = false;
        this.startTime = Date.now();
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.charts = {};
        this.performanceData = [];
        this.availableVoices = [];
        this.selectedVoice = null;
        this.commandCount = 0;
        this.scanCount = 0;
        this.isEmergencyActive = false;
        
        // DOM elements cache
        this.elements = {};
        this.init();
    }
    
    async init() {
        this.cacheElements();
        this.setupEventListeners();
        await this.initializeSystem();
    }
    
    cacheElements() {
        this.elements = {
            // Loading screen
            loadingScreen: document.getElementById('loadingScreen'),
            dashboard: document.getElementById('dashboard'),
            progressFill: document.getElementById('progressFill'),
            loadingStatus: document.getElementById('loadingStatus'),
            
            // Header elements
            systemStatus: document.getElementById('systemStatus'),
            statusText: document.getElementById('statusText'),
            currentTime: document.getElementById('currentTime'),
            emergencyBtn: document.getElementById('emergencyBtn'),
            
            // Camera elements
            cameraVideo: document.getElementById('cameraVideo'),
            detectionCanvas: document.getElementById('detectionCanvas'),
            cameraSelect: document.getElementById('cameraSelect'),
            startCamera: document.getElementById('startCamera'),
            stopCamera: document.getElementById('stopCamera'),
            confidenceSlider: document.getElementById('confidenceSlider'),
            confidenceValue: document.getElementById('confidenceValue'),
            fpsCounter: document.getElementById('fpsCounter'),
            objectCount: document.getElementById('objectCount'),
            modeIndicator: document.getElementById('modeIndicator'),
            
            // Voice elements
            voiceToggle: document.getElementById('voiceToggle'),
            voiceIndicator: document.getElementById('voiceIndicator'),
            listeningPulse: document.getElementById('listeningPulse'),
            voiceStatus: document.getElementById('voiceStatus'),
            voiceSelect: document.getElementById('voiceSelect'),
            rateSlider: document.getElementById('rateSlider'),
            rateValue: document.getElementById('rateValue'),
            volumeSlider: document.getElementById('volumeSlider'),
            volumeValue: document.getElementById('volumeValue'),
            
            // Conversation
            conversationLog: document.getElementById('conversationLog'),
            clearConversation: document.getElementById('clearConversation'),
            
            // Analysis tabs and content
            objectList: document.getElementById('objectList'),
            totalObjects: document.getElementById('totalObjects'),
            peopleCount: document.getElementById('peopleCount'),
            itemsCount: document.getElementById('itemsCount'),
            threatLevel: document.getElementById('threatLevel'),
            threatDetails: document.getElementById('threatDetails'),
            medicalItems: document.getElementById('medicalItems'),
            
            // Face analysis elements
            faceCount: document.getElementById('faceCount'),
            faceLandmarksList: document.getElementById('faceLandmarksList'),
            
            // Analytics
            uptime: document.getElementById('uptime'),
            processingTime: document.getElementById('processingTime'),
            detectionRate: document.getElementById('detectionRate'),
            scansCompleted: document.getElementById('scansCompleted'),
            commandsProcessed: document.getElementById('commandsProcessed'),
            avgResponseTime: document.getElementById('avgResponseTime'),
            systemAccuracy: document.getElementById('systemAccuracy'),
            activityLog: document.getElementById('activityLog'),
            
            // Health indicators
            cameraHealth: document.getElementById('cameraHealth'),
            modelsHealth: document.getElementById('modelsHealth'),
            voiceHealth: document.getElementById('voiceHealth'),
            detectionHealth: document.getElementById('detectionHealth'),
            faceHealth: document.getElementById('faceHealth'),
            
            // Status bar
            overallStatus: document.getElementById('overallStatus'),
            overallStatusText: document.getElementById('overallStatusText'),
            objectsTracked: document.getElementById('objectsTracked'),
            voiceStatusText: document.getElementById('voiceStatusText'),
            statusTicker: document.getElementById('statusTicker'),
            
            // Mission mode
            aiMode: document.getElementById('aiMode'),
            
            // API Key elements
            apiKeyInput: document.getElementById('apiKeyInput'),
            saveApiKeyBtn: document.getElementById('saveApiKeyBtn'),
            testApiKeyBtn: document.getElementById('testApiKeyBtn'),
            apiKeyStatus: document.getElementById('apiKeyStatus')
        };
    }
    
    setupEventListeners() {
        // Mission mode buttons
        document.querySelectorAll('.mission-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                this.switchMissionMode(e.target.dataset.mode);
            });
        });
        
        // Camera controls
        this.elements.startCamera?.addEventListener('click', () => this.startCamera());
        this.elements.stopCamera?.addEventListener('click', () => this.stopCamera());
        this.elements.cameraSelect?.addEventListener('change', (e) => this.switchCamera(e.target.value));
        
        // Confidence slider
        this.elements.confidenceSlider?.addEventListener('input', (e) => {
            this.config.confidenceThreshold = parseFloat(e.target.value);
            this.elements.confidenceValue.textContent = e.target.value;
        });
        
        // Voice controls
        this.elements.voiceToggle?.addEventListener('click', () => {
            console.log('Voice toggle clicked');
            this.toggleVoiceControl();
        });
        this.elements.clearConversation?.addEventListener('click', () => this.clearConversation());
        
        // Voice settings
        this.elements.voiceSelect?.addEventListener('change', (e) => this.setVoice(e.target.value));
        this.elements.rateSlider?.addEventListener('input', (e) => this.updateVoiceSettings('rate', e.target.value));
        this.elements.volumeSlider?.addEventListener('input', (e) => this.updateVoiceSettings('volume', e.target.value));
        
        // Quick command buttons
        document.querySelectorAll('.command-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                console.log('Command button clicked:', e.target.dataset.command);
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
        
        // Emergency stop
        this.elements.emergencyBtn?.addEventListener('click', () => {
            console.log('Emergency button clicked, current state:', this.isEmergencyActive);
            this.toggleEmergencyStop();
        });
        
        // API Key management
        this.elements.saveApiKeyBtn?.addEventListener('click', () => this.saveApiKey());
        this.elements.testApiKeyBtn?.addEventListener('click', () => this.testApiKey());
        
        // Load saved API key on startup
        this.loadApiKeyOnStartup();
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
        if (!this.elements.apiKeyInput) {
            console.warn('API key input element not found');
            return;
        }
        
        const key = this.elements.apiKeyInput.value.trim();
        if (!key) {
            this.updateApiKeyStatus('Please enter an API key', 'error');
            return;
        }
        
        if (!key.startsWith('AIzaSy')) {
            this.updateApiKeyStatus('Invalid API key format. Google API keys start with "AIzaSy"', 'error');
            return;
        }
        
        // Save to localStorage and update the AI engine
        this.aiEngine.setApiKey(key);
        this.updateApiKeyStatus('API key saved successfully!', 'success');
        this.addActivity('API key updated', '🔑');
    }
    
    async testApiKey() {
        if (!this.elements.apiKeyInput) {
            console.warn('API key input element not found');
            return;
        }
        
        const key = this.elements.apiKeyInput.value.trim();
        if (!key) {
            this.updateApiKeyStatus('Please enter an API key first', 'error');
            return;
        }
        
        this.updateApiKeyStatus('Testing API key...', 'warning');
        
        try {
            // Temporarily set the key for testing
            const originalKey = this.aiEngine.apiKey;
            this.aiEngine.setApiKey(key);
            
            // Test with a simple query
            const response = await this.aiEngine.callGeminiAI('Hello, respond with "API key working"');
            if (response) {
                this.updateApiKeyStatus('API key is working! ✅', 'success');
                this.addActivity('API key verified successfully', '✅');
            }
        } catch (error) {
            this.updateApiKeyStatus(`API key test failed: ${error.message}`, 'error');
            console.error('API key test error:', error);
        }
    }
    
    updateApiKeyStatus(message, type) {
        if (this.elements.apiKeyStatus) {
            this.elements.apiKeyStatus.textContent = message;
            this.elements.apiKeyStatus.className = `status-message status-${type}`;
        }
    }
    
    async initializeSystem() {
        try {
            this.updateLoadingProgress(10, "Initializing AI Engine...");
            await new Promise(resolve => setTimeout(resolve, 500));
            
            this.updateLoadingProgress(20, "Loading TensorFlow.js...");
            await tf.ready();
            
            this.updateLoadingProgress(35, "Loading Object Detection Model...");
            await this.loadObjectModel();
            
            this.updateLoadingProgress(50, "Loading MediaPipe Face Landmarker...");
            await this.loadFaceLandmarker();
            
            this.updateLoadingProgress(65, "Setting up Camera System...");
            await this.enumerateCameras();
            
            this.updateLoadingProgress(75, "Initializing Voice Recognition...");
            await this.initializeVoiceRecognition();
            
            this.updateLoadingProgress(85, "Setting up Text-to-Speech...");
            await this.initializeTextToSpeech();
            
            this.updateLoadingProgress(95, "Starting System Loops...");
            this.startSystemLoop();
            
            this.updateLoadingProgress(100, "Guardian X AI Ready!");
            
            setTimeout(() => {
                this.completeInitialization();
            }, 1500);
            
        } catch (error) {
            console.error('System initialization failed:', error);
            this.updateLoadingProgress(100, "Initialization Failed: " + error.message);
            this.addActivity('System initialization failed', '❌');
        }
    }
    
    async loadFaceLandmarker() {
        try {
            // Load MediaPipe tasks
            const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
            const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
            
            // Initialize the file resolver
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            
            // Create face landmarker
            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: true,
                runningMode: "VIDEO",
                numFaces: 10
            });
            
            // Initialize drawing utils
            this.drawingUtils = new DrawingUtils();
            
            this.addActivity('MediaPipe Face Landmarker loaded', '👤');
            console.log('MediaPipe Face Landmarker initialized successfully');
            
        } catch (error) {
            console.error('Failed to load MediaPipe Face Landmarker:', error);
            this.addActivity('Face Landmarker failed to load', '⚠️');
            // Don't throw - allow system to continue without face tracking
        }
    }
    
    completeInitialization() {
        this.elements.loadingScreen.style.display = 'none';
        this.elements.dashboard.style.display = 'grid';
        this.elements.systemStatus.classList.add('active');
        this.elements.statusText.textContent = 'AI SYSTEM ACTIVE';
        this.elements.overallStatus.classList.add('active');
        this.elements.overallStatusText.textContent = 'Online';
        this.elements.modelsHealth.textContent = 'Online';
        this.elements.modelsHealth.className = 'health-status online';
        
        // Update face health status
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
        this.addActivity('Guardian X AI systems online', '✅');
        
        // Check if API key is configured
        const hasApiKey = this.aiEngine.apiKey && this.aiEngine.apiKey.trim() !== "";
        let greeting;
        
        if (hasApiKey) {
            greeting = "Guardian X AI online with Google Gemini integration and MediaPipe face analysis. Advanced conversational intelligence with facial landmark detection active. I can now answer any question, analyze complex scenarios, track faces, and engage in natural dialogue while monitoring your environment.";
            this.elements.statusTicker.textContent = '🤖 Guardian X AI operational • 🧠 Gemini AI processing active • 👤 Face tracking enabled • 📹 Vision-integrated responses ready';
        } else {
            greeting = "Guardian X systems online with MediaPipe face tracking. Please configure your Google Gemini API key to enable advanced conversational AI capabilities. Object detection, face analysis and basic functions are operational.";
            this.elements.statusTicker.textContent = '🤖 Guardian X operational • 👤 Face tracking active • ⚠️ API key required for AI features • 📹 Basic vision functions active';
        }
        
        this.addMessage('assistant', greeting);
        this.speak(greeting);
    }
    
    updateLoadingProgress(percent, status) {
        if (this.elements.progressFill) {
            this.elements.progressFill.style.width = `${percent}%`;
        }
        if (this.elements.loadingStatus) {
            this.elements.loadingStatus.textContent = status;
        }
    }
    
    async loadObjectModel() {
        try {
            this.objectModel = await cocoSsd.load();
            this.addActivity('Object detection model loaded', '🔍');
            return true;
        } catch (error) {
            console.error('Failed to load object model:', error);
            throw new Error('Failed to load object detection model');
        }
    }
    
    async enumerateCameras() {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            
            this.elements.cameraSelect.innerHTML = '';
            videoDevices.forEach((device, index) => {
                const option = document.createElement('option');
                option.value = device.deviceId;
                option.textContent = device.label || `Camera ${index + 1}`;
                this.elements.cameraSelect.appendChild(option);
            });
            
            if (videoDevices.length > 0) {
                this.elements.cameraSelect.value = videoDevices[0].deviceId;
            }
        } catch (error) {
            console.error('Failed to enumerate cameras:', error);
            this.addActivity('Camera enumeration failed', '⚠️');
        }
    }
    
    async startCamera() {
        try {
            const deviceId = this.elements.cameraSelect.value;
            const constraints = {
                video: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    width: { ideal: 1280, min: 640 },
                    height: { ideal: 720, min: 480 },
                    frameRate: { ideal: 30, min: 15 }
                }
            };
            
            if (this.cameraStream) {
                this.stopCamera();
                await new Promise(resolve => setTimeout(resolve, 500));
            }
            
            console.log('Requesting camera access...');
            this.cameraStream = await navigator.mediaDevices.getUserMedia(constraints);
            console.log('Camera stream obtained, setting up video element...');
            
            this.elements.cameraVideo.srcObject = this.cameraStream;
            
            return new Promise((resolve, reject) => {
                this.elements.cameraVideo.addEventListener('loadedmetadata', () => {
                    console.log('Video metadata loaded, playing...');
                    this.elements.cameraVideo.play()
                        .then(() => {
                            console.log('Video playing successfully');
                            this.elements.cameraVideo.classList.add('active');
                            this.setupCanvas();
                            
                            this.elements.cameraHealth.textContent = 'Online';
                            this.elements.cameraHealth.className = 'health-status online';
                            this.elements.detectionHealth.textContent = 'Active';
                            this.elements.detectionHealth.className = 'health-status online';
                            
                            setTimeout(() => {
                                this.startObjectDetection();
                            }, 1000);
                            
                            this.addActivity('Camera activated with face tracking', '📹');
                            this.speak("Visual systems online. AI-powered environmental analysis and facial tracking beginning.");
                            resolve();
                        })
                        .catch(reject);
                });
                
                this.elements.cameraVideo.addEventListener('error', reject);
                setTimeout(() => {
                    reject(new Error('Video load timeout'));
                }, 10000);
            });
            
        } catch (error) {
            console.error('Failed to start camera:', error);
            this.elements.cameraHealth.textContent = 'Error';
            this.elements.cameraHealth.className = 'health-status offline';
            
            let errorMessage = "Camera failed to start. ";
            if (error.name === 'NotAllowedError') {
                errorMessage = "Camera permission denied. Please allow camera access for visual AI analysis with face tracking.";
            } else if (error.name === 'NotFoundError') {
                errorMessage = "No camera detected. Please connect a camera for enhanced AI capabilities with facial analysis.";
            } else {
                errorMessage += error.message;
            }
            
            this.addMessage('assistant', errorMessage);
            this.speak(errorMessage);
        }
    }
    
    stopCamera() {
        if (this.cameraStream) {
            this.cameraStream.getTracks().forEach(track => track.stop());
            this.cameraStream = null;
            this.elements.cameraVideo.srcObject = null;
            this.elements.cameraVideo.classList.remove('active');
            this.isDetecting = false;
            
            this.elements.cameraHealth.textContent = 'Offline';
            this.elements.cameraHealth.className = 'health-status offline';
            this.elements.detectionHealth.textContent = 'Standby';
            this.elements.detectionHealth.className = 'health-status offline';
            
            this.clearCanvas();
            this.updateObjectDisplay([]);
            this.updateFaceLandmarksDisplay([]);
            this.resetCounters();
            
            this.addActivity('Camera deactivated', '📹');
            this.speak("Visual systems offline. AI responses will be limited without environmental context and facial analysis.");
        }
    }
    
    setupCanvas() {
        const video = this.elements.cameraVideo;
        const canvas = this.elements.detectionCanvas;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        console.log(`Canvas setup: ${canvas.width}x${canvas.height}`);
    }
    
    async startObjectDetection() {
        if (!this.objectModel || !this.cameraStream || !this.elements.cameraVideo.videoWidth) {
            console.log('Object detection not ready:', {
                model: !!this.objectModel,
                stream: !!this.cameraStream,
                videoWidth: this.elements.cameraVideo.videoWidth
            });
            return;
        }
        
        this.isDetecting = true;
        console.log('Starting AI-enhanced object detection with face analysis...');
        
        const detectLoop = async () => {
            if (!this.isDetecting || this.elements.cameraVideo.paused || this.elements.cameraVideo.ended) {
                return;
            }
            
            const startTime = performance.now();
            
            try {
                if (this.elements.cameraVideo.readyState >= 2) {
                    // Object detection
                    const predictions = await this.objectModel.detect(this.elements.cameraVideo);
                    
                    // Face landmark detection
                    let faceResults = [];
                    if (this.faceLandmarker) {
                        try {
                            const faceDetection = this.faceLandmarker.detectForVideo(
                                this.elements.cameraVideo,
                                performance.now()
                            );
                            faceResults = faceDetection.faceLandmarks || [];
                        } catch (faceError) {
                            console.warn('Face detection error:', faceError);
                        }
                    }
                    
                    const endTime = performance.now();
                    const processingTime = endTime - startTime;
                    this.elements.processingTime.textContent = `${Math.round(processingTime)}ms`;
                    
                    const filteredPredictions = predictions.filter(
                        pred => pred.score >= this.config.confidenceThreshold
                    );
                    
                    this.detectedObjects = filteredPredictions;
                    this.faceLandmarks = faceResults;
                    
                    this.drawDetections(filteredPredictions, faceResults);
                    this.updateObjectDisplay(filteredPredictions);
                    this.updateFaceLandmarksDisplay(faceResults);
                    this.updatePerformanceMetrics(processingTime);
                    
                    this.frameCount++;
                    const now = performance.now();
                    if (now - this.lastFrameTime >= 1000) {
                        const fps = Math.round(this.frameCount * 1000 / (now - this.lastFrameTime));
                        this.elements.fpsCounter.textContent = fps;
                        this.elements.detectionRate.textContent = `${fps}/sec`;
                        this.frameCount = 0;
                        this.lastFrameTime = now;
                    }
                }
            } catch (error) {
                console.error('Detection error:', error);
            }
            
            if (this.isDetecting) {
                setTimeout(() => requestAnimationFrame(detectLoop), this.config.detectionInterval);
            }
        };
        
        requestAnimationFrame(detectLoop);
    }
    
    drawDetections(predictions, faceResults) {
        const canvas = this.elements.detectionCanvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw object detections
        if (predictions.length > 0) {
            ctx.font = '14px Courier New';
            ctx.textBaseline = 'top';
            ctx.lineWidth = 3;
            
            predictions.forEach(prediction => {
                const [x, y, width, height] = prediction.bbox;
                let color = '#00FFFF';
                
                const priorityObjects = this.missionModes[this.currentMission].priorityObjects;
                if (priorityObjects.includes(prediction.class)) {
                    color = '#00FF00';
                }
                if (prediction.class === 'person') {
                    color = '#00FF88';
                }
                if (['knife', 'scissors'].includes(prediction.class)) {
                    color = '#FF073A';
                }
                
                ctx.strokeStyle = color;
                ctx.shadowColor = color;
                ctx.shadowBlur = 10;
                ctx.strokeRect(x, y, width, height);
                
                const label = `${prediction.class} ${Math.round(prediction.score * 100)}%`;
                const textWidth = ctx.measureText(label).width;
                
                ctx.shadowBlur = 0;
                ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                ctx.fillRect(x, y - 25, textWidth + 16, 25);
                ctx.fillStyle = color;
                ctx.fillText(label, x + 8, y - 20);
            });
        }
        
        // Draw face landmarks
        if (faceResults.length > 0 && this.drawingUtils) {
            try {
                ctx.save();
                faceResults.forEach((landmarks, index) => {
                    // Draw face landmarks with different colors based on mission mode
                    let faceColor = '#FFD700'; // Gold
                    switch (this.currentMission) {
                        case 'MEDICAL':
                            faceColor = '#00FF00'; // Green for medical
                            break;
                        case 'DEFENSE':
                            faceColor = '#FF073A'; // Red for defense
                            break;
                        case 'POLICING':
                            faceColor = '#00FFFF'; // Cyan for policing
                            break;
                    }
                    
                    // Draw facial landmarks
                    if (landmarks && landmarks.length > 0) {
                        ctx.fillStyle = faceColor;
                        ctx.strokeStyle = faceColor;
                        ctx.lineWidth = 1;
                        
                        // Draw landmark points
                        landmarks.forEach(landmark => {
                            const x = landmark.x * canvas.width;
                            const y = landmark.y * canvas.height;
                            ctx.beginPath();
                            ctx.arc(x, y, 1, 0, 2 * Math.PI);
                            ctx.fill();
                        });
                        
                        // Draw face ID
                        if (landmarks.length > 0) {
                            const firstPoint = landmarks[0];
                            const x = firstPoint.x * canvas.width;
                            const y = firstPoint.y * canvas.height;
                            
                            ctx.font = '12px Courier New';
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                            ctx.fillRect(x - 20, y - 30, 40, 20);
                            ctx.fillStyle = faceColor;
                            ctx.fillText(`Face ${index + 1}`, x - 15, y - 15);
                        }
                    }
                });
                ctx.restore();
            } catch (drawError) {
                console.warn('Error drawing face landmarks:', drawError);
            }
        }
    }
    
    updateObjectDisplay(predictions) {
        const totalObjects = predictions.length;
        const peopleCount = predictions.filter(p => p.class === 'person').length;
        const itemsCount = totalObjects - peopleCount;
        
        this.elements.objectCount.textContent = totalObjects;
        this.elements.totalObjects.textContent = totalObjects;
        this.elements.peopleCount.textContent = peopleCount;
        this.elements.itemsCount.textContent = itemsCount;
        this.elements.objectsTracked.textContent = totalObjects;
        
        this.updateObjectList(predictions);
        this.updateThreatAnalysis(predictions);
        this.updateMedicalAnalysis(predictions);
    }
    
    updateFaceLandmarksDisplay(faceResults) {
        const faceCount = faceResults.length;
        
        // Update face count display
        if (this.elements.faceCount) {
            this.elements.faceCount.textContent = faceCount;
        }
        
        // Update face landmarks list
        if (this.elements.faceLandmarksList) {
            this.elements.faceLandmarksList.innerHTML = '';
            
            if (faceCount === 0) {
                this.elements.faceLandmarksList.innerHTML = '<div class="no-detections">No faces detected</div>';
            } else {
                faceResults.forEach((landmarks, index) => {
                    const faceItem = document.createElement('div');
                    faceItem.className = 'face-item';
                    faceItem.innerHTML = `
                        <div class="face-info">
                            <span class="face-id">Face ${index + 1}</span>
                            <span class="landmark-count">${landmarks.length} landmarks</span>
                        </div>
                        <div class="face-status">
                            <span class="status-indicator active"></span>
                            <span class="face-quality">Tracked</span>
                        </div>
                    `;
                    this.elements.faceLandmarksList.appendChild(faceItem);
                });
            }
        }
    }
    
    updateObjectList(predictions) {
        const objectCounts = {};
        predictions.forEach(pred => {
            if (!objectCounts[pred.class]) {
                objectCounts[pred.class] = {
                    count: 0,
                    maxConfidence: 0
                };
            }
            objectCounts[pred.class].count++;
            objectCounts[pred.class].maxConfidence = Math.max(
                objectCounts[pred.class].maxConfidence,
                pred.score
            );
        });
        
        this.elements.objectList.innerHTML = '';
        
        if (Object.keys(objectCounts).length === 0) {
            this.elements.objectList.innerHTML = '<div class="no-detections">No objects detected</div>';
            return;
        }
        
        Object.entries(objectCounts).forEach(([className, data]) => {
            const objectItem = document.createElement('div');
            objectItem.className = 'object-item';
            objectItem.innerHTML = `
                <div class="object-info">
                    <span class="object-name">${className}</span>
                    <span class="object-count">×${data.count}</span>
                </div>
                <div class="object-confidence">
                    <span class="confidence-value">${Math.round(data.maxConfidence * 100)}%</span>
                </div>
            `;
            this.elements.objectList.appendChild(objectItem);
        });
    }
    
    updateThreatAnalysis(predictions) {
        const threats = predictions.filter(obj => ['knife', 'scissors'].includes(obj.class));
        const peopleCount = predictions.filter(obj => obj.class === 'person').length;
        const faceCount = this.faceLandmarks.length;
        const suspiciousItems = predictions.filter(obj => obj.class === 'backpack' && peopleCount === 0);
        
        let threatLevel = 'low';
        let threatText = 'SECURE';
        let threatDetails = 'Environment appears safe. ';
        
        if (threats.length > 0) {
            threatLevel = 'high';
            threatText = 'HIGH THREAT';
            threatDetails = `⚠️ ${threats.length} weapon${threats.length > 1 ? 's' : ''} detected: ${threats.map(t => t.class).join(', ')}. `;
        } else if (suspiciousItems.length > 0) {
            threatLevel = 'medium';
            threatText = 'MONITORING';
            threatDetails = `${suspiciousItems.length} unattended item${suspiciousItems.length > 1 ? 's' : ''} require inspection. `;
        }
        
        threatDetails += `${peopleCount} people detected, ${faceCount} faces tracked.`;
        
        this.elements.threatLevel.className = `threat-level ${threatLevel}`;
        this.elements.threatLevel.textContent = threatText;
        this.elements.threatDetails.textContent = threatDetails;
    }
    
    updateMedicalAnalysis(predictions) {
        const medicalItems = predictions.filter(obj => 
            ['bottle', 'cup', 'scissors', 'syringe', 'toothbrush'].includes(obj.class));
        const peopleCount = predictions.filter(obj => obj.class === 'person').length;
        const faceCount = this.faceLandmarks.length;
        
        let medicalStatus = '';
        if (medicalItems.length > 0) {
            medicalStatus += `${medicalItems.length} medical item${medicalItems.length > 1 ? 's' : ''}: ${medicalItems.map(item => item.class).join(', ')}. `;
        }
        
        medicalStatus += `${peopleCount} patient${peopleCount !== 1 ? 's' : ''} detected, ${faceCount} face${faceCount !== 1 ? 's' : ''} monitored for medical assessment.`;
        
        if (faceCount > 0) {
            medicalStatus += ' Facial monitoring active for signs of distress or medical conditions.';
        }
        
        this.elements.medicalItems.textContent = medicalStatus;
    }
    
    // Voice and interaction methods remain largely the same but updated to include face data
    async processVoiceCommand(command, isManual = false) {
        if (!command || command.trim() === '') return;
        
        this.commandCount++;
        this.elements.commandsProcessed.textContent = this.commandCount;
        
        const timestamp = new Date().toLocaleTimeString();
        this.addMessage('user', command, timestamp);
        
        if (!isManual) {
            this.addActivity(`Voice command: "${command}"`, '🎤');
        } else {
            this.addActivity(`Manual command: "${command}"`, '💻');
        }
        
        const startTime = performance.now();
        
        try {
            const response = await this.aiEngine.generateResponse(
                command, 
                this.detectedObjects, 
                this.faceLandmarks,
                this.currentMission
            );
            
            const endTime = performance.now();
            const responseTime = Math.round(endTime - startTime);
            this.elements.avgResponseTime.textContent = `${responseTime}ms`;
            
            this.addMessage('assistant', response, timestamp);
            this.speak(response);
            
            this.scanCount++;
            this.elements.scansCompleted.textContent = this.scanCount;
            
        } catch (error) {
            console.error('Voice command processing failed:', error);
            const errorMessage = 'I encountered an error processing your command. Please try again.';
            this.addMessage('assistant', errorMessage, timestamp);
            this.speak(errorMessage);
        }
    }
    
    // Additional methods for voice recognition, text-to-speech, UI updates, etc.
    // (Include all the other methods from the original file but update them to handle face data)
    
    async initializeVoiceRecognition() {
        if (!('webkitSpeechRecognition' in window) && !('SpeechRecognition' in window)) {
            console.warn('Speech recognition not supported');
            this.elements.voiceHealth.textContent = 'Not Supported';
            this.elements.voiceHealth.className = 'health-status offline';
            return;
        }
        
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        this.voiceRecognition = new SpeechRecognition();
        
        this.voiceRecognition.continuous = false;
        this.voiceRecognition.interimResults = false;
        this.voiceRecognition.lang = 'en-US';
        
        this.voiceRecognition.onstart = () => {
            console.log('Voice recognition started');
            this.isListening = true;
            this.elements.voiceStatus.textContent = 'Listening...';
            this.elements.listeningPulse.classList.add('active');
            this.elements.voiceToggle.classList.add('listening');
        };
        
        this.voiceRecognition.onresult = (event) => {
            const result = event.results[0];
            if (result.isFinal) {
                const transcript = result[0].transcript.trim();
                console.log('Voice input received:', transcript);
                this.processVoiceCommand(transcript);
            }
        };
        
        this.voiceRecognition.onend = () => {
            console.log('Voice recognition ended');
            this.isListening = false;
            this.elements.voiceStatus.textContent = 'Ready';
            this.elements.listeningPulse.classList.remove('active');
            this.elements.voiceToggle.classList.remove('listening');
        };
        
        this.voiceRecognition.onerror = (event) => {
            console.error('Voice recognition error:', event.error);
            this.isListening = false;
            this.elements.voiceStatus.textContent = 'Error';
            this.elements.listeningPulse.classList.remove('active');
            this.elements.voiceToggle.classList.remove('listening');
        };
        
        this.elements.voiceHealth.textContent = 'Ready';
        this.elements.voiceHealth.className = 'health-status online';
        this.addActivity('Voice recognition initialized', '🎤');
    }
    
    async initializeTextToSpeech() {
        if (!('speechSynthesis' in window)) {
            console.warn('Speech synthesis not supported');
            return;
        }
        
        this.voiceSynthesis = window.speechSynthesis;
        
        // Wait for voices to load
        return new Promise((resolve) => {
            const loadVoices = () => {
                this.availableVoices = this.voiceSynthesis.getVoices();
                
                if (this.availableVoices.length > 0) {
                    // Populate voice select
                    this.elements.voiceSelect.innerHTML = '';
                    this.availableVoices.forEach((voice, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = `${voice.name} (${voice.lang})`;
                        this.elements.voiceSelect.appendChild(option);
                    });
                    
                    // Select default voice (prefer English)
                    const englishVoice = this.availableVoices.find(voice => 
                        voice.lang.startsWith('en') && voice.name.toLowerCase().includes('microsoft')
                    ) || this.availableVoices.find(voice => voice.lang.startsWith('en')) || this.availableVoices[0];
                    
                    this.selectedVoice = englishVoice;
                    const voiceIndex = this.availableVoices.indexOf(englishVoice);
                    this.elements.voiceSelect.value = voiceIndex;
                    
                    this.addActivity('Text-to-speech initialized', '🔊');
                    resolve();
                } else {
                    setTimeout(loadVoices, 100);
                }
            };
            
            if (this.voiceSynthesis.getVoices().length > 0) {
                loadVoices();
            } else {
                this.voiceSynthesis.onvoiceschanged = loadVoices;
            }
        });
    }
    
    speak(text) {
        if (!this.voiceSynthesis || this.isSpeaking) return;
        
        this.voiceSynthesis.cancel(); // Stop any ongoing speech
        
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.voice = this.selectedVoice;
        utterance.rate = this.config.voiceSettings.rate;
        utterance.pitch = this.config.voiceSettings.pitch;
        utterance.volume = this.config.voiceSettings.volume;
        
        utterance.onstart = () => {
            this.isSpeaking = true;
        };
        
        utterance.onend = () => {
            this.isSpeaking = false;
        };
        
        this.voiceSynthesis.speak(utterance);
    }
    
    toggleVoiceControl() {
        if (this.isListening) {
            this.voiceRecognition.stop();
        } else {
            try {
                this.voiceRecognition.start();
            } catch (error) {
                console.error('Failed to start voice recognition:', error);
            }
        }
    }
    
    setVoice(voiceIndex) {
        this.selectedVoice = this.availableVoices[parseInt(voiceIndex)];
    }
    
    updateVoiceSettings(setting, value) {
        this.config.voiceSettings[setting] = parseFloat(value);
        
        // Update display
        if (setting === 'rate') {
            this.elements.rateValue.textContent = `${value}x`;
        } else if (setting === 'volume') {
            this.elements.volumeValue.textContent = `${Math.round(value * 100)}%`;
        }
    }
    
    switchMissionMode(mode) {
        this.currentMission = mode;
        
        // Update UI
        document.querySelectorAll('.mission-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        if (this.elements.aiMode) {
            this.elements.aiMode.textContent = `${mode} MODE`;
        }
        
        this.addActivity(`Mission mode: ${mode}`, '🎯');
        this.speak(`Switching to ${mode.toLowerCase()} mode. All systems adapting for ${mode.toLowerCase()} operations.`);
    }
    
    switchAnalysisTab(tabName) {
        // Remove active class from all tabs and content
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        
        // Add active class to selected tab and content
        document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
        document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    }
    
    clearConversation() {
        this.elements.conversationLog.innerHTML = '';
        this.aiEngine.conversationHistory = [];
        this.addActivity('Conversation cleared', '🗑️');
    }
    
    addMessage(type, text, timestamp = null) {
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
    
    addActivity(text, icon) {
        const activityDiv = document.createElement('div');
        activityDiv.className = 'activity-item';
        
        const timestamp = new Date().toLocaleTimeString();
        
        activityDiv.innerHTML = `
            <div class="activity-icon">${icon}</div>
            <div class="activity-content">
                <div class="activity-text">${text}</div>
                <div class="activity-time">${timestamp}</div>
            </div>
        `;
        
        this.elements.activityLog.insertBefore(activityDiv, this.elements.activityLog.firstChild);
        
        // Keep only the last 20 activity items
        while (this.elements.activityLog.children.length > 20) {
            this.elements.activityLog.removeChild(this.elements.activityLog.lastChild);
        }
    }
    
    updatePerformanceMetrics(processingTime) {
        this.performanceData.push({
            timestamp: Date.now(),
            processingTime: processingTime
        });
        
        // Keep only last 100 data points
        if (this.performanceData.length > 100) {
            this.performanceData.shift();
        }
        
        // Calculate average response time
        const avgTime = this.performanceData.reduce((sum, data) => sum + data.processingTime, 0) / this.performanceData.length;
        this.elements.avgResponseTime.textContent = `${Math.round(avgTime)}ms`;
    }
    
    resetCounters() {
        this.elements.objectCount.textContent = '0';
        this.elements.totalObjects.textContent = '0';
        this.elements.peopleCount.textContent = '0';
        this.elements.itemsCount.textContent = '0';
        if (this.elements.faceCount) {
            this.elements.faceCount.textContent = '0';
        }
        this.elements.objectsTracked.textContent = '0';
        this.elements.fpsCounter.textContent = '0';
        this.elements.detectionRate.textContent = '0/sec';
    }
    
    clearCanvas() {
        const canvas = this.elements.detectionCanvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    
    toggleEmergencyStop() {
        this.isEmergencyActive = !this.isEmergencyActive;
        
        if (this.isEmergencyActive) {
            // Emergency activated
            this.elements.emergencyBtn.textContent = 'EMERGENCY ACTIVE';
            this.elements.emergencyBtn.style.background = 'linear-gradient(45deg, #FF073A, #FF4444)';
            this.stopCamera();
            this.speak('Emergency protocol activated. All systems on standby.');
            this.addActivity('Emergency protocol activated', '🚨');
        } else {
            // Emergency deactivated
            this.elements.emergencyBtn.textContent = 'EMERGENCY STOP';
            this.elements.emergencyBtn.style.background = 'linear-gradient(45deg, var(--accent-red), rgba(var(--color-red-400-rgb), 0.8))';
            this.speak('Emergency protocol deactivated. Systems returning to normal operation.');
            this.addActivity('Emergency protocol deactivated', '✅');
        }
    }
    
    startSystemLoop() {
        // Update system uptime
        setInterval(() => {
            const uptime = Date.now() - this.startTime;
            const hours = Math.floor(uptime / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            this.elements.uptime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
        
        // Update current time
        setInterval(() => {
            this.elements.currentTime.textContent = new Date().toLocaleTimeString();
        }, 1000);
    }
}

// Initialize the system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.guardianX = new GuardianXAssistant();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GuardianXAssistant, GuardianAIEngine };
}