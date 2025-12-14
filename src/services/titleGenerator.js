const TITLE_GENERATION_PROMPT = `You are responsible ONLY for generating conversation titles for a chat application.

=====================================
WHEN TO GENERATE A TITLE
=====================================

Generate a title ONLY when:
- A new chat is created
- The user sends their FIRST meaningful message

Do NOT generate a title:
- On empty chats
- On "New Chat" click alone
- On system or greeting messages

=====================================
HOW TO GENERATE THE TITLE
=====================================

Rules:
- Base the title on the user's FIRST message
- Summarize the intent in 2–6 words
- Be specific, not generic
- Do NOT use timestamps as the title
- Do NOT repeat existing titles verbatim

GOOD titles:
- "Chat UI Message Alignment"
- "Sports AI System Prompt"
- "React Sidebar Duplication Issue"
- "New Chat Logic Explanation"

BAD titles (FORBIDDEN):
- "Chat Dec 14, 9:40 AM"
- "New Chat"
- "Conversation"
- "Untitled Chat"

=====================================
DUPLICATE PREVENTION
=====================================

If a generated title already exists:
- Slightly rephrase it
OR
- Add a clarifying keyword
OR
- Add a short suffix like "(UI)", "(Logic)", or "(Fix)"

Example:
- "Chat UI Design"
- "Chat UI Design (Sidebar)"
- "Chat UI Design (State)"

=====================================
FORMAT RULES
=====================================

- Title must be plain text
- No punctuation at the end
- No emojis
- No quotes
- Capitalize first letter of each word

=====================================
OUTPUT
=====================================

Return ONLY the title text.
Do not explain.
Do not add extra words.`;

export const generateConversationTitle = async (firstUserMessage, existingTitles = []) => {
    try {
        const existingTitlesContext = existingTitles.length > 0
            ? `\n\nExisting titles to avoid duplicating:\n${existingTitles.join('\n')}`
            : '';

        const response = await fetch('http://localhost:11434/api/chat', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                model: 'dribol',
                messages: [
                    { role: 'system', content: TITLE_GENERATION_PROMPT + existingTitlesContext },
                    { role: 'user', content: firstUserMessage }
                ],
                stream: false,
            }),
        });

        if (!response.ok) {
            throw new Error(`Ollama API Error: ${response.statusText}`);
        }

        const data = await response.json();
        let title = data.message.content.trim();

        // Clean up the title (remove quotes, periods, etc.)
        title = title.replace(/^["']|["']$/g, ''); // Remove surrounding quotes
        title = title.replace(/\.$/, ''); // Remove trailing period

        // Fallback if title is too long or empty
        if (!title || title.length > 60) {
            title = firstUserMessage.substring(0, 50) + (firstUserMessage.length > 50 ? '...' : '');
        }

        return title;
    } catch (error) {
        console.error('Error generating title:', error);
        // Fallback to simple truncation
        return firstUserMessage.substring(0, 50) + (firstUserMessage.length > 50 ? '...' : '');
    }
};
