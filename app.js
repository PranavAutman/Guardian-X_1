// Guardian X AI Assistant - Ultimate Performance with Full Face Mesh and face-api.js Emotion Detection
// Best-in-class emotion detection with complete visible face mesh for maximum visual appeal

class GuardianAIEngine {
    constructor() {
        this.config = {
            model: "gemini-1.5-flash",
            maxTokens: 512,
            temperature: 0.3,
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
                response: "Analyzing facial expressions and emotions using advanced face mesh analysis with professional-grade emotion detection libraries."
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
            response += `I'm tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with complete mesh visualization and professional-grade emotion detection active. `;
            
            if (emotions.length > 0) {
                const emotionSummary = emotions.map(e => {
                    let emotionStr = `${e.emotion} (${Math.round(e.confidence * 100)}%)`;
                    return emotionStr;
                }).join(', ');
                response += `Professional emotion analysis: ${emotionSummary}. `;
            }
        }
        
        const modeContext = this.getModeContext(detectedObjects, faceLandmarks, emotions, missionMode);
        return response + modeContext + " All advanced systems operating at peak performance.";
    }
    
    generateEmotionResponse(emotions, faceLandmarks, missionMode) {
        if (faceLandmarks.length === 0) {
            return "No faces detected for emotion analysis. Professional-grade emotion detection systems are ready and will activate when faces are detected.";
        }
        
        if (emotions.length === 0) {
            return `I'm tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with complete mesh visualization but emotion analysis is still processing facial expressions.`;
        }
        
        let response = `Professional emotion detection results: `;
        emotions.forEach((emotionData, index) => {
            response += `Person ${index + 1} - ${emotionData.emotion} (${Math.round(emotionData.confidence * 100)}% confidence)`;
            if (index < emotions.length - 1) response += ', ';
        });
        
        // Add mission-specific context
        switch (missionMode) {
            case 'MEDICAL':
                response += '. Professional monitoring for medical distress indicators in facial expressions.';
                break;
            case 'DEFENSE':
                response += '. Advanced threat assessment through professional behavioral pattern analysis.';
                break;
            case 'POLICING':
                response += '. Professional crowd monitoring and public safety behavioral analysis.';
                break;
        }
        
        return response;
    }
    
