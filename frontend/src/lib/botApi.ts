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
    try {
        // Convert FormData to JSON with base64 files
        const company_name = formData.get('company_name') as string;
        const files = formData.getAll('files') as File[];
        
        console.log('botApi: Converting files to base64...', files.length);
        
        const filesData = await Promise.all(
            files.map(async (file) => {
                console.log('botApi: Processing file:', file.name, file.size, file.type);
                const arrayBuffer = await file.arrayBuffer();
                
                // Convert to base64 in chunks to avoid stack overflow
                const bytes = new Uint8Array(arrayBuffer);
                let binary = '';
                const chunkSize = 8192;
                for (let i = 0; i < bytes.length; i += chunkSize) {
                    const chunk = bytes.subarray(i, i + chunkSize);
                    binary += String.fromCharCode.apply(null, Array.from(chunk));
                }
                const base64 = btoa(binary);
                
                console.log('botApi: File converted, base64 length:', base64.length);
                return {
                    filename: file.name,
                    content: base64,
                    content_type: file.type
                };
            })
        );
        
        console.log('botApi: Sending request to /api/upload');
        const response = await api.post('/api/upload', {
            company_name,
            files: filesData
        });
        console.log('botApi: Response received:', response.data);
        return response.data;
    } catch (error: any) {
        console.error('botApi: Error in createBot:', error);
        console.error('botApi: Error response:', error.response?.data);
        throw error;
    }
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
