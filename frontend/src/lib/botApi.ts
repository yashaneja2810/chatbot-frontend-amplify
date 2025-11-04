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
    // Convert FormData to JSON with base64 files
    const company_name = formData.get('company_name') as string;
    const files = formData.getAll('files') as File[];
    
    const filesData = await Promise.all(
        files.map(async (file) => {
            const arrayBuffer = await file.arrayBuffer();
            const base64 = btoa(String.fromCharCode(...new Uint8Array(arrayBuffer)));
            return {
                filename: file.name,
                content: base64,
                content_type: file.type
            };
        })
    );
    
    const response = await api.post('/api/upload', {
        company_name,
        files: filesData
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
