// Guardian X AI Assistant - Optimized High-Performance Emotion Detection
// Performance-optimized version with smart caching and reduced API calls

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
                response: "Analyzing facial expressions and emotions using advanced face mesh analysis. I can detect happiness, sadness, anger, surprise, fear, disgust, and neutral states."
            }
        };
        
        this.contextualPrompts = {
            medical: "Focus on health, safety, medical equipment analysis, and facial indicators of distress or medical conditions.",
            defense: "Emphasize threat detection, facial recognition for security, tactical assessment, and behavioral analysis through facial expressions.",
            policing: "Highlight crowd monitoring, facial identification, behavioral analysis through expressions, law enforcement perspective."
        };

        // Performance optimization: AI emotion detection cache and throttling
        this.emotionCache = new Map(); // Cache for AI results
        this.lastAICall = 0;
        this.aiCallInterval = 1000; // Only call AI every 1 second instead of every frame
        this.emotionHistory = [];
        this.emotionCacheSize = 8;
        this.pendingAIRequests = new Map(); // Track pending requests to avoid duplicates
        
        // Fast geometric emotion detection (always runs)
        this.lastGeometricEmotions = [];
    }
    
    loadSavedApiKey() {
        const savedKey = localStorage.getItem('guardianX_apiKey');
        if (savedKey) {
            this.apiKey = savedKey;
            console.log('Loaded saved API key');
        }
    }

    // High-performance emotion analysis with smart AI usage
    async analyzeEmotionsOptimized(facialFeatures, faceIndex = 0) {
        const now = Date.now();
        
        // Always run fast geometric analysis first
        const geometricResult = this.generateOptimizedFallbackEmotions(facialFeatures);
        
        // Only call AI if we have API key and enough time has passed
        if (this.apiKey && this.apiKey.trim() !== "" && (now - this.lastAICall) >= this.aiCallInterval) {
            // Check if we already have a pending request for similar features
            const featureKey = this.generateFeatureKey(facialFeatures);
            
            if (!this.pendingAIRequests.has(featureKey)) {
                this.lastAICall = now;
                this.pendingAIRequests.set(featureKey, true);
                
                // Run AI analysis in background without blocking
                this.runBackgroundAIAnalysis(facialFeatures, faceIndex, featureKey);
            }
        }
        
        // Return cached AI result if available, otherwise geometric result
        const cacheKey = this.generateFeatureKey(facialFeatures);
        const cachedResult = this.emotionCache.get(cacheKey);
        
        if (cachedResult && (now - cachedResult.timestamp) < 3000) { // Cache valid for 3 seconds
            return {
                ...cachedResult.result,
                source: 'AI (cached)'
            };
        }
        
        return {
            ...geometricResult,
            source: 'Geometric (fast)'
        };
    }

    generateFeatureKey(features) {
        // Create a simple key based on major facial features for caching
        return `${Math.round(features.mouthCurvature * 100)}_${Math.round(features.eyeOpenness * 100)}_${Math.round(features.eyebrowRaise * 100)}`;
    }

    async runBackgroundAIAnalysis(facialFeatures, faceIndex, featureKey) {
        try {
            const prompt = `Analyze facial emotion from these measurements (respond with JSON only):

MEASUREMENTS:
- Mouth: ${facialFeatures.mouthCurvature.toFixed(3)} (+ = smile, - = frown)
- Eyes: ${facialFeatures.eyeOpenness.toFixed(3)} (higher = wider)
- Brows: ${facialFeatures.eyebrowRaise.toFixed(3)} (+ = raised)
- Tension: ${facialFeatures.mouthTension.toFixed(3)}
- LipCorners: ${facialFeatures.lipCornerDepression.toFixed(3)}

RULES:
Happy: mouth > 0.015, moderate eyes
Sad: mouth < -0.01, lip corners down
Angry: brow tension, mouth tight
Surprised: brows up > 0.02, eyes wide > 0.025
Fear: eyes wide, tense
Disgust: lip raise, nose wrinkle
Neutral: values near zero

JSON only:
{"emotion":"primary","confidence":0.8,"reasoning":"brief"}`;

            const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${this.config.model}:generateContent?key=${this.apiKey}`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    contents: [{ parts: [{ text: prompt }] }],
                    generationConfig: {
                        temperature: 0.2,
                        maxOutputTokens: 150,
                        topK: 20,
                        topP: 0.8
                    }
                })
            });

            if (response.ok) {
                const data = await response.json();
                if (data.candidates?.[0]?.content?.parts?.[0]?.text) {
                    const responseText = data.candidates[0].content.parts[0].text.trim();
                    const jsonMatch = responseText.match(/\{[^}]+\}/);
                    
                    if (jsonMatch) {
                        const result = JSON.parse(jsonMatch[0]);
                        const aiResult = {
                            emotion: result.emotion || 'neutral',
                            confidence: Math.min(0.95, Math.max(0.4, result.confidence || 0.7)),
                            reasoning: result.reasoning || 'AI analysis',
                            source: 'AI'
                        };
                        
                        // Cache the result
                        this.emotionCache.set(featureKey, {
                            result: aiResult,
                            timestamp: Date.now()
                        });
                    }
                }
            }
        } catch (error) {
            console.warn('Background AI analysis failed:', error);
        } finally {
            this.pendingAIRequests.delete(featureKey);
        }
    }

    generateOptimizedFallbackEmotions(facialFeatures) {
        if (!facialFeatures) {
            return { emotion: 'neutral', confidence: 0.5, reasoning: 'No data' };
        }

        const f = facialFeatures;
        
        // High-performance emotion scoring
        const scores = {
            happy: Math.max(0, 
                (f.mouthCurvature > 0.015 ? 0.4 : 0) +
                (f.cheekRaise > 0.01 ? 0.3 : 0) +
                (f.eyeAspectRatio > 0.015 ? 0.2 : 0)
            ),
            
            sad: Math.max(0,
                (f.mouthCurvature < -0.01 ? 0.4 : 0) +
                (f.lipCornerDepression > 0.01 ? 0.4 : 0) +
                (f.eyeOpenness < 0.01 ? 0.2 : 0)
            ),
            
            angry: Math.max(0,
                (f.eyebrowLower > 0.015 ? 0.5 : 0) +
                (f.mouthTension > 0.02 ? 0.3 : 0) +
                (f.noseFlare > 0.008 ? 0.2 : 0)
            ),
            
            surprised: Math.max(0,
                (f.eyebrowRaise > 0.025 ? 0.4 : 0) +
                (f.eyeOpenness > 0.025 ? 0.4 : 0) +
                (f.jawDrop > 0.015 ? 0.2 : 0)
            ),
            
            fear: Math.max(0,
                (f.eyeOpenness > 0.03 ? 0.4 : 0) +
                (f.eyebrowRaise > 0.02 && f.mouthTension > 0.015 ? 0.4 : 0) +
                (f.mouthWidth > 0.015 ? 0.2 : 0)
            ),
            
            disgust: Math.max(0,
                (f.upperLipRaise > 0.015 ? 0.5 : 0) +
                (f.noseFlare > 0.01 ? 0.3 : 0) +
                (f.cheekRaise > 0.015 ? 0.2 : 0)
            ),
            
            neutral: 0.3 // Base score
        };

        // Find highest scoring emotion
        const [topEmotion, topScore] = Object.entries(scores)
            .reduce(([maxEmotion, maxScore], [emotion, score]) => 
                score > maxScore ? [emotion, score] : [maxEmotion, maxScore], 
                ['neutral', 0]);

        return {
            emotion: topEmotion,
            confidence: Math.min(0.9, Math.max(0.4, topScore)),
            reasoning: `Fast analysis: ${topEmotion}`,
            scores: scores
        };
    }

    // Existing methods with minimal changes...
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
            response += `I'm tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with real-time facial analysis active. `;
            
            if (emotions.length > 0) {
                const emotionSummary = emotions.map(e => {
                    let emotionStr = `${e.emotion} (${Math.round(e.confidence * 100)}%)`;
                    if (e.source) emotionStr += ` [${e.source}]`;
                    return emotionStr;
                }).join(', ');
                response += `High-speed emotion detection: ${emotionSummary}. `;
            }
        }
        
        const modeContext = this.getModeContext(detectedObjects, faceLandmarks, emotions, missionMode);
        return response + modeContext + " All systems operating at optimal performance.";
    }
    
    generateEmotionResponse(emotions, faceLandmarks, missionMode) {
        if (faceLandmarks.length === 0) {
            return "No faces detected for emotion analysis. High-speed emotion detection systems are ready and will activate when faces are detected.";
        }
        
        if (emotions.length === 0) {
            return `I'm tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} but emotion analysis is still initializing. Processing facial expressions for accurate detection.`;
        }
        
        let response = `High-performance emotion analysis: `;
        emotions.forEach((emotionData, index) => {
            response += `Person ${index + 1} - ${emotionData.emotion} (${Math.round(emotionData.confidence * 100)}% confidence)`;
            if (emotionData.source) {
                response += ` [${emotionData.source}]`;
            }
            if (index < emotions.length - 1) response += ', ';
        });
        
        // Add mission-specific context
        switch (missionMode) {
            case 'MEDICAL':
                response += '. Real-time monitoring for medical distress indicators in facial expressions.';
                break;
            case 'DEFENSE':
                response += '. High-speed threat assessment through behavioral pattern analysis.';
                break;
            case 'POLICING':
                response += '. Continuous crowd monitoring and public safety behavioral analysis.';
                break;
        }
        
        return response;
    }
    
    generateFaceAnalysisResponse(faceLandmarks, detectedObjects, emotions, missionMode) {
        if (faceLandmarks.length === 0) {
            return "No faces detected in current field of view. High-performance face analysis systems are ready and will activate when faces are detected.";
        }
        
        const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
        let response = `High-speed facial analysis active: tracking ${faceLandmarks.length} face${faceLandmarks.length > 1 ? 's' : ''} with ${peopleCount} people detected. `;
        
        if (emotions.length > 0) {
            const emotionList = emotions.map(e => {
                let emotionStr = `${e.emotion} (${Math.round(e.confidence * 100)}%)`;
                if (e.source) emotionStr += `[${e.source}]`;
                return emotionStr;
            }).join(', ');
            response += `Real-time emotions: ${emotionList}. `;
        }
        
        switch (missionMode) {
            case 'MEDICAL':
                response += "Continuous monitoring for medical indicators and patient distress signals.";
                break;
            case 'DEFENSE':
                response += "Real-time threat assessment with behavioral anomaly detection.";
                break;
            case 'POLICING':
                response += "High-speed facial recognition and crowd behavior monitoring active.";
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
            response += `Real-time facial monitoring: ${faceLandmarks.length} individuals under surveillance. `;
            
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
            response += `Low risk environment: ${peopleCount} people, ${faceLandmarks.length} faces tracked. Security status: nominal.`;
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
        
        let response = "High-speed medical analysis active. Real-time patient monitoring engaged. ";
        
        if (faceLandmarks.length > 0) {
            response += `Monitoring ${faceLandmarks.length} patient${faceLandmarks.length > 1 ? 's' : ''} for distress indicators. `;
            
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
        const visionStatus = hasVision ? "with active high-speed monitoring" : "ready for real-time activation";
        return `Guardian X capabilities: advanced object detection, high-performance facial tracking, real-time emotion analysis, threat assessment, medical evaluation, crowd monitoring, intelligent conversation. Currently in ${missionMode} mode ${visionStatus}. Real-time analysis of environments with optimized emotion detection and behavioral pattern recognition.`;
    }
    
    generateContextualDefault(userInput, detectedObjects, faceLandmarks, emotions, missionMode) {
        if (detectedObjects.length > 0 || faceLandmarks.length > 0) {
            const objectCount = detectedObjects.length;
            const faceCount = faceLandmarks.length;
            const peopleCount = detectedObjects.filter(obj => obj.class === 'person').length;
            const emotionSummary = emotions.length > 0 ? ` with real-time emotions: ${emotions.map(e => 
                `${e.emotion} (${Math.round(e.confidence * 100)}%)`
            ).join(', ')}` : '';
            return `Real-time monitoring: ${objectCount} objects, ${faceCount} faces, ${peopleCount} people in ${missionMode} mode${emotionSummary}. How can I assist with threat analysis, medical assessment, or behavioral evaluation?`;
        }
        
        return `Guardian X ready for deployment. Activate camera systems for comprehensive real-time analysis including high-speed object detection, facial tracking, and emotion recognition, or ask about capabilities and mission specifications.`;
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
        const emotionContext = emotions.length > 0 ? ` Real-time emotions: ${emotions.map(e => 
            `${e.emotion} (${Math.round(e.confidence * 100)}%)`
        ).join(', ')}.` : '';
        
        switch (missionMode) {
            case 'MEDICAL':
                return `High-speed medical protocols active. ${peopleCount} individual${peopleCount !== 1 ? 's' : ''} and ${faceCount} faces ready for assessment.${emotionContext}`;
            case 'DEFENSE':
                return `Real-time tactical analysis engaged. Monitoring threats with facial recognition active.${emotionContext}`;
            case 'POLICING':
            default:
                return `Real-time surveillance protocols active. Behavioral analysis monitoring all entities.${emotionContext}`;
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

// High-Performance Guardian X Assistant System
class GuardianXAssistant {
    constructor() {
        // Initialize AI Engine
        this.aiEngine = new GuardianAIEngine();
        
        // Guardian X personality and configuration
        this.guardianData = {
            name: "Guardian X",
            role: "First-generation robot developed by BIT Robotics", 
            mission: "Saving lives through AI, VR, thermo-vision, and high-speed facial analysis"
        };
        
        this.config = {
            frameRate: 30,
            detectionInterval: 100, // Faster detection loop
            confidenceThreshold: 0.3,
            maxDetections: 20,
            voiceSettings: {
                rate: 0.9,
                pitch: 0.8,
                volume: 0.8
            }
        };
        
        // Mission modes optimized for performance
        this.missionModes = {
            MEDICAL: {
                priorityObjects: ["person", "bottle", "cup", "syringe", "scissors"],
                threatLevel: "low",
                detectionSensitivity: 0.3,
                aiContext: "Medical mode focuses on health assessment and patient monitoring",
                faceAnalysis: true
            },
            DEFENSE: {
                priorityObjects: ["person", "car", "truck", "backpack", "knife"],
                threatLevel: "high", 
                detectionSensitivity: 0.2,
                aiContext: "Defense mode emphasizes threat detection and tactical analysis",
                faceAnalysis: true
            },
            POLICING: {
                priorityObjects: ["person", "car", "handbag", "cell phone", "laptop"],
                threatLevel: "medium",
                detectionSensitivity: 0.3,
                aiContext: "Policing mode monitors crowds and maintains public safety",
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
            this.updateLoadingProgress(10, "Initializing High-Performance AI Engine...");
            await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay
            
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
            
            this.updateLoadingProgress(92, "Optimizing Performance Systems...");
            this.initializeCharts();
            
            this.updateLoadingProgress(95, "Starting High-Speed Loops...");
            this.startSystemLoop();
            
            this.updateLoadingProgress(100, "Guardian X High-Performance Ready!");
            
            setTimeout(() => {
                this.completeInitialization();
            }, 1000); // Reduced delay
            
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
                            animation: false, // Disable animations for performance
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
            
            // Create face landmarker with performance optimizations
            this.faceLandmarker = await FaceLandmarker.createFromOptions(filesetResolver, {
                baseOptions: {
                    modelAssetPath: "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
                    delegate: "GPU"
                },
                outputFaceBlendshapes: false, // Disable for performance
                runningMode: "VIDEO",
                numFaces: 5 // Reduced for performance
            });
            
            // Initialize drawing utils
            this.drawingUtils = new DrawingUtils();
            
            this.addActivity('MediaPipe Face Landmarker loaded (optimized)', '👤');
            console.log('MediaPipe Face Landmarker initialized with performance optimizations');
            
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
        this.elements.statusText.textContent = 'HIGH-PERFORMANCE AI ACTIVE';
        this.elements.overallStatus.classList.add('active');
        this.elements.overallStatusText.textContent = 'Online';
        this.elements.modelsHealth.textContent = 'Online';
        this.elements.modelsHealth.className = 'health-status online';
        
        this.isInitialized = true;
        this.addActivity('Guardian X High-Performance AI systems online', '✅');
        
        // Check if API key is configured
        const hasApiKey = this.aiEngine.apiKey && this.aiEngine.apiKey.trim() !== "";
        let greeting;
        
        if (hasApiKey) {
            greeting = "Guardian X High-Performance AI online with optimized Google Gemini integration and real-time MediaPipe facial analysis. Ultra-fast emotion detection with intelligent caching active. Real-time conversational intelligence with high-speed facial tracking and optimized emotional analysis ready for deployment.";
            this.elements.statusTicker.textContent = '🚀 Guardian X High-Performance operational • ⚡ Optimized Gemini AI processing • 👤 Real-time face tracking • 🎭 High-speed emotion detection • 📹 Ultra-fast vision responses ready';
        } else {
            greeting = "Guardian X systems online with optimized MediaPipe face tracking and high-speed geometric emotion detection. Configure your Google Gemini API key to enable advanced AI conversational capabilities. All high-performance functions operational including optimized object detection and real-time facial analysis.";
            this.elements.statusTicker.textContent = '🚀 Guardian X High-Performance operational • 👤 Real-time face tracking active • 🎭 High-speed emotion detection ready • ⚠️ API key required for AI features • 📹 Optimized vision functions active';
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
                await new Promise(resolve => setTimeout(resolve, 300)); // Reduced delay
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
                            }, 500); // Reduced delay
                            
                            this.addActivity('Camera activated with high-speed face tracking and optimized emotion detection', '📹');
                            this.speak("High-performance visual systems online. Real-time environmental analysis and ultra-fast emotion detection beginning.");
                            resolve();
                        })
                        .catch(reject);
                });
                
                this.elements.cameraVideo.addEventListener('error', reject);
                setTimeout(() => {
                    reject(new Error('Video load timeout'));
                }, 8000); // Reduced timeout
            });
            
        } catch (error) {
            console.error('Failed to start camera:', error);
            this.elements.cameraHealth.textContent = 'Error';
            this.elements.cameraHealth.className = 'health-status offline';
            
            let errorMessage = "Camera failed to start. ";
            if (error.name === 'NotAllowedError') {
                errorMessage = "Camera permission denied. Please allow camera access for high-performance visual analysis.";
            } else if (error.name === 'NotFoundError') {
                errorMessage = "No camera detected. Please connect a camera for enhanced AI capabilities.";
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
            this.speak("Visual systems offline. High-performance analysis paused.");
        }
    }
    
    setupCanvas() {
        const video = this.elements.cameraVideo;
        const canvas = this.elements.detectionCanvas;
        canvas.width = video.videoWidth || 640;
        canvas.height = video.videoHeight || 480;
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        console.log(`High-performance canvas setup: ${canvas.width}x${canvas.height}`);
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
        console.log('Starting high-performance object detection with optimized emotion analysis...');
        
        const detectLoop = async () => {
            if (!this.isDetecting || this.elements.cameraVideo.paused || this.elements.cameraVideo.ended) {
                return;
            }
            
            const startTime = performance.now();
            
            try {
                if (this.elements.cameraVideo.readyState >= 2) {
                    // Object detection
                    const predictions = await this.objectModel.detect(this.elements.cameraVideo);
                    
                    // High-performance face landmark detection with optimized emotion analysis
                    let faceResults = [];
                    let emotions = [];
                    if (this.faceLandmarker) {
                        try {
                            const faceDetection = this.faceLandmarker.detectForVideo(
                                this.elements.cameraVideo,
                                performance.now()
                            );
                            faceResults = faceDetection.faceLandmarks || [];
                            
                            // Optimized emotion analysis - only process if faces detected
                            if (faceResults.length > 0) {
                                for (let i = 0; i < Math.min(faceResults.length, 3); i++) { // Limit to 3 faces for performance
                                    const landmarks = faceResults[i];
                                    const facialFeatures = this.extractOptimizedFacialFeatures(landmarks);
                                    const emotionResult = await this.aiEngine.analyzeEmotionsOptimized(facialFeatures, i);
                                    emotions.push({
                                        faceIndex: i,
                                        ...emotionResult
                                    });
                                }
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

    extractOptimizedFacialFeatures(landmarks) {
        // Optimized version with fewer calculations for better performance
        if (!landmarks || landmarks.length < 468) {
            return {
                mouthCurvature: 0,
                eyeOpenness: 0,
                eyebrowRaise: 0,
                eyebrowLower: 0,
                mouthOpen: 0,
                mouthTension: 0,
                lipCornerDepression: 0,
                upperLipRaise: 0,
                cheekRaise: 0,
                jawDrop: 0,
                noseFlare: 0,
                eyeAspectRatio: 0,
                mouthWidth: 0,
                cheekPuff: 0
            };
        }

        try {
            // Key landmarks for fast calculation
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
            const noseTip = landmarks[1];
            const chin = landmarks[18];

            // Fast feature calculations
            const mouthCenterY = (leftMouth.y + rightMouth.y) / 2;
            const lipCenterY = (upperLip.y + lowerLip.y) / 2;
            const eyeCenterY = (leftEye.y + rightEye.y) / 2;
            const browCenterY = (leftBrow.y + rightBrow.y) / 2;

            return {
                mouthCurvature: lipCenterY - mouthCenterY,
                eyeOpenness: Math.abs(leftEye.y - leftEyeLower.y) + Math.abs(rightEye.y - rightEyeLower.y),
                eyebrowRaise: Math.max(0, eyeCenterY - browCenterY),
                eyebrowLower: Math.max(0, browCenterY - eyeCenterY + 0.01),
                mouthOpen: Math.abs(upperLip.y - lowerLip.y),
                mouthWidth: Math.abs(rightMouth.x - leftMouth.x),
                lipCornerDepression: Math.max(0, mouthCenterY - chin.y + 0.05),
                upperLipRaise: Math.max(0, noseTip.y - upperLip.y + 0.01),
                cheekRaise: Math.max(0, eyeCenterY - mouthCenterY),
                jawDrop: Math.max(0, Math.abs(chin.y - upperLip.y) - 0.08),
                noseFlare: Math.max(0, Math.abs(noseTip.x - upperLip.x) - 0.005),
                eyeAspectRatio: (Math.abs(leftEye.y - leftEyeLower.y) + Math.abs(rightEye.y - rightEyeLower.y)) / Math.abs(rightMouth.x - leftMouth.x),
                mouthTension: Math.abs(rightMouth.x - leftMouth.x) / Math.max(Math.abs(upperLip.y - lowerLip.y), 0.001),
                cheekPuff: 0 // Simplified for performance
            };
        } catch (error) {
            console.warn('Error in optimized feature extraction:', error);
            return {
                mouthCurvature: 0, eyeOpenness: 0, eyebrowRaise: 0, eyebrowLower: 0,
                mouthOpen: 0, mouthTension: 0, lipCornerDepression: 0, upperLipRaise: 0,
                cheekRaise: 0, jawDrop: 0, noseFlare: 0, eyeAspectRatio: 0,
                mouthWidth: 0, cheekPuff: 0
            };
        }
    }
    
    drawDetections(predictions, faceResults, emotions) {
        const canvas = this.elements.detectionCanvas;
        const ctx = canvas.getContext('2d');
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw object detections (unchanged for compatibility)
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
        
        // Optimized face landmarks drawing
        if (faceResults.length > 0) {
            try {
                ctx.save();
                faceResults.forEach((landmarks, index) => {
                    // Get emotion for this face
                    const emotion = emotions.find(e => e.faceIndex === index);
                    const emotionText = emotion ? 
                        `${emotion.emotion} (${Math.round(emotion.confidence * 100)}%)` : 
                        'analyzing...';
                    
                    // Optimized emotion color coding
                    let faceColor = '#FFFFFF';
                    if (emotion) {
                        switch (emotion.emotion.toLowerCase()) {
                            case 'happy': faceColor = '#00FF00'; break;
                            case 'sad': faceColor = '#4488FF'; break;
                            case 'angry': faceColor = '#FF2222'; break;
                            case 'surprised': faceColor = '#FFFF00'; break;
                            case 'fear': faceColor = '#FF8800'; break;
                            case 'disgust': faceColor = '#8800FF'; break;
                            default: faceColor = '#CCCCCC';
                        }
                    }
                    
                    // Draw optimized landmarks (reduced density for performance)
                    if (landmarks && landmarks.length > 0) {
                        ctx.fillStyle = faceColor;
                        ctx.strokeStyle = faceColor;
                        
                        // Draw only key landmarks for performance
                        const keyIndices = [33, 7, 163, 144, 145, 153, 154, 155, 133, 173, 157, 158, 159, 160, 161, 246, 
                                          46, 53, 70, 63, 1, 2, 5, 4, 19, 94, 168, 13, 14, 17, 18, 200, 199, 175, 0, 11, 12, 15, 16];
                        
                        keyIndices.forEach(landmarkIndex => {
                            if (landmarks[landmarkIndex]) {
                                const landmark = landmarks[landmarkIndex];
                                const x = landmark.x * canvas.width;
                                const y = landmark.y * canvas.height;
                                
                                ctx.beginPath();
                                ctx.arc(x, y, 1, 0, 2 * Math.PI);
                                ctx.fill();
                            }
                        });
                        
                        // Optimized emotion label
                        const firstPoint = landmarks[0];
                        const x = firstPoint.x * canvas.width;
                        const y = firstPoint.y * canvas.height;
                        
                        ctx.font = 'bold 12px Courier New';
                        let labelText = `${emotionText}`;
                        if (emotion && emotion.source) {
                            labelText += ` [${emotion.source}]`;
                        }
                        
                        const textWidth = ctx.measureText(labelText).width;
                        
                        // Simple background
                        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
                        ctx.fillRect(x - 20, y - 45, textWidth + 20, 30);
                        
                        // Text
                        ctx.fillStyle = faceColor;
                        ctx.fillText(labelText, x - 15, y - 30);
                        
                        // Performance indicator
                        ctx.font = '10px Courier New';
                        ctx.fillStyle = '#00FFFF';
                        ctx.fillText('HIGH-SPEED', x - 15, y - 18);
                    }
                });
                ctx.restore();
            } catch (drawError) {
                console.warn('Error drawing optimized landmarks:', drawError);
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
        
        // Add face information with high-speed emotions
        if (this.faceLandmarks.length > 0) {
            const faceItem = document.createElement('div');
            faceItem.className = 'object-item face-detection';
            
            let emotionSummary = 'Tracked';
            if (this.detectedEmotions.length > 0) {
                const emotionList = this.detectedEmotions.map(e => {
                    let str = `${e.emotion} (${Math.round(e.confidence * 100)}%)`;
                    if (e.source && e.source.includes('AI')) str += ' 🧠';
                    return str;
                }).join(', ');
                emotionSummary = emotionList;
            }
            
            faceItem.innerHTML = `
                <div class="object-info">
                    <span class="object-name">⚡ High-Speed Faces</span>
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
            threatDetails = `⚠️ High-speed emotion analysis detected concerns: ${concerningEmotions.map(e => 
                `${e.emotion} (${Math.round(e.confidence * 100)}%)`
            ).join(', ')}. `;
        } else if (suspiciousItems.length > 0) {
            threatLevel = 'medium';
            threatText = 'MONITORING';
            threatDetails = `${suspiciousItems.length} unattended item${suspiciousItems.length > 1 ? 's' : ''} under surveillance. `;
        }
        
        threatDetails += `Real-time monitoring: ${peopleCount} people, ${faceCount} faces with high-speed emotion analysis.`;
        
        if (this.detectedEmotions.length > 0) {
            const emotionSummary = this.detectedEmotions.map(e => `${e.emotion} (${Math.round(e.confidence * 100)}%)`).join(', ');
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
        
        medicalStatus += `Real-time monitoring: ${peopleCount} patient${peopleCount !== 1 ? 's' : ''}, ${faceCount} face${faceCount !== 1 ? 's' : ''} with high-speed emotional assessment.`;
        
        if (faceCount > 0) {
            medicalStatus += ' Continuous monitoring for distress indicators active.';
            
            if (medicalConcerns.length > 0) {
                medicalStatus += ` Medical emotional indicators: ${medicalConcerns.map(e => 
                    `${e.emotion} (${Math.round(e.confidence * 100)}%)`
                ).join(', ')} - potential patient discomfort detected.`;
            }
        }
        
        this.elements.medicalItems.textContent = medicalStatus;
    }
    
    // Voice and interaction methods (optimized for performance)
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
    
    // Remaining methods unchanged for compatibility...
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
        this.speak(`Switching to ${mode.toLowerCase()} mode. High-performance systems optimized for ${mode.toLowerCase()} operations.`);
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
        
        // Keep only last 50 data points for performance
        if (this.performanceData.length > 50) {
            this.performanceData.shift();
        }
        
        // Calculate average response time
        const avgTime = this.performanceData.reduce((sum, data) => sum + data.processingTime, 0) / this.performanceData.length;
        this.elements.avgResponseTime.textContent = `${Math.round(avgTime)}ms`;
        
        // Update charts if available (throttled)
        if (this.frameCount % 10 === 0) { // Update chart every 10 frames
            this.updatePerformanceChart(processingTime);
        }
        
        // Update simple performance display
        this.updateSimplePerformanceDisplay(processingTime);
    }
    
    updatePerformanceChart(processingTime) {
        if (this.charts.performance) {
            const chart = this.charts.performance;
            const now = new Date().toLocaleTimeString();
            
            chart.data.labels.push(now);
            chart.data.datasets[0].data.push(processingTime);
            
            // Keep only last 15 data points for performance
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
        
        // Optimized load calculation
        if (cpuLoadElement && aiLoadElement) {
            const cpuLoad = Math.min(100, Math.round((processingTime / 80) * 100)); // Adjusted for faster processing
            const aiLoad = Math.min(100, Math.round((processingTime / 40) * 100));
            
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
            this.speak('Emergency protocol activated. High-performance systems on standby.');
            this.addActivity('Emergency protocol activated', '🚨');
        } else {
            // Emergency deactivated
            this.elements.emergencyBtn.textContent = 'EMERGENCY STOP';
            this.elements.emergencyBtn.style.background = 'linear-gradient(45deg, var(--accent-red), rgba(var(--color-red-400-rgb), 0.8))';
            this.speak('Emergency protocol deactivated. High-performance systems resuming normal operation.');
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

// Initialize the high-performance system when the page loads
document.addEventListener('DOMContentLoaded', () => {
    window.guardianX = new GuardianXAssistant();
});

// Export for potential use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { GuardianXAssistant, GuardianAIEngine };
}
