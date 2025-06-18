export interface AiConfig {
    // AI provider options
    provider: 'openai' | 'azure' | 'anthropic' | 'jan' | 'huggingface';

    // Model configuration
    model: string;

    // API settings
    apiBaseUrl: string;
    apiVersion?: string;

    // Rate limiting
    maxRequestsPerMinute: number;

    // Request defaults
    defaultTemperature: number;
    defaultMaxTokens: number;

    // Prompts
    systemPrompt: string;
}

// Default configuration
export const defaultAiConfig: AiConfig = {
    provider: (import.meta.env.VITE_AI_PROVIDER as any) || 'openai',
    model: import.meta.env.VITE_AI_MODEL || 'gpt-4',
    apiBaseUrl: import.meta.env.VITE_AI_API_URL || 'https://api.openai.com/v1',
    apiVersion: import.meta.env.VITE_AI_API_VERSION,
    maxRequestsPerMinute: 60,
    defaultTemperature: 0.7,
    defaultMaxTokens: 1000,
    systemPrompt: `You are an AI assistant specializing in real estate. Help users find properties by understanding their requirements.
When analyzing queries, identify:
1. Property types (house, apartment, etc.)
2. Location preferences
3. Number of rooms
4. Price range
5. Size requirements
6. Special features (garden, parking, etc.)
7. Preferences (modern, traditional, etc.)`
};

// AI provider-specific configurations
export const providerConfigs = {
    openai: {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY}`
        },
        endpoints: {
            completion: '/chat/completions'
        }
    },
    jan: {
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${import.meta.env.VITE_JAN_API_KEY}`
        },
        endpoints: {
            completion: '/api/chat/completions'
        }
    },
    // Add other providers as needed
};

// Get current provider configuration
export const getCurrentProviderConfig = () => {
    const provider = defaultAiConfig.provider;
    return providerConfigs[provider] || providerConfigs.openai;
};