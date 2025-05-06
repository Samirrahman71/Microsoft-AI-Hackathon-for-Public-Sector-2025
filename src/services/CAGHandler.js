import config from './config';

class CAGHandler {
    constructor() {
        this.verifiedSources = new Set();
        this.currentLanguage = 'en';
    }

    // Process user input and generate appropriate response
    async processInput(userInput) {
        // Check for out-of-scope content
        if (this.isOutOfScope(userInput)) {
            return this.getOutOfScopeResponse();
        }

        // Check if input is vague and needs clarification
        if (this.isVagueInput(userInput)) {
            return this.handleVagueInput(userInput);
        }

        // Process the input based on type
        const response = await this.generateResponse(userInput);
        
        // Add disclaimer if needed
        if (this.requiresDisclaimer(userInput)) {
            response.content += `\n\n${this.getDisclaimer()}`;
        }

        return response;
    }

    // Check if the input is out of scope
    isOutOfScope(input) {
        const outOfScopePatterns = [
            /unicorn/i,
            /alien/i,
            /magic/i,
            /fantasy/i,
            /joke/i,
            /troll/i,
            /off-topic/i,
            /nonsense/i
        ];

        return outOfScopePatterns.some(pattern => pattern.test(input));
    }

    // Check if input is vague and needs clarification
    isVagueInput(input) {
        const vaguePatterns = [
            /what do i do/i,
            /^help$/i,
            /^hi$/i,
            /^hello$/i,
            /how does this work/i,
            /what can you do/i,
            /^tell me something$/i
        ];

        return vaguePatterns.some(pattern => pattern.test(input));
    }

    // Handle vague inputs by asking clarifying questions
    handleVagueInput(input) {
        const clarifyingResponses = {
            en: [
                "I'm here to help with government-related questions. Could you please be more specific about what you're looking for?",
                "I can assist with information about government services, forms, and processes. What specifically would you like to know more about?",
                "I'd be happy to help with your government-related inquiry. Could you provide more details about what you need assistance with?"
            ],
            es: [
                "Estoy aquí para ayudar con preguntas relacionadas con el gobierno. ¿Podrías ser más específico sobre lo que estás buscando?",
                "Puedo ayudarte con información sobre servicios gubernamentales, formularios y procesos. ¿Qué te gustaría saber específicamente?",
                "Estaré encantado de ayudarte con tu consulta relacionada con el gobierno. ¿Podrías proporcionar más detalles sobre lo que necesitas ayuda?"
            ],
            fr: [
                "Je suis là pour vous aider avec des questions liées au gouvernement. Pourriez-vous être plus précis sur ce que vous recherchez ?",
                "Je peux vous aider avec des informations sur les services gouvernementaux, les formulaires et les processus. Qu'aimeriez-vous savoir plus précisément ?",
                "Je serais heureux de vous aider dans votre demande liée au gouvernement. Pourriez-vous fournir plus de détails sur ce pour quoi vous avez besoin d'aide ?"
            ]
        };

        const responses = clarifyingResponses[this.currentLanguage] || clarifyingResponses.en;
        const randomIndex = Math.floor(Math.random() * responses.length);
        
        return {
            content: responses[randomIndex],
            sources: []
        };
    }

    // Generate a response based on the input
    async generateResponse(input) {
        try {
            // Prepare the API request payload
            const apiRequestBody = {
                model: config.modelName,
                messages: [
                    { role: "system", content: this.getSystemPrompt() },
                    { role: "user", content: input }
                ],
                temperature: config.temperature,
                max_tokens: config.maxTokens
            };

            // Make the API request
            const response = await fetch('https://api.openai.com/v1/chat/completions', {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    "Authorization": `Bearer ${config.apiKey}`
                },
                body: JSON.stringify(apiRequestBody)
            });

            // Parse the response
            const data = await response.json();
            
            // Extract sources from response if available
            const sources = this.extractSources(data.choices[0].message.content);
            
            // Clean up the content
            let content = this.cleanContent(data.choices[0].message.content);
            
            return {
                content,
                sources
            };
        } catch (error) {
            console.error("Error generating response:", error);
            return {
                content: "I'm sorry, but I encountered an error processing your request. Please try again later.",
                sources: []
            };
        }
    }

    // Extract sources cited in the response
    extractSources(content) {
        const sourceRegex = /\[Source: ([^\]]+)\]/g;
        const sources = [];
        let match;
        
        while ((match = sourceRegex.exec(content)) !== null) {
            sources.push(match[1]);
        }
        
        return sources;
    }

    // Clean up the content by removing source tags
    cleanContent(content) {
        return content.replace(/\[Source: [^\]]+\]/g, '').trim();
    }

    // Get system prompt for the LLM
    getSystemPrompt() {
        const basePrompt = {
            en: "You are GovChat, a helpful assistant designed to provide accurate information about government services, policies, and procedures. Your responses should be clear, concise, and based on verified information from official government sources. When you're unsure, acknowledge the limitations and suggest official channels for further information.",
            es: "Eres GovChat, un asistente útil diseñado para proporcionar información precisa sobre servicios gubernamentales, políticas y procedimientos. Tus respuestas deben ser claras, concisas y basadas en información verificada de fuentes gubernamentales oficiales. Cuando no estés seguro, reconoce las limitaciones y sugiere canales oficiales para obtener más información.",
            fr: "Vous êtes GovChat, un assistant utile conçu pour fournir des informations précises sur les services gouvernementaux, les politiques et les procédures. Vos réponses doivent être claires, concises et basées sur des informations vérifiées provenant de sources gouvernementales officielles. Lorsque vous n'êtes pas sûr, reconnaissez les limites et suggérez des canaux officiels pour plus d'informations."
        };
        
        return basePrompt[this.currentLanguage] || basePrompt.en;
    }

    // Get out-of-scope response
    getOutOfScopeResponse() {
        const responses = {
            en: config.cagRules.outOfScopeResponse,
            es: "GovChat está diseñado para ayudar solo con servicios oficiales relacionados con el gobierno. No puedo ayudar con esa solicitud.",
            fr: "GovChat est conçu pour aider uniquement avec les services officiels liés au gouvernement. Je ne peux pas vous aider avec cette demande."
        };
        
        return {
            content: responses[this.currentLanguage] || responses.en,
            sources: []
        };
    }

    // Get unverified information response
    getUnverifiedResponse() {
        const responses = {
            en: config.cagRules.unverifiedResponse,
            es: "No puedo verificar esa información según la documentación gubernamental actual. Por favor, consulte una fuente u oficina gubernamental oficial.",
            fr: "Je ne peux pas vérifier ces informations sur la base de la documentation gouvernementale actuelle. Veuillez consulter une source ou un bureau gouvernemental officiel."
        };
        
        return {
            content: responses[this.currentLanguage] || responses.en,
            sources: []
        };
    }

    // Check if the response requires a disclaimer
    requiresDisclaimer(input) {
        const disclaimerPatterns = [
            /law/i,
            /legal/i,
            /tax/i,
            /benefit/i,
            /eligibility/i,
            /regulation/i,
            /requirement/i
        ];

        return disclaimerPatterns.some(pattern => pattern.test(input));
    }

    // Get appropriate disclaimer
    getDisclaimer() {
        const disclaimers = {
            en: config.cagRules.disclaimer,
            es: "Esta es información general y no asesoramiento legal.",
            fr: "Il s'agit d'informations générales et non de conseils juridiques."
        };
        
        return disclaimers[this.currentLanguage] || disclaimers.en;
    }

    // Set current language
    setLanguage(lang) {
        this.currentLanguage = lang;
    }
}

export default CAGHandler;
