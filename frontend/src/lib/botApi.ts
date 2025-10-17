import { api } from './api';

export interface Bot {
    id: string;
    name: string;
    created_at: string;
    user_id: string;
}

export interface CreateBotResponse {
    bot_id: string;
    widget_code: string;
    message: string;
}

export interface ChatMessage {
    role: 'user' | 'assistant';
    content: string;
}

export const createBot = async (formData: FormData): Promise<CreateBotResponse> => {
    const response = await api.post('/api/upload', formData, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    });
    return response.data;
};

export const sendChatMessage = async (botId: string, message: string) => {
    const response = await api.post('/api/chat', {
        bot_id: botId,
        query: message, // Changed from message to query to match backend schema
    });
    return response.data;
};

export const deleteBot = async (botId: string): Promise<void> => {
    await api.delete(`/api/bots/${botId}`);
};
