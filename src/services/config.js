const config = {
    // API Configuration
    apiKey: process.env.REACT_APP_OPENAI_API_KEY || '', // Will be set via environment variable
    modelName: 'gpt-4o-mini',
    temperature: 0.7,
    maxTokens: 1000,

    // CAG Rules
    cagRules: {
        disclaimer: "This is general information and not legal advice.",
        outOfScopeResponse: "GovChat is designed to assist with official government-related services only. I'm unable to help with that request.",
        unverifiedResponse: "I'm unable to verify that information based on current government documentation. Please consult an official government source or office."
    }
};

export default config;
