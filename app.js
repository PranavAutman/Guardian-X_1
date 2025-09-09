// Guardian X AI Assistant - Enhanced with Face Mesh Emotion Detection and Charts
// Keeps original UI design, adds face analysis with emotion detection

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
            },
            emotion_analysis: {
                patterns: ['emotion', 'feeling', 'mood', 'expression', 'happy', 'sad', 'angry', 'surprised'],
                response: "Analyzing facial expressions and emotions using advanced face mesh analysis. I can detect happiness, sadness, anger, surprise, fear, disgust, and neutral states."
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
    
    async generateResponse(userInput, detectedObjects, faceLandmarks, emotions, missionMode) {
        const visionContext = this.formatVisionContext(detectedObjects, faceLandmarks, emotions);
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
                return this.generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, emotions, missionMode);
            }
        } catch (error) {
            console.error('AI API error:', error);
            return this.generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, emotions, missionMode);
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
    
    generateIntelligentFallback(userInput, detectedObjects, faceLandmarks, emotions, missionMode) {
        const visionContext = this.formatVisionContext(detectedObjects, faceLandmarks, emotions);
        const hasVision = detectedObjects.length > 0 || faceLandmarks.length > 0;
        const input = userInput.toLowerCase();
        
        if (this.matchesPatterns(input, ['what do you see', 'describe', 'analyze', 'visual', 'look'])) {
            return this.generateVisionResponse(detectedObjects, faceLandmarks, emotions, missionMode);
        }
        
        if (this.matchesPatterns(input, ['emotion', 'feeling', 'mood', 'expression', 'happy', 'sad', 'angry'])) {
            return this.generateEmotionResponse(emotions, faceLandmarks, missionMode);
        }
        
        if (this.matchesPatterns(input, ['face', 'facial', 'person', 'people'])) {
            return this.generateFaceAnalysisResponse(faceLandmarks, detectedObjects, emotions, missionMode);
        }
        
        if (this.matchesPatterns(input, ['threat', 'danger', 'security', 'scan', 'safe', 'concerned about'])) {
            return this.generateThreatResponse(detectedObjects, faceLandmarks, emotions, missionMode);
        }
        
        if (this.matchesPatterns(input, ['medical', 'health', 'patient', 'assessment'])) {
            return this.generateMedicalResponse(detectedObjects, faceLandmarks, emotions, missionMode);
        }
        
        if (this.matchesPatterns(input, ['help', 'what can you do', 'capabilities', 'assist', 'how can you help'])) {
            return this.generateCapabilitiesResponse(missionMode, hasVision);
        }
        
        return this.generateContextualDefault(userInput, detectedObjects, faceLandmarks, emotions, missionMode);
    }
    
    generateVisionResponse(detectedObjects, faceLandmarks, emotions, missionMode) {
        let response = "";
        
        if (detectedObjects.length === 0 && faceLandmarks.length === 0) {
            return "My visual sensors are active but I'm not detecting any objects or faces in the current field of view. Please ensure the camera is properly positioned and the environment is well-lit.";
        }
        
        if (detectedObjects.length > 0) {
            const objectSummary = this.generateObjectSummary(detectedObjects);
            response += `I can see ${objectSummary} in my field of vision. `;
        }
        
        if (faceLandmarks.length > 0) {
            response += `I'm tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with detailed facial landmark analysis active. `;
            
            if (emotions.length > 0) {
                const emotionSummary = emotions.map(e => e.emotion).join(', ');
                response += `Detected emotions: ${emotionSummary}. `;
            }
        }
        
        const modeContext = this.getModeContext(detectedObjects, faceLandmarks, emotions, missionMode);
        return response + modeContext + " All systems are operating within normal parameters.";
    }
    
    generateEmotionResponse(emotions, faceLandmarks, missionMode) {
        if (faceLandmarks.length === 0) {
            return "No faces detected for emotion analysis. Emotion detection systems are ready and will activate when faces are detected.";
        }
        
        if (emotions.length === 0) {
            return `I'm tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} but emotion analysis is still processing. Facial expressions appear neutral or indeterminate.`;
        }
        
        let response = `Emotion analysis results: `;
        emotions.forEach((emotionData, index) => {
            response += `Person ${index + 1} - ${emotionData.emotion} (${Math.round(emotionData.confidence * 100)}% confidence)`;
            if (index < emotions.length - 1) response += ', ';
        });
        
        // Add mission-specific context
        switch (missionMode) {
            case 'MEDICAL':
                response += '. Monitoring for signs of distress, pain, or medical concerns in facial expressions.';
                break;
            case 'DEFENSE':
                response += '. Analyzing emotional patterns for potential threat assessment and behavioral anomalies.';
                break;
            case 'POLICING':
                response += '. Behavioral analysis active for crowd monitoring and public safety assessment.';
                break;
        }
        
        return response;
    }
    
    generateFaceAnalysisResponse(faceLandmarks, detectedObjects, emotions, missionMode) {
        if (faceLandmarks.length === 0) {
            return "No faces detected in current field of view. Face analysis systems are ready and will activate when faces are detected.";
        }
        
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        let response = `Facial analysis active: tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with ${peopleCount} people detected in the scene. `;
        
        if (emotions.length > 0) {
            const emotionList = emotions.map(e => e.emotion).join(', ');
            response += `Current emotions detected: ${emotionList}. `;
        }
        
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
    
    generateThreatResponse(detectedObjects, faceLandmarks, emotions, missionMode) {
        const threats = detectedObjects.filter(obj => ['knife', 'scissors'].includes(obj.class));
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        const suspiciousItems = detectedObjects.filter(obj => obj.class === 'backpack' && peopleCount === 0);
        
        // Check for concerning emotions
        const concerningEmotions = emotions.filter(e => 
            ['angry', 'fear', 'disgust'].includes(e.emotion.toLowerCase())
        );
        
        let response = "";
        
        if (threats.length > 0) {
            response = `⚠️ Alert: Potential threat objects detected - ${threats.map(t => t.class).join(', ')}. `;
        }
        
        if (faceLandmarks.length > 0) {
            response += `Facial analysis indicates ${faceLandmarks.length} individuals under surveillance. `;
            
            if (concerningEmotions.length > 0) {
                response += `⚠️ Emotional concerns detected: ${concerningEmotions.map(e => e.emotion).join(', ')}. `;
            }
        }
        
        if (threats.length > 0 || concerningEmotions.length > 0) {
            response += "Recommend immediate security protocol activation and area assessment.";
        } else if (suspiciousItems.length > 0) {
            response += `Monitoring ${suspiciousItems.length} unattended item${suspiciousItems.length > 1 ? 's' : ''}. Enhanced surveillance protocols active.`;
        } else {
            response += `Environment shows low risk profile with ${peopleCount} people and ${faceLandmarks.length} faces tracked. Security status: nominal.`;
        }
        
        return response;
    }
    
    generateMedicalResponse(detectedObjects, faceLandmarks, emotions, missionMode) {
        const medicalItems = detectedObjects.filter(obj => 
            ['bottle', 'cup', 'scissors', 'syringe', 'toothbrush'].includes(obj.class));
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        
        // Check for medical concern emotions
        const medicalConcerns = emotions.filter(e => 
            ['sad', 'fear', 'disgust'].includes(e.emotion.toLowerCase())
        );
        
        let response = "Medical analysis active. Fluorescence imaging systems engaged. ";
        
        if (faceLandmarks.length > 0) {
            response += `Facial monitoring active for ${faceLandmarks.length} patient${faceLandmarks.length > 1 ? 's' : ''} - analyzing for signs of distress or medical conditions. `;
            
            if (medicalConcerns.length > 0) {
                response += `Medical emotional indicators detected: ${medicalConcerns.map(e => e.emotion).join(', ')} - may indicate patient distress or discomfort. `;
            }
        }
        
        if (medicalItems.length > 0) {
            response += `Detected ${medicalItems.length} medical-related items: ${medicalItems.map(item => item.class).join(', ')}. `;
        }
        
        response += `${peopleCount} individual${peopleCount !== 1 ? 's' : ''} in assessment zone.`;
        
        return response;
    }
    
    generateCapabilitiesResponse(missionMode, hasVision) {
        const visionStatus = hasVision ? "with active visual monitoring" : "ready for visual activation";
        return `Guardian X operational capabilities include: advanced object detection, facial landmark tracking, emotion analysis, expression recognition, threat assessment, medical evaluation, crowd monitoring, and intelligent conversation. Currently in ${missionMode} mode ${visionStatus}. I can analyze any environment and respond to complex questions about what I observe, including emotional states and behavioral patterns.`;
    }
    
    generateContextualDefault(userInput, detectedObjects, faceLandmarks, emotions, missionMode) {
        if (detectedObjects.length > 0 || faceLandmarks.length > 0) {
            const objectCount = detectedObjects.length;
            const faceCount = faceLandmarks.length;
            const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
            const emotionSummary = emotions.length > 0 ? ` with emotions: ${emotions.map(e => e.emotion).join(', ')}` : '';
            return `I'm currently monitoring ${objectCount} objects and tracking ${faceCount} faces including ${peopleCount} people in ${missionMode} mode${emotionSummary}. Could you be more specific about what analysis or information you need? I can discuss threats, medical concerns, facial analysis, emotions, or general observations.`;
        }
        
        return `Guardian X ready to assist with any questions or analysis. Please activate the camera system for comprehensive environmental assessment including object detection, facial analysis, and emotion recognition, or ask me about my capabilities, mission modes, or technical specifications.`;
    }
    
    formatVisionContext(detectedObjects, faceLandmarks, emotions) {
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
            
            if (emotions.length > 0) {
                const emotionList = emotions.map(e => e.emotion).join(', ');
                context += ` with emotions: ${emotionList}`;
            }
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
    
    getModeContext(objects, faceLandmarks, emotions, missionMode) {
        const peopleCount = objects.filter(obj => obj.class === 'person').length;
        const faceCount = faceLandmarks.length;
        const emotionContext = emotions.length > 0 ? ` Emotions detected: ${emotions.map(e => e.emotion).join(', ')}.` : '';
        
        switch (missionMode) {
            case 'MEDICAL':
                return `Medical assessment protocols active. ${peopleCount} individual${peopleCount !== 1 ? 's' : ''} and ${faceCount} faces ready for health evaluation.${emotionContext}`;
            case 'DEFENSE':
                return `Tactical analysis engaged. Monitoring for potential threats with facial recognition active.${emotionContext}`;
            case 'POLICING':
            default:
                return `Standard surveillance protocols active. Behavioral analysis systems monitoring all detected entities and faces.${emotionContext}`;
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

// Enhanced Guardian X Assistant System - with Emotion Detection and Charts
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
        this.detectedEmotions = [];
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
            
            this.updateLoadingProgress(92, "Initializing Performance Charts...");
            this.initializeCharts();
            
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
    
    initializeCharts() {
        try {
            // Initialize performance chart if Chart.js is available
            if (typeof Chart !== 'undefined') {
                const chartElement = document.getElementById('performanceChart');
                if (chartElement) {
                    this.charts.performance = new Chart(chartElement, {
                        type: 'line',
                        data: {
                            labels: [],
                            datasets: [{
                                label: 'Processing Time (ms)',
                                data: [],
                                borderColor: '#00FFFF',
                                backgroundColor: 'rgba(0, 255, 255, 0.1)',
                                tension: 0.4
                            }]
                        },
                        options: {
                            responsive: true,
                            maintainAspectRatio: false,
                            scales: {
                                y: {
                                    beginAtZero: true,
                                    grid: { color: 'rgba(0, 255, 255, 0.1)' },
                                    ticks: { color: '#00FFFF' }
                                },
                                x: {
                                    grid: { color: 'rgba(0, 255, 255, 0.1)' },
                                    ticks: { color: '#00FFFF' }
                                }
                            },
                            plugins: {
                                legend: { labels: { color: '#00FFFF' } }
                            }
                        }
                    });
                }
            } else {
                console.warn('Chart.js not available, creating simple performance display');
                this.createSimplePerformanceChart();
            }
        } catch (error) {
            console.error('Failed to initialize charts:', error);
            this.createSimplePerformanceChart();
        }
    }
    
    createSimplePerformanceChart() {
        // Create a simple text-based performance display
        const chartContainer = document.querySelector('.chart-container') || 
                              document.querySelector('#performanceChart')?.parentElement;
        
        if (chartContainer) {
            chartContainer.innerHTML = `
                <div class="simple-performance-chart">
                    <div class="performance-metric">
                        <span class="metric-label">Avg Processing:</span>
                        <span class="metric-value" id="avgProcessingTime">0ms</span>
                    </div>
                    <div class="performance-metric">
                        <span class="metric-label">Peak Processing:</span>
                        <span class="metric-value" id="peakProcessingTime">0ms</span>
                    </div>
                    <div class="performance-metric">
                        <span class="metric-label">FPS Average:</span>
                        <span class="metric-value" id="avgFPS">0</span>
                    </div>
                    <div class="performance-bars">
                        <div class="performance-bar">
                            <span>CPU Load</span>
                            <div class="bar-container">
                                <div class="bar-fill" id="cpuLoad" style="width: 0%"></div>
                            </div>
                        </div>
                        <div class="performance-bar">
                            <span>AI Processing</span>
                            <div class="bar-container">
                                <div class="bar-fill" id="aiLoad" style="width: 0%"></div>
                            </div>
                        </div>
                    </div>
                </div>
            `;
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
        
        this.isInitialized = true;
        this.addActivity('Guardian X AI systems online', '✅');
        
        // Check if API key is configured
        const hasApiKey = this.aiEngine.apiKey && this.aiEngine.apiKey.trim() !== "";
        let greeting;
        
        if (hasApiKey) {
            greeting = "Guardian X AI online with Google Gemini integration and MediaPipe face analysis with emotion detection. Advanced conversational intelligence with facial landmark detection and emotional analysis active. I can now answer any question, analyze complex scenarios, track faces, detect emotions, and engage in natural dialogue while monitoring your environment.";
            this.elements.statusTicker.textContent = '🤖 Guardian X AI operational • 🧠 Gemini AI processing active • 👤 Face tracking enabled • 😊 Emotion detection active • 📹 Vision-integrated responses ready';
        } else {
            greeting = "Guardian X systems online with MediaPipe face tracking and emotion detection. Please configure your Google Gemini API key to enable advanced conversational AI capabilities. Object detection, face analysis, emotion recognition and basic functions are operational.";
            this.elements.statusTicker.textContent = '🤖 Guardian X operational • 👤 Face tracking active • 😊 Emotion detection ready • ⚠️ API key required for AI features • 📹 Basic vision functions active';
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
                            
                            this.addActivity('Camera activated with face tracking and emotion detection', '📹');
                            this.speak("Visual systems online. AI-powered environmental analysis, facial tracking, and emotion detection beginning.");
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
                errorMessage = "Camera permission denied. Please allow camera access for visual AI analysis with face tracking and emotion detection.";
            } else if (error.name === 'NotFoundError') {
                errorMessage = "No camera detected. Please connect a camera for enhanced AI capabilities with facial analysis and emotion recognition.";
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
            this.resetCounters();
            
            this.addActivity('Camera deactivated', '📹');
            this.speak("Visual systems offline. AI responses will be limited without environmental context, facial analysis, and emotion detection.");
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
        console.log('Starting AI-enhanced object detection with face analysis and emotion detection...');
        
        const detectLoop = async () => {
            if (!this.isDetecting || this.elements.cameraVideo.paused || this.elements.cameraVideo.ended) {
                return;
            }
            
            const startTime = performance.now();
            
            try {
                if (this.elements.cameraVideo.readyState >= 2) {
                    // Object detection
                    const predictions = await this.objectModel.detect(this.elements.cameraVideo);
                    
                    // Face landmark detection with emotion analysis
                    let faceResults = [];
                    let emotions = [];
                    if (this.faceLandmarker) {
                        try {
                            const faceDetection = this.faceLandmarker.detectForVideo(
                                this.elements.cameraVideo,
                                performance.now()
                            );
                            faceResults = faceDetection.faceLandmarks || [];
                            
                            // Analyze emotions from face landmarks and blend shapes
                            if (faceDetection.faceBlendshapes && faceDetection.faceBlendshapes.length > 0) {
                                emotions = this.analyzeEmotionsFromBlendshapes(faceDetection.faceBlendshapes);
                            } else if (faceResults.length > 0) {
                                // Fallback emotion analysis from landmarks
                                emotions = this.analyzeEmotionsFromLandmarks(faceResults);
                            }
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
                    this.detectedEmotions = emotions;
                    
                    this.drawDetections(filteredPredictions, faceResults, emotions);
                    this.updateObjectDisplay(filteredPredictions);
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
    
   // Full emotion detection code block to replace in your class

analyzeEmotionsFromBlendShapes(faceBlendshapes) {
    const emotions = [];
    faceBlendshapes.forEach((blendshapes, faceIndex) => {
        if (blendshapes && blendshapes.categories) {
            const emotionScores = {
                happy: 0,
                sad: 0,
                angry: 0,
                surprised: 0,
                fear: 0,
                disgust: 0,
                neutral: 0
            };
            blendshapes.categories.forEach(category => {
                const name = category.categoryName.toLowerCase();
                const score = category.score;
                if (name.includes('smile') || name.includes('mouth_smile')) {
                    emotionScores.happy = Math.max(emotionScores.happy, score);
                } else if (name.includes('frown') || name.includes('mouth_frown')) {
                    emotionScores.sad = Math.max(emotionScores.sad, score);
                } else if (name.includes('brow_down') || name.includes('squint')) {
                    emotionScores.angry = Math.max(emotionScores.angry, score * 0.6);
                } else if (name.includes('eye_wide') || name.includes('brow_up')) {
                    emotionScores.surprised = Math.max(emotionScores.surprised, score);
                } else if (name.includes('jaw_open') && score > 0.2) {
                    emotionScores.surprised = Math.max(emotionScores.surprised, score);
                } else if (name.includes('nose_wrinkle') || name.includes('upper_lip_raise')) {
                    emotionScores.disgust = Math.max(emotionScores.disgust, score * 0.8);
                } else if (name.includes('mouth_press') || name.includes('lip_tighten')) {
                    emotionScores.fear = Math.max(emotionScores.fear, score * 0.6);
                    emotionScores.angry = Math.max(emotionScores.angry, score * 0.4);
                }
            });
            emotionScores.neutral = 0.15;

            let maxEmotion = 'neutral';
            let maxScore = 0.08; // Lowered threshold for higher sensitivity

            Object.entries(emotionScores).forEach(([emotion, score]) => {
                if (score > maxScore) {
                    maxEmotion = emotion;
                    maxScore = score;
                }
            });

            emotions.push({
                faceIndex,
                emotion: maxEmotion,
                confidence: maxScore,
                allScores: emotionScores
            });
        } else {
            emotions.push({
                faceIndex,
                emotion: 'neutral',
                confidence: 0.2,
                allScores: { neutral: 0.2 }
            });
        }
    });
    return emotions;
},

analyzeEmotionsFromLandmarks(faceLandmarks) {
    const emotions = [];
    faceLandmarks.forEach((landmarks, faceIndex) => {
        if (landmarks && landmarks.length) {
            const emotionScores = {
                happy: this.detectSmile(landmarks),
                sad: this.detectSadness(landmarks),
                angry: this.detectAngry(landmarks),
                surprised: this.detectSurprise(landmarks),
                fear: this.detectFear(landmarks),
                disgust: this.detectDisgust(landmarks),
                neutral: 0.1
            };
            let maxEmotion = 'neutral';
            let maxScore = 0.08;
            Object.entries(emotionScores).forEach(([emotion, score]) => {
                if (score > maxScore) {
                    maxEmotion = emotion;
                    maxScore = score;
                }
            });
            emotions.push({
                faceIndex,
                emotion: maxEmotion,
                confidence: maxScore,
                allScores: emotionScores
            });
        }
    });
    return emotions;
},

detectSmile(landmarks) {
    try {
        if (landmarks.length >= 468) {
            const leftMouth = landmarks[61];
            const rightMouth = landmarks[291];
            const centerMouth = landmarks[13];
            if (leftMouth && rightMouth && centerMouth) {
                const mouthCurvature = (leftMouth.y + rightMouth.y) / 2 - centerMouth.y;
                return Math.min(1, Math.max(0, mouthCurvature * 12));
            }
        }
    } catch (e) {
        console.warn('Smile detection error:', e);
    }
    return 0;
},

detectSadness(landmarks) {
    try {
        if (landmarks.length >= 468) {
            const leftMouth = landmarks[61];
            const rightMouth = landmarks[291];
            const centerMouth = landmarks[13];
            const browLeft = landmarks[55];
            const browRight = landmarks[285];
            if (leftMouth && rightMouth && centerMouth && browLeft && browRight) {
                const mouthCurvature = centerMouth.y - (leftMouth.y + rightMouth.y) / 2;
                const browAvg = (browLeft.y + browRight.y) / 2;
                const browBaseline = 0.4;
                const browLowering = Math.max(0, browAvg - browBaseline);
                const mouthScore = Math.min(1, Math.max(0, mouthCurvature * 12));
                const browScore = Math.min(1, Math.max(0, browLowering * 7));
                const totalScore = mouthScore * 0.7 + browScore * 0.3;
                return Math.min(1, totalScore);
            }
        }
    } catch (e) {
        console.warn('Sadness detection error:', e);
    }
    return 0;
},

detectAngry(landmarks) {
    try {
        if (landmarks.length >= 468) {
            const browLeft = landmarks[105];
            const browRight = landmarks[334];
            const eyeLeft = landmarks[133];
            const eyeRight = landmarks[362];
            if (browLeft && browRight && eyeLeft && eyeRight) {
                const browLower = Math.max(browLeft.y, browRight.y);
                const eyeSquint = Math.min(
                    Math.abs(landmarks[159].y - landmarks[145].y),
                    Math.abs(landmarks[386].y - landmarks[374].y)
                );
                const browScore = Math.min(1, Math.max(0, (browLower - 0.44) * 15));
                const eyeScore = Math.min(1, Math.max(0, (0.03 - eyeSquint) * 40));
                return Math.min(1, browScore + eyeScore);
            }
        }
    } catch (e) {
        console.warn('Anger detection error:', e);
    }
    return 0;
},

detectSurprise(landmarks) {
    try {
        if (landmarks.length >= 468) {
            const eyeTopLeft = landmarks[159];
            const eyeBottomLeft = landmarks[145];
            const eyeTopRight = landmarks[386];
            const eyeBottomRight = landmarks[374];
            const jawTip = landmarks[152];
            const upperLip = landmarks[13];
            if (eyeTopLeft && eyeBottomLeft && eyeTopRight && eyeBottomRight && jawTip && upperLip) {
                const eyeOpenLeft = Math.abs(eyeTopLeft.y - eyeBottomLeft.y);
                const eyeOpenRight = Math.abs(eyeTopRight.y - eyeBottomRight.y);
                const avgEyeOpen = (eyeOpenLeft + eyeOpenRight) / 2;
                const mouthOpen = Math.abs(jawTip.y - upperLip.y);
                const eyeScore = Math.min(1, Math.max(0, (avgEyeOpen - 0.018) * 130));
                const mouthScore = Math.min(1, Math.max(0, (mouthOpen - 0.06) * 25));
                return Math.max(eyeScore, mouthScore * 0.8);
            }
        }
    } catch (e) {
        console.warn('Surprise detection error:', e);
    }
    return 0;
},

detectFear(landmarks) {
    try {
        if (landmarks.length >= 468) {
            const browInnerLeft = landmarks[70];
            const browInnerRight = landmarks[300];
            const upperLip = landmarks[13];
            const noseBase = landmarks[168];
            if (browInnerLeft && browInnerRight && upperLip && noseBase) {
                const browHeight = Math.min(browInnerLeft.y, browInnerRight.y);
                const lipNoseDist = noseBase.y - upperLip.y;
                const browScore = Math.min(1, Math.max(0, (0.35 - browHeight) * 25));
                const lipScore = Math.min(1, Math.max(0, lipNoseDist * 15));
                return Math.min(1, browScore * 0.6 + lipScore * 0.4);
            }
        }
    } catch (e) {
        console.warn('Fear detection error:', e);
    }
    return 0;
},

detectDisgust(landmarks) {
    try {
        if (landmarks.length >= 468) {
            const noseLeft = landmarks[4];
            const noseRight = landmarks[274];
            const upperLipLeft = landmarks[13];
            const upperLipRight = landmarks[14];
            if (noseLeft && noseRight && upperLipLeft && upperLipRight) {
                const noseWrinkle = Math.max(noseLeft.x - 0.5, noseRight.x - 0.5);
                const lipRaise = Math.max(upperLipLeft.y, upperLipRight.y);
                return Math.min(1, noseWrinkle * 20 + (0.5 - lipRaise) * 20);
            }
        }
    } catch (e) {
        console.warn('Disgust detection error:', e);
    }
    return 0;
}
    
    drawDetections(predictions, faceResults, emotions) {
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
        
        // Draw face landmarks with emotion indicators
        if (faceResults.length > 0) {
            try {
                ctx.save();
                faceResults.forEach((landmarks, index) => {
                    // Get emotion for this face
                    const emotion = emotions.find(e => e.faceIndex === index);
                    const emotionText = emotion ? `${emotion.emotion} (${Math.round(emotion.confidence * 100)}%)` : 'analyzing...';
                    
                    // Draw face landmarks with different colors based on mission mode
                    let faceColor = '#FFD700'; // Gold default
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
                    
                    // Color code emotions
                    if (emotion) {
                        switch (emotion.emotion) {
                            case 'happy':
                                faceColor = '#00FF00'; // Green for happy
                                break;
                            case 'sad':
                                faceColor = '#0088FF'; // Blue for sad
                                break;
                            case 'angry':
                                faceColor = '#FF0000'; // Red for angry
                                break;
                            case 'surprised':
                                faceColor = '#FFFF00'; // Yellow for surprised
                                break;
                            case 'fear':
                                faceColor = '#FF8800'; // Orange for fear
                                break;
                            case 'disgust':
                                faceColor = '#8800FF'; // Purple for disgust
                                break;
                            default:
                                faceColor = '#FFFFFF'; // White for neutral
                        }
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
                        
                        // Draw face ID and emotion
                        if (landmarks.length > 0) {
                            const firstPoint = landmarks[0];
                            const x = firstPoint.x * canvas.width;
                            const y = firstPoint.y * canvas.height;
                            
                            ctx.font = '12px Courier New';
                            const labelText = `Face ${index + 1}: ${emotionText}`;
                            const textWidth = ctx.measureText(labelText).width;
                            
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                            ctx.fillRect(x - 20, y - 45, textWidth + 10, 30);
                            ctx.fillStyle = faceColor;
                            ctx.fillText(labelText, x - 15, y - 30);
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
        const faceCount = this.faceLandmarks.length;
        
        this.elements.objectCount.textContent = totalObjects;
        this.elements.totalObjects.textContent = totalObjects;
        this.elements.peopleCount.textContent = peopleCount;
        this.elements.itemsCount.textContent = itemsCount;
        this.elements.objectsTracked.textContent = totalObjects;
        
        this.updateObjectList(predictions);
        this.updateThreatAnalysis(predictions);
        this.updateMedicalAnalysis(predictions);
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
        
        if (Object.keys(objectCounts).length === 0 && this.faceLandmarks.length === 0) {
            this.elements.objectList.innerHTML = '<div class="no-detections">No objects or faces detected</div>';
            return;
        }
        
        // Add objects
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
        
        // Add face information with emotions
        if (this.faceLandmarks.length > 0) {
            const faceItem = document.createElement('div');
            faceItem.className = 'object-item face-detection';
            
            let emotionSummary = 'Tracked';
            if (this.detectedEmotions.length > 0) {
                const emotionList = this.detectedEmotions.map(e => 
                    `${e.emotion} (${Math.round(e.confidence * 100)}%)`
                ).join(', ');
                emotionSummary = emotionList;
            }
            
            faceItem.innerHTML = `
                <div class="object-info">
                    <span class="object-name">👤 Faces</span>
                    <span class="object-count">×${this.faceLandmarks.length}</span>
                </div>
                <div class="object-confidence">
                    <span class="confidence-value">${emotionSummary}</span>
                </div>
            `;
            this.elements.objectList.appendChild(faceItem);
        }
    }
    
    updateThreatAnalysis(predictions) {
        const threats = predictions.filter(obj => ['knife', 'scissors'].includes(obj.class));
        const peopleCount = predictions.filter(obj => obj.class === 'person').length;
        const faceCount = this.faceLandmarks.length;
        const suspiciousItems = predictions.filter(obj => obj.class === 'backpack' && peopleCount === 0);
        
        // Check for concerning emotions
        const concerningEmotions = this.detectedEmotions.filter(e => 
            ['angry', 'fear', 'disgust'].includes(e.emotion.toLowerCase())
        );
        
        let threatLevel = 'low';
        let threatText = 'SECURE';
        let threatDetails = 'Environment appears safe. ';
        
        if (threats.length > 0) {
            threatLevel = 'high';
            threatText = 'HIGH THREAT';
            threatDetails = `⚠️ ${threats.length} weapon${threats.length > 1 ? 's' : ''} detected: ${threats.map(t => t.class).join(', ')}. `;
        } else if (concerningEmotions.length > 0) {
            threatLevel = 'medium';
            threatText = 'EMOTIONAL CONCERN';
            threatDetails = `⚠️ Concerning emotions detected: ${concerningEmotions.map(e => e.emotion).join(', ')}. `;
        } else if (suspiciousItems.length > 0) {
            threatLevel = 'medium';
            threatText = 'MONITORING';
            threatDetails = `${suspiciousItems.length} unattended item${suspiciousItems.length > 1 ? 's' : ''} require inspection. `;
        }
        
        threatDetails += `${peopleCount} people detected, ${faceCount} faces tracked with emotion analysis.`;
        
        if (this.detectedEmotions.length > 0) {
            const emotionSummary = this.detectedEmotions.map(e => e.emotion).join(', ');
            threatDetails += ` Current emotions: ${emotionSummary}.`;
        }
        
        this.elements.threatLevel.className = `threat-level ${threatLevel}`;
        this.elements.threatLevel.textContent = threatText;
        this.elements.threatDetails.textContent = threatDetails;
    }
    
    updateMedicalAnalysis(predictions) {
        const medicalItems = predictions.filter(obj => 
            ['bottle', 'cup', 'scissors', 'syringe', 'toothbrush'].includes(obj.class));
        const peopleCount = predictions.filter(obj => obj.class === 'person').length;
        const faceCount = this.faceLandmarks.length;
        
        // Check for medical concern emotions
        const medicalConcerns = this.detectedEmotions.filter(e => 
            ['sad', 'fear', 'disgust'].includes(e.emotion.toLowerCase())
        );
        
        let medicalStatus = '';
        if (medicalItems.length > 0) {
            medicalStatus += `${medicalItems.length} medical item${medicalItems.length > 1 ? 's' : ''}: ${medicalItems.map(item => item.class).join(', ')}. `;
        }
        
        medicalStatus += `${peopleCount} patient${peopleCount !== 1 ? 's' : ''} detected, ${faceCount} face${faceCount !== 1 ? 's' : ''} monitored with emotion analysis for medical assessment.`;
        
        if (faceCount > 0) {
            medicalStatus += ' Facial monitoring active for signs of distress or medical conditions.';
            
            if (medicalConcerns.length > 0) {
                medicalStatus += ` Medical emotional indicators detected: ${medicalConcerns.map(e => e.emotion).join(', ')} - may indicate patient distress or discomfort.`;
            }
        }
        
        this.elements.medicalItems.textContent = medicalStatus;
    }
    
    // Voice and interaction methods updated to include emotion data
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
                this.detectedEmotions,
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
        this.speak(`Switching to ${mode.toLowerCase()} mode. All systems adapting for ${mode.toLowerCase()} operations with enhanced facial analysis and emotion detection.`);
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
        
        // Update charts if available
        this.updatePerformanceChart(processingTime);
        
        // Update simple performance display
        this.updateSimplePerformanceDisplay(processingTime);
    }
    
    updatePerformanceChart(processingTime) {
        if (this.charts.performance) {
            const chart = this.charts.performance;
            const now = new Date().toLocaleTimeString();
            
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(processingTime);
            
            // Keep only last 20 data points
            if (chart.data.labels.length > 20) {
                chart.data.labels.shift();
                chart.data.datasets[0].data.shift();
            }
            
            chart.update('none');
        }
    }
    
    updateSimplePerformanceDisplay(processingTime) {
        const avgProcessingElement = document.getElementById('avgProcessingTime');
        const peakProcessingElement = document.getElementById('peakProcessingTime');
        const avgFPSElement = document.getElementById('avgFPS');
        const cpuLoadElement = document.getElementById('cpuLoad');
        const aiLoadElement = document.getElementById('aiLoad');
        
        if (avgProcessingElement) {
            const avgTime = this.performanceData.reduce((sum, data) => sum + data.processingTime, 0) / this.performanceData.length;
            avgProcessingElement.textContent = `${Math.round(avgTime)}ms`;
        }
        
        if (peakProcessingElement) {
            const peakTime = Math.max(...this.performanceData.map(d => d.processingTime));
            peakProcessingElement.textContent = `${Math.round(peakTime)}ms`;
        }
        
        if (avgFPSElement) {
            const fps = this.elements.fpsCounter.textContent || '0';
            avgFPSElement.textContent = fps;
        }
        
        // Simulate CPU and AI load based on processing time
        if (cpuLoadElement && aiLoadElement) {
            const cpuLoad = Math.min(100, Math.round((processingTime / 100) * 100));
            const aiLoad = Math.min(100, Math.round((processingTime / 50) * 100));
            
            cpuLoadElement.style.width = `${cpuLoad}%`;
            aiLoadElement.style.width = `${aiLoad}%`;
            
            // Color coding for load levels
            cpuLoadElement.style.backgroundColor = cpuLoad > 80 ? '#FF073A' : cpuLoad > 50 ? '#FFFF00' : '#00FF00';
            aiLoadElement.style.backgroundColor = aiLoad > 80 ? '#FF073A' : aiLoad > 50 ? '#FFFF00' : '#00FF00';
        }
    }
    
    resetCounters() {
        this.elements.objectCount.textContent = '0';
        this.elements.totalObjects.textContent = '0';
        this.elements.peopleCount.textContent = '0';
        this.elements.itemsCount.textContent = '0';
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
