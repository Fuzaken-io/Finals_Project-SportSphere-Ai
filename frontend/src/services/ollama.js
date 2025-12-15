// No system prompt here - using the one defined in Modelfile instead
export const sendMessageToOllama = async (messages, chat_id, onChunk, signal = null) => {
    // Fix for optional signal in case it was passed incorrectly before
    const actualOnChunk = typeof onChunk === 'function' ? onChunk : null;
    const actualSignal = signal || (typeof onChunk === 'object' ? onChunk : null);

    try {
        const response = await fetch('http://localhost:8000/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'SportSphere',
                messages: messages,
                chat_id: chat_id
            }),
            signal: actualSignal,
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        let fullMessage = '';

        while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });
            const lines = buffer.split('\n\n');
            buffer = lines.pop(); // Keep incomplete line

            for (const line of lines) {
                if (line.startsWith('data: ')) {
                    const jsonStr = line.slice(6);
                    try {
                        const data = JSON.parse(jsonStr);
                        if (data.message && data.message.content) {
                            const content = data.message.content;
                            fullMessage += content;
                            if (actualOnChunk) {
                                actualOnChunk(content);
                            }
                        }
                    } catch (e) {
                        console.error("Error parsing SSE JSON:", e, jsonStr);
                    }
                }
            }
        }

        return fullMessage;

    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request was cancelled');
            throw new Error('cancelled');
        }
        console.error("Error communicating with Ollama:", error);
        throw error;
    }
};