    generateFaceAnalysisResponse(faceLandmarks, detectedObjects, emotions, missionMode) {
        if (faceLandmarks.length === 0) {
            return "No faces detected in current field of view. Professional face analysis systems with complete mesh visualization are ready and will activate when faces are detected.";
        }
        
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        let response = `Professional facial analysis active: tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with complete mesh visualization and ${peopleCount} people detected. `;
        
        if (emotions.length > 0) {
            const emotionList = emotions.map(e => 
                `${e.emotion} (${Math.round(e.confidence * 100)}%)`
            ).join(', ');
            response += `Professional emotions detected: ${emotionList}. `;
        }
        
        switch (missionMode) {
            case 'MEDICAL':
                response += "Professional monitoring for medical indicators and patient distress signals.";
                break;
            case 'DEFENSE':
                response += "Advanced threat assessment with professional behavioral anomaly detection.";
                break;
            case 'POLICING':
                response += "Professional facial recognition and crowd behavior monitoring active.";
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
            response += `Professional facial monitoring: ${faceLandmarks.length} individuals under surveillance with complete mesh analysis. `;
            
            if (concerningEmotions.length > 0) {
                const concernList = concerningEmotions.map(e => 
                    `${e.emotion} (${Math.round(e.confidence * 100)}%)`
                ).join(', ');
                response += `⚠️ Behavioral concerns detected: ${concernList}. `;
            }
        }
        
        if (threats.length > 0 || concerningEmotions.length > 0) {
            response += "Recommend immediate security assessment.";
        } else if (suspiciousItems.length > 0) {
            response += `Monitoring ${suspiciousItems.length} unattended item${suspiciousItems.length > 1 ? 's' : ''}. Enhanced surveillance active.`;
        } else {
            response += `Secure environment: ${peopleCount} people, ${faceLandmarks.length} faces tracked with professional analysis. Security status: nominal.`;
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
        
        let response = "Professional medical analysis active. Complete facial monitoring systems engaged. ";
        
        if (faceLandmarks.length > 0) {
            response += `Monitoring ${faceLandmarks.length} patient${faceLandmarks.length > 1 ? 's' : ''} with complete mesh visualization for distress indicators. `;
            
            if (medicalConcerns.length > 0) {
                const concernList = medicalConcerns.map(e => 
                    `${e.emotion} (${Math.round(e.confidence * 100)}%)`
                ).join(', ');
                response += `Medical emotional indicators: ${concernList} - potential patient discomfort detected. `;
            }
        }
        
        if (medicalItems.length > 0) {
            response += `Medical equipment detected: ${medicalItems.map(item => item.class).join(', ')}. `;
        }
        
        response += `${peopleCount} individual${peopleCount !== 1 ? 's' : ''} in assessment area.`;
        return response;
    }
    
    generateCapabilitiesResponse(missionMode, hasVision) {
        const visionStatus = hasVision ? "with active professional monitoring" : "ready for professional activation";
        return `Guardian X capabilities: advanced object detection, complete face mesh visualization, professional-grade emotion detection, threat assessment, medical evaluation, crowd monitoring, intelligent conversation. Currently in ${missionMode} mode ${visionStatus}. Professional analysis with complete mesh visualization and industry-standard emotion recognition active.`;
    }
    
    generateContextualDefault(userInput, detectedObjects, faceLandmarks, emotions, missionMode) {
        if (detectedObjects.length > 0 || faceLandmarks.length > 0) {
            const objectCount = detectedObjects.length;
            const faceCount = faceLandmarks.length;
            const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
            const emotionSummary = emotions.length > 0 ? ` with professional emotions: ${emotions.map(e => 
                `${e.emotion} (${Math.round(e.confidence * 100)}%)`
            ).join(', ')}` : '';
            return `Professional monitoring active: ${objectCount} objects, ${faceCount} faces with complete mesh visualization, ${peopleCount} people in ${missionMode} mode${emotionSummary}. How can I assist with threat analysis, medical assessment, or behavioral evaluation?`;
        }
        
        return `Guardian X ready for deployment. Activate camera systems for comprehensive professional analysis including complete face mesh visualization and industry-standard emotion detection, or ask about capabilities and mission specifications.`;
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
                const emotionList = emotions.map(e => 
                    `${e.emotion} (${Math.round(e.confidence * 100)}%)`
                ).join(', ');
                context += ` with professional emotions: ${emotionList}`;
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
        const emotionContext = emotions.length > 0 ? ` Professional emotions: ${emotions.map(e => 
            `${e.emotion} (${Math.round(e.confidence * 100)}%)`
        ).join(', ')}.` : '';
        
        switch (missionMode) {
            case 'MEDICAL':
                return `Professional medical protocols active. ${peopleCount} individual${peopleCount !== 1 ? 's' : ''} and ${faceCount} faces with complete mesh ready for assessment.${emotionContext}`;
            case 'DEFENSE':
                return `Advanced tactical analysis engaged. Professional monitoring with complete mesh visualization active.${emotionContext}`;
            case 'POLICING':
            default:
                return `Professional surveillance protocols active. Complete behavioral analysis monitoring all entities.${emotionContext}`;
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

// Ultimate Guardian X Assistant System with Professional Face API Integration
class GuardianXAssistant {
    constructor() {
        // Initialize AI Engine
        this.aiEngine = new GuardianAIEngine();
        
        // Guardian X personality and configuration
        this.guardianData = {
            name: "Guardian X",
            role: "First-generation robot developed by BIT Robotics", 
            mission: "Saving lives through AI, VR, thermo-vision, and professional-grade facial analysis"
        };
        
        this.config = {
            frameRate: 30,
            detectionInterval: 100,
            confidenceThreshold: 0.3,
            maxDetections: 20,
            voiceSettings: {
                rate: 0.9,
                pitch: 0.8,
                volume: 0.8
            }
        };
        
        // Mission modes with professional-grade emotion detection
        this.missionModes = {
            MEDICAL: {
                priorityObjects: ["person", "bottle", "cup", "syringe", "scissors"],
                threatLevel: "low",
                detectionSensitivity: 0.3,
                aiContext: "Medical mode focuses on health assessment and professional patient monitoring",
                faceAnalysis: true
            },
            DEFENSE: {
                priorityObjects: ["person", "car", "truck", "backpack", "knife"],
                threatLevel: "high", 
                detectionSensitivity: 0.2,
                aiContext: "Defense mode emphasizes threat detection and professional tactical analysis",
                faceAnalysis: true
            },
            POLICING: {
                priorityObjects: ["person", "car", "handbag", "cell phone", "laptop"],
                threatLevel: "medium",
                detectionSensitivity: 0.3,
                aiContext: "Policing mode monitors crowds and maintains professional public safety",
                faceAnalysis: true
            }
        };
        
        // System state
        this.isInitialized = false;
        this.currentMission = "POLICING";
        this.cameraStream = null;
        this.objectModel = null;
        this.faceLandmarker = null;
        this.faceApiModels = null; // Professional emotion detection
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
            this.updateLoadingProgress(5, "Initializing Professional AI Engine...");
            await new Promise(resolve => setTimeout(resolve, 300));
            
            this.updateLoadingProgress(15, "Loading TensorFlow.js...");
            await tf.ready();
            
            this.updateLoadingProgress(25, "Loading Object Detection Model...");
            await this.loadObjectModel();
            
            this.updateLoadingProgress(35, "Loading Professional Face-API Models...");
            await this.loadFaceApiModels();
            
            this.updateLoadingProgress(50, "Loading MediaPipe Face Mesh...");
            await this.loadFaceLandmarker();
            
            this.updateLoadingProgress(65, "Setting up Camera System...");
            await this.enumerateCameras();
            
            this.updateLoadingProgress(75, "Initializing Voice Recognition...");
            await this.initializeVoiceRecognition();
            
            this.updateLoadingProgress(85, "Setting up Text-to-Speech...");
            await this.initializeTextToSpeech();
            
            this.updateLoadingProgress(92, "Initializing Performance Systems...");
            this.initializeCharts();
            
            this.updateLoadingProgress(95, "Starting Professional Loops...");
            this.startSystemLoop();
            
            this.updateLoadingProgress(100, "Guardian X Professional Ready!");
            
            setTimeout(() => {
                this.completeInitialization();
            }, 1000);
            
        } catch (error) {
            console.error('System initialization failed:', error);
            this.updateLoadingProgress(100, "Initialization Failed: " + error.message);
            this.addActivity('System initialization failed', '❌');
        }
    }

    async loadFaceApiModels() {
        try {
            // Load face-api.js models for professional emotion detection
            if (typeof faceapi === 'undefined') {
                console.warn('face-api.js not loaded, loading from CDN...');
                await this.loadFaceApiScript();
            }

            this.updateLoadingProgress(40, "Loading Face Detection Models...");
            await faceapi.nets.tinyFaceDetector.loadFromUri('/models');
            
            this.updateLoadingProgress(45, "Loading Face Expression Models...");
            await faceapi.nets.faceExpressionNet.loadFromUri('/models');
            
            this.faceApiModels = {
                loaded: true,
                detector: faceapi.nets.tinyFaceDetector,
                expressions: faceapi.nets.faceExpressionNet
            };
            
            this.addActivity('Professional Face-API models loaded', '🧠');
            console.log('Face-API.js models loaded successfully');
            
        } catch (error) {
            console.warn('Failed to load Face-API models, will use fallback:', error);
            this.faceApiModels = { loaded: false };
            
            // Don't throw error, continue with fallback
            this.addActivity('Using fallback emotion detection', '⚠️');
        }
    }

    async loadFaceApiScript() {
        return new Promise((resolve, reject) => {
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js';
            script.onload = resolve;
            script.onerror = reject;
            document.head.appendChild(script);
        });
    }
    
    initializeCharts() {
        try {
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
                            animation: false,
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
                this.createSimplePerformanceChart();
            }
        } catch (error) {
            console.error('Failed to initialize charts:', error);
            this.createSimplePerformanceChart();
        }
    }
    
    createSimplePerformanceChart() {
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
                            <span>Professional AI</span>
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
            // Load MediaPipe tasks for complete face mesh visualization
            const vision = await import('https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3');
            const { FaceLandmarker, FilesetResolver, DrawingUtils } = vision;
            
            // Initialize the file resolver
            const filesetResolver = await FilesetResolver.forVisionTasks(
                "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
            );
            
            // Create face landmarker with full mesh visualization
            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: false, // Not needed for our use case
                runningMode: "VIDEO",
                numFaces: 10 // Support multiple faces with full mesh
            });
            
            // Initialize drawing utils for professional visualization
            this.drawingUtils = new DrawingUtils();
            
            this.addActivity('MediaPipe Face Mesh loaded (complete visualization)', '👤');
            console.log('MediaPipe Face Landmarker initialized with complete mesh visualization');
            
        } catch (error) {
            console.error('Failed to load MediaPipe Face Landmarker:', error);
            this.addActivity('Face Mesh failed to load', '⚠️');
            // Don't throw - allow system to continue
        }
    }
    
    completeInitialization() {
        this.elements.loadingScreen.style.display = 'none';
        this.elements.dashboard.style.display = 'grid';
        this.elements.systemStatus.classList.add('active');
        this.elements.statusText.textContent = 'PROFESSIONAL AI ACTIVE';
        this.elements.overallStatus.classList.add('active');
        this.elements.overallStatusText.textContent = 'Online';
        this.elements.modelsHealth.textContent = 'Online';
        this.elements.modelsHealth.className = 'health-status online';
        
        this.isInitialized = true;
        this.addActivity('Guardian X Professional AI systems online', '✅');
        
        // Check system capabilities
        const hasApiKey = this.aiEngine.apiKey && this.aiEngine.apiKey.trim() !== "";
        const hasFaceApi = this.faceApiModels && this.faceApiModels.loaded;
        
        let greeting;
        
        if (hasApiKey && hasFaceApi) {
            greeting = "Guardian X Professional AI online with Google Gemini integration, complete MediaPipe face mesh visualization, and professional-grade Face-API emotion detection. Ultimate facial analysis system with complete mesh rendering and industry-standard emotion recognition active. All professional systems ready for deployment.";
            this.elements.statusTicker.textContent = '🚀 Guardian X Professional operational • 🧠 Gemini + Face-API active • 👤 Complete face mesh visible • 🎭 Professional emotion detection • 📹 Ultimate analysis ready';
        } else if (hasApiKey) {
            greeting = "Guardian X Professional AI online with Google Gemini integration and complete MediaPipe face mesh visualization. Professional facial analysis with complete mesh rendering active. Face-API models unavailable, using advanced geometric emotion detection.";
            this.elements.statusTicker.textContent = '🚀 Guardian X Professional operational • 🧠 Gemini AI active • 👤 Complete face mesh visible • 🎭 Geometric emotion detection • 📹 Professional analysis ready';
        } else if (hasFaceApi) {
            greeting = "Guardian X systems online with complete MediaPipe face mesh visualization and professional Face-API emotion detection. Configure your Google Gemini API key to enable advanced conversational AI. Professional emotion detection and complete mesh visualization active.";
            this.elements.statusTicker.textContent = '🚀 Guardian X Professional operational • 👤 Complete face mesh visible • 🎭 Professional Face-API emotions • ⚠️ API key needed • 📹 Professional visual active';
        } else {
            greeting = "Guardian X systems online with complete MediaPipe face mesh visualization and advanced geometric emotion detection. Configure Google Gemini API key and ensure Face-API models are available for maximum capabilities. Complete mesh visualization active.";
            this.elements.statusTicker.textContent = '🚀 Guardian X operational • 👤 Complete face mesh visible • 🎭 Geometric emotion detection • ⚠️ Professional models recommended • 📹 Mesh visualization active';
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
                await new Promise(resolve => setTimeout(resolve, 300));
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
                            }, 500);
                            
                            this.addActivity('Camera activated with complete face mesh and professional emotion detection', '📹');
                            this.speak("Professional visual systems online. Complete face mesh visualization and advanced emotion detection beginning.");
                            resolve();
                        })
                        .catch(reject);
                });
                
                this.elements.cameraVideo.addEventListener('error', reject);
                setTimeout(() => {
                    reject(new Error('Video load timeout'));
                }, 8000);
            });
            
        } catch (error) {
            console.error('Failed to start camera:', error);
            this.elements.cameraHealth.textContent = 'Error';
            this.elements.cameraHealth.className = 'health-status offline';
            
            let errorMessage = "Camera failed to start. ";
            if (error.name === 'NotAllowedError') {
                errorMessage = "Camera permission denied. Please allow camera access for complete face mesh visualization and professional emotion detection.";
            } else if (error.name === 'NotFoundError') {
                errorMessage = "No camera detected. Please connect a camera for professional facial analysis capabilities.";
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
            this.speak("Visual systems offline. Professional analysis paused.");
        }
    }
    
    setupCanvas() {
        const video = this.elements.cameraVideo;
        const canvas = this.elements.detectionCanvas;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        console.log(`Professional canvas setup: ${canvas.width}x${canvas.height}`);
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
        console.log('Starting professional object detection with complete face mesh and emotion analysis...');
        
        const detectLoop = async () => {
            if (!this.isDetecting || this.elements.cameraVideo.paused || this.elements.cameraVideo.ended) {
                return;
            }
            
            const startTime = performance.now();
            
            try {
                if (this.elements.cameraVideo.readyState >= 2) {
                    // Object detection
                    const predictions = await this.objectModel.detect(this.elements.cameraVideo);
                    
                    // Complete face mesh detection with professional emotion analysis
                    let faceResults = [];
                    let emotions = [];
                    
                    if (this.faceLandmarker) {
                        try {
                            const faceDetection = this.faceLandmarker.detectForVideo(
                                this.elements.cameraVideo,
                                performance.now()
                            );
                            faceResults = faceDetection.faceLandmarks || [];
                            
                            // Professional emotion detection using Face-API if available
                            if (faceResults.length > 0) {
                                emotions = await this.detectEmotionsWithFaceApi(faceResults);
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
                    
                    this.drawDetectionsWithCompleteMesh(filteredPredictions, faceResults, emotions);
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

    async detectEmotionsWithFaceApi(faceLandmarks) {
        const emotions = [];
        
        try {
            if (this.faceApiModels && this.faceApiModels.loaded && typeof faceapi !== 'undefined') {
                // Use professional Face-API for emotion detection
                const detections = await faceapi.detectAllFaces(
                    this.elements.cameraVideo, 
                    new faceapi.TinyFaceDetectorOptions()
                ).withFaceExpressions();
                
                detections.forEach((detection, index) => {
                    const expressions = detection.expressions;
                    
                    // Find the dominant emotion
                    let maxEmotion = 'neutral';
                    let maxConfidence = 0;
                    
                    Object.entries(expressions).forEach(([emotion, confidence]) => {
                        if (confidence > maxConfidence) {
                            maxEmotion = emotion;
                            maxConfidence = confidence;
                        }
                    });
                    
                    emotions.push({
                        faceIndex: index,
                        emotion: maxEmotion,
                        confidence: maxConfidence,
                        allExpressions: expressions,
                        source: 'Face-API (Professional)'
                    });
                });
                
            } else {
                // Fallback to geometric analysis if Face-API not available
                faceLandmarks.forEach((landmarks, index) => {
                    const geometricEmotion = this.detectEmotionGeometric(landmarks);
                    emotions.push({
                        faceIndex: index,
                        ...geometricEmotion,
                        source: 'Geometric (Fallback)'
                    });
                });
            }
        } catch (error) {
            console.warn('Professional emotion detection failed, using fallback:', error);
            
            // Fallback geometric emotion detection
            faceLandmarks.forEach((landmarks, index) => {
                const geometricEmotion = this.detectEmotionGeometric(landmarks);
                emotions.push({
                    faceIndex: index,
                    ...geometricEmotion,
                    source: 'Geometric (Fallback)'
                });
            });
        }
        
        return emotions;
    }

    detectEmotionGeometric(landmarks) {
        // Advanced geometric emotion detection as fallback
        if (!landmarks || landmarks.length < 468) {
            return { emotion: 'neutral', confidence: 0.5 };
        }

        try {
            // Key landmark points for emotion detection
            const leftMouth = landmarks[61];
            const rightMouth = landmarks[291];
            const upperLip = landmarks[13];
            const lowerLip = landmarks[14];
            const leftEye = landmarks[159];
            const rightEye = landmarks[386];
            const leftEyeLower = landmarks[145];
            const rightEyeLower = landmarks[374];
            const leftBrow = landmarks[70];
            const rightBrow = landmarks[63];

            // Calculate emotion scores
            const mouthCurvature = (upperLip.y + lowerLip.y) / 2 - (leftMouth.y + rightMouth.y) / 2;
            const eyeOpenness = (Math.abs(leftEye.y - leftEyeLower.y) + Math.abs(rightEye.y - rightEyeLower.y)) / 2;
            const browRaise = Math.max(0, (leftEyeLower.y + rightEyeLower.y) / 2 - (leftBrow.y + rightBrow.y) / 2);
            const mouthOpen = Math.abs(upperLip.y - lowerLip.y);

            // Emotion detection logic
            const emotions = {
                happy: Math.max(0, mouthCurvature * -50 + (eyeOpenness > 0.015 ? 0.2 : 0)),
                sad: Math.max(0, mouthCurvature * 30 + (eyeOpenness < 0.01 ? 0.3 : 0)),
                surprised: Math.max(0, browRaise * 20 + (eyeOpenness > 0.025 ? 0.4 : 0) + (mouthOpen > 0.02 ? 0.3 : 0)),
                angry: Math.max(0, (browRaise < -0.005 ? 0.4 : 0) + (eyeOpenness < 0.012 ? 0.3 : 0)),
                neutral: 0.3
            };

            // Find dominant emotion
            const [topEmotion, confidence] = Object.entries(emotions)
                .reduce(([maxEmotion, maxScore], [emotion, score]) => 
                    score > maxScore ? [emotion, score] : [maxEmotion, maxScore], 
                    ['neutral', 0]);

            return {
                emotion: topEmotion,
                confidence: Math.min(0.9, Math.max(0.3, confidence))
            };

        } catch (error) {
            console.warn('Geometric emotion detection error:', error);
            return { emotion: 'neutral', confidence: 0.5 };
        }
    }
    
    drawDetectionsWithCompleteMesh(predictions, faceResults, emotions) {
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
        
        // Draw COMPLETE face mesh with professional emotion indicators
        if (faceResults.length > 0) {
            try {
                ctx.save();
                faceResults.forEach((landmarks, index) => {
                    // Get professional emotion for this face
                    const emotion = emotions.find(e => e.faceIndex === index);
                    const emotionText = emotion ? 
                        `${emotion.emotion} (${Math.round(emotion.confidence * 100)}%)` : 
                        'analyzing...';
                    
                    // Professional emotion color coding
                    let faceColor = '#FFFFFF';
                    let glowIntensity = 8;
                    
                    if (emotion) {
                        switch (emotion.emotion.toLowerCase()) {
                            case 'happy':
                                faceColor = '#00FF00'; // Bright green for happy
                                glowIntensity = 12;
                                break;
                            case 'sad':
                                faceColor = '#4488FF'; // Blue for sad
                                glowIntensity = 10;
                                break;
                            case 'angry':
                                faceColor = '#FF2222'; // Bright red for angry
                                glowIntensity = 15;
                                break;
                            case 'surprised':
                                faceColor = '#FFFF00'; // Yellow for surprised
                                glowIntensity = 14;
                                break;
                            case 'fear':
                                faceColor = '#FF8800'; // Orange for fear
                                glowIntensity = 11;
                                break;
                            case 'disgust':
                                faceColor = '#8800FF'; // Purple for disgust
                                glowIntensity = 9;
                                break;
                            case 'neutral':
                                faceColor = '#CCCCCC'; // Light gray for neutral
                                glowIntensity = 6;
                                break;
                            default:
                                faceColor = '#FFFFFF';
                                glowIntensity = 8;
                        }
                        
                        // Adjust intensity based on confidence
                        glowIntensity = Math.round(glowIntensity * emotion.confidence);
                    }
                    
                    // Draw COMPLETE facial landmarks (all 468 points for ultimate sci-fi look)
                    if (landmarks && landmarks.length > 0) {
                        ctx.fillStyle = faceColor;
                        ctx.strokeStyle = faceColor;
                        ctx.lineWidth = 0.8;
                        
                        // Set glow effect for the mesh
                        ctx.shadowColor = faceColor;
                        ctx.shadowBlur = glowIntensity;
                        
                        // Draw ALL landmark points for complete mesh visualization
                        landmarks.forEach((landmark, landmarkIndex) => {
                            const x = landmark.x * canvas.width;
                            const y = landmark.y * canvas.height;
                            
                            // Different sizes for different facial features
                            let pointSize = 0.8;
                            
                            // Larger points for key features
                            if (this.isKeyFacialLandmark(landmarkIndex)) {
                                pointSize = 1.2;
                            }
                            
                            // Extra large for super key features (eyes, mouth corners, etc.)
                            if (this.isSuperKeyLandmark(landmarkIndex)) {
                                pointSize = 1.8;
                                ctx.shadowBlur = glowIntensity * 1.5;
                            }
                            
                            ctx.beginPath();
                            ctx.arc(x, y, pointSize, 0, 2 * Math.PI);
                            ctx.fill();
                            
                            // Reset shadow for normal points
                            if (this.isSuperKeyLandmark(landmarkIndex)) {
                                ctx.shadowBlur = glowIntensity;
                            }
                        });
                        
                        // Draw connecting lines for mesh effect (optional - can be toggled)
                        this.drawFaceMeshConnections(ctx, landmarks, faceColor, glowIntensity);
                        
                        // Reset shadow
                        ctx.shadowBlur = 0;
                        
                        // Draw professional emotion label with enhanced styling
                        if (landmarks.length > 0) {
                            const firstPoint = landmarks[0];
                            const x = firstPoint.x * canvas.width;
                            const y = firstPoint.y * canvas.height;
                            
                            ctx.font = 'bold 13px Courier New';
                            let labelText = `${emotionText}`;
                            if (emotion && emotion.source) {
                                if (emotion.source.includes('Face-API')) {
                                    labelText += ` 🧠`;
                                } else {
                                    labelText += ` ⚡`;
                                }
                            }
                            
                            const textWidth = ctx.measureText(labelText).width;
                            
                            // Professional background with glow
                            ctx.fillStyle = 'rgba(0, 0, 0, 0.9)';
                            ctx.fillRect(x - 30, y - 65, textWidth + 40, 50);
                            
                            // Emotion color border with enhanced glow
                            ctx.strokeStyle = faceColor;
                            ctx.lineWidth = 3;
                            ctx.shadowColor = faceColor;
                            ctx.shadowBlur = glowIntensity * 2;
                            ctx.strokeRect(x - 30, y - 65, textWidth + 40, 50);
                            ctx.shadowBlur = 0;
                            
                            // Main emotion text
                            ctx.fillStyle = faceColor;
                            ctx.shadowColor = faceColor;
                            ctx.shadowBlur = 5;
                            ctx.fillText(labelText, x - 25, y - 50);
                            
                            // Professional indicator
                            ctx.font = 'bold 10px Courier New';
                            ctx.fillStyle = '#FFD700';
                            ctx.shadowColor = '#FFD700';
                            ctx.shadowBlur = 3;
                            
                            const sourceText = emotion && emotion.source ? 
                                (emotion.source.includes('Face-API') ? 'PROFESSIONAL' : 'ADVANCED') : 'PROCESSING';
                            ctx.fillText(sourceText, x - 25, y - 35);
                            
                            // Confidence bar with glow
                            if (emotion && emotion.confidence) {
                                const barWidth = 70;
                                const barHeight = 6;
                                const confidenceWidth = barWidth * emotion.confidence;
                                
                                // Background bar
                                ctx.shadowBlur = 0;
                                ctx.fillStyle = 'rgba(255, 255, 255, 0.2)';
                                ctx.fillRect(x - 25, y - 25, barWidth, barHeight);
                                
                                // Confidence bar with glow
                                ctx.fillStyle = faceColor;
                                ctx.shadowColor = faceColor;
                                ctx.shadowBlur = 4;
                                ctx.fillRect(x - 25, y - 25, confidenceWidth, barHeight);
                            }
                            
                            ctx.shadowBlur = 0;
                        }
                    }
                });
                ctx.restore();
            } catch (drawError) {
                console.warn('Error drawing complete face mesh:', drawError);
            }
        }
    }

    drawFaceMeshConnections(ctx, landmarks, color, glowIntensity) {
        // Draw subtle connecting lines for mesh effect (optional enhancement)
        ctx.strokeStyle = color;
        ctx.lineWidth = 0.3;
        ctx.globalAlpha = 0.4;
        ctx.shadowColor = color;
        ctx.shadowBlur = Math.max(2, glowIntensity * 0.3);
        
        // Define connection patterns for mesh effect
        const connections = [
            // Eye connections
            [33, 7], [7, 163], [163, 144], [144, 145], [145, 153], [153, 154], [154, 155], [155, 133],
            [362, 398], [398, 384], [384, 385], [385, 386], [386, 387], [387, 388], [388, 466],
            
            // Mouth connections
            [61, 84], [84, 17], [17, 314], [314, 405], [405, 320], [320, 307], [307, 375], [375, 291],
            [78, 95], [95, 88], [88, 178], [178, 87], [87, 14], [14, 317], [317, 402], [402, 318],
            
            // Face outline connections
            [10, 151], [151, 9], [9, 10], [234, 454], [454, 323], [323, 361], [361, 340]
        ];
        
        connections.forEach(([start, end]) => {
            if (landmarks[start] && landmarks[end]) {
                const startPoint = landmarks[start];
                const endPoint = landmarks[end];
                
                ctx.beginPath();
                ctx.moveTo(startPoint.x * ctx.canvas.width, startPoint.y * ctx.canvas.height);
                ctx.lineTo(endPoint.x * ctx.canvas.width, endPoint.y * ctx.canvas.height);
                ctx.stroke();
            }
        });
        
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
    }

    isKeyFacialLandmark(index) {
        // Key facial landmarks for enhanced visibility
        const keyLandmarks = [
            // Eyes
            33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246,
            362, 398, 384, 385, 386, 387, 388, 466, 263, 249, 390, 373, 374, 380, 381, 382,
            // Eyebrows
            46, 53, 70, 63, 105, 66, 107, 55, 65, 52, 283, 295, 334, 296, 336, 285,
            // Nose
            1, 2, 5, 4, 19, 94, 168, 6, 142, 36, 205, 206, 207, 213, 192, 147,
            // Mouth
            13, 14, 17, 18, 200, 199, 175, 0, 11, 12, 15, 16, 269, 270, 267, 271, 272,
            61, 291, 39, 181, 84, 17, 314, 405, 320, 307, 375, 321, 308, 324, 318
        ];
        return keyLandmarks.includes(index);
    }

    isSuperKeyLandmark(index) {
        // Super important landmarks for maximum visibility
        const superKeyLandmarks = [
            // Eye corners and centers
            33, 133, 362, 263,
            // Mouth corners and center
            61, 291, 13, 14,
            // Nose tip
            1,
            // Eyebrow peaks
            70, 63
        ];
        return superKeyLandmarks.includes(index);
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
        
        // Add face information with professional emotions
        if (this.faceLandmarks.length > 0) {
            const faceItem = document.createElement('div');
            faceItem.className = 'object-item face-detection';
            
            let emotionSummary = 'Tracked';
            if (this.detectedEmotions.length > 0) {
                const emotionList = this.detectedEmotions.map(e => {
                    let str = `${e.emotion} (${Math.round(e.confidence * 100)}%)`;
                    if (e.source && e.source.includes('Face-API')) str += ' 🧠';
                    else if (e.source && e.source.includes('Geometric')) str += ' ⚡';
                    return str;
                }).join(', ');
                emotionSummary = emotionList;
            }
            
            faceItem.innerHTML = `
                <div class="object-info">
                    <span class="object-name">🕸️ Complete Mesh Faces</span>
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
        let threatDetails = 'Environment secure. ';
        
        if (threats.length > 0) {
            threatLevel = 'high';
            threatText = 'HIGH THREAT';
            threatDetails = `⚠️ ${threats.length} weapon${threats.length > 1 ? 's' : ''} detected: ${threats.map(t => t.class).join(', ')}. `;
        } else if (concerningEmotions.length > 0) {
            threatLevel = 'medium';
            threatText = 'BEHAVIORAL CONCERN';
            threatDetails = `⚠️ Professional emotion analysis detected concerns: ${concerningEmotions.map(e => {
                let str = `${e.emotion} (${Math.round(e.confidence * 100)}%)`;
                if (e.source && e.source.includes('Face-API')) str += ' [Professional]';
                return str;
            }).join(', ')}. `;
        } else if (suspiciousItems.length > 0) {
            threatLevel = 'medium';
            threatText = 'MONITORING';
            threatDetails = `${suspiciousItems.length} unattended item${suspiciousItems.length > 1 ? 's' : ''} under professional surveillance. `;
        }
        
        threatDetails += `Complete mesh monitoring: ${peopleCount} people, ${faceCount} faces with professional emotion analysis.`;
        
        if (this.detectedEmotions.length > 0) {
            const emotionSummary = this.detectedEmotions.map(e => {
                let str = `${e.emotion} (${Math.round(e.confidence * 100)}%)`;
                if (e.source && e.source.includes('Face-API')) str += ' [Pro]';
                return str;
            }).join(', ');
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
            medicalStatus += `Medical equipment: ${medicalItems.map(item => item.class).join(', ')}. `;
        }
        
        medicalStatus += `Professional monitoring: ${peopleCount} patient${peopleCount !== 1 ? 's' : ''}, ${faceCount} face${faceCount !== 1 ? 's' : ''} with complete mesh emotional assessment.`;
        
        if (faceCount > 0) {
            medicalStatus += ' Complete mesh monitoring for distress indicators active.';
            
            if (medicalConcerns.length > 0) {
                medicalStatus += ` Medical emotional indicators: ${medicalConcerns.map(e => {
                    let str = `${e.emotion} (${Math.round(e.confidence * 100)}%)`;
                    if (e.source && e.source.includes('Face-API')) str += ' [Professional]';
                    return str;
                }).join(', ')} - potential patient discomfort detected.`;
            }
        }
        
        this.elements.medicalItems.textContent = medicalStatus;
    }

    // Rest of the methods remain the same as the previous version...
    // Voice and interaction methods, UI updates, etc. are unchanged
    
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
        
        return new Promise((resolve) => {
            const loadVoices = () => {
                this.availableVoices = this.voiceSynthesis.getVoices();
                
                if (this.availableVoices.length > 0) {
                    this.elements.voiceSelect.innerHTML = '';
                    this.availableVoices.forEach((voice, index) => {
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = `${voice.name} (${voice.lang})`;
                        this.elements.voiceSelect.appendChild(option);
                    });
                    
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
        
        this.voiceSynthesis.cancel();
        
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
        
        if (setting === 'rate') {
            this.elements.rateValue.textContent = `${value}x`;
        } else if (setting === 'volume') {
            this.elements.volumeValue.textContent = `${Math.round(value * 100)}%`;
        }
    }
    
    switchMissionMode(mode) {
        this.currentMission = mode;
        
        document.querySelectorAll('.mission-btn').forEach(btn => {
            btn.classList.remove('active');
        });
        document.querySelector(`[data-mode="${mode}"]`).classList.add('active');
        
        if (this.elements.aiMode) {
            this.elements.aiMode.textContent = `${mode} MODE`;
        }
        
        this.addActivity(`Mission mode: ${mode}`, '🎯');
        this.speak(`Switching to ${mode.toLowerCase()} mode. Professional systems optimized for ${mode.toLowerCase()} operations with complete mesh visualization.`);
    }
    
    switchAnalysisTab(tabName) {
        document.querySelectorAll('.tab-btn').forEach(btn => btn.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(content => content.classList.add('hidden'));
        
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
        
        while (this.elements.activityLog.children.length > 20) {
            this.elements.activityLog.removeChild(this.elements.activityLog.lastChild);
        }
    }
    
    updatePerformanceMetrics(processingTime) {
        this.performanceData.push({
            timestamp: Date.now(),
            processingTime: processingTime
        });
        
        if (this.performanceData.length > 50) {
            this.performanceData.shift();
        }
        
        const avgTime = this.performanceData.reduce((sum, data) => sum + data.processingTime, 0) / this.performanceData.length;
        this.elements.avgResponseTime.textContent = `${Math.round(avgTime)}ms`;
        
        if (this.frameCount % 10 === 0) {
            this.updatePerformanceChart(processingTime);
        }
        
        this.updateSimplePerformanceDisplay(processingTime);
    }
    
    updatePerformanceChart(processingTime) {
        if (this.charts.performance) {
            const chart = this.charts.performance;
            const now = new Date().toLocaleTimeString();
            
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(processingTime);
            
            if (chart.data.labels.length > 15) {
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
        
        if (cpuLoadElement && aiLoadElement) {
            const cpuLoad = Math.min(100, Math.round((processingTime / 80) * 100));
            const aiLoad = Math.min(100, Math.round((processingTime / 40) * 100));
            
            cpuLoadElement.style.width = `${cpuLoad}%`;
            aiLoadElement.style.width = `${aiLoad}%`;
            
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
            this.elements.emergencyBtn.textContent = 'EMERGENCY ACTIVE';
            this.elements.emergencyBtn.style.background = 'linear-gradient(45deg, #FF073A, #FF4444)';
            this.stopCamera();
            this.speak('Emergency protocol activated. Professional systems on standby.');
            this.addActivity('Emergency protocol activated', '🚨');
        } else {
            this.elements.emergencyBtn.textContent = 'EMERGENCY STOP';
            this.elements.emergencyBtn.style.background = 'linear-gradient(45deg, var(--accent-red), rgba(var(--color-red-400-rgb), 0.8))';
            this.speak('Emergency protocol deactivated. Professional systems resuming normal operation.');
            this.addActivity('Emergency protocol deactivated', '✅');
        }
    }
    
    startSystemLoop() {
        setInterval(() => {
            const uptime = Date.now() - this.startTime;
            const hours = Math.floor(uptime / 3600000);
            const minutes = Math.floor((uptime % 3600000) / 60000);
            const seconds = Math.floor((uptime % 60000) / 1000);
            this.elements.uptime.textContent = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
        }, 1000);
        
        setInterval(() => {
            this.elements.currentTime.textContent = new Date().toLocaleTimeString();
        }, 1000);
    }
}

// Initialize the professional system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.guardianX = new GuardianXAssistant();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GuardianXAssistant, GuardianAIEngine };
}

// Additional note: To use this system at maximum capacity, you'll need to:
// 1. Add face-api.js models to your /models directory or modify the path
// 2. Include face-api.js library: <script src="https://cdn.jsdelivr.net/npm/face-api.js@0.22.2/dist/face-api.min.js"></script>
// 3. The system will gracefully fallback to geometric emotion detection if Face-API models aren't available
