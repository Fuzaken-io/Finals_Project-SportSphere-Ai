// No system prompt here - using the one defined in Modelfile instead
export const sendMessageToOllama = async (messages, signal = null) => {
    try {
        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'dribol',
                messages: messages, // Send messages directly, no prepended system prompt
                stream: false,
            }),
            signal, // Support cancellation via AbortController
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        return data.message;
    } catch (error) {
        if (error.name === 'AbortError') {
            console.log('Request was cancelled');
            throw new Error('cancelled');
        }
        console.error("Error communicating with Ollama:", error);
        throw error;
    }
};
