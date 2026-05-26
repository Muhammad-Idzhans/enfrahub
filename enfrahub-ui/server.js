import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { DefaultAzureCredential } from '@azure/identity';
import { AIProjectClient } from '@azure/ai-projects';

// Load environment variables from .env.local
dotenv.config({ path: '.env.local' });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// API Routes
app.post('/api/chat', async (req, res) => {
    try {
        const { message, conversationId } = req.body;

        if (!message) {
            return res.status(400).json({ error: "Message is required" });
        }

        const projectEndpoint = process.env.FOUNDRY_PROJECT_ENDPOINT;
        const agentName = process.env.AZURE_OPENAI_AGENT_ID;
        const agentVersion = process.env.AZURE_OPENAI_AGENT_VERSION || "1";

        if (!projectEndpoint || !agentName) {
            return res.status(500).json({ error: "Foundry API configuration missing in .env.local" });
        }

        // Initialize AI Project client
        const projectClient = new AIProjectClient(projectEndpoint, new DefaultAzureCredential());
        const openAIClient = projectClient.getOpenAIClient();

        let currentConversationId = conversationId;

        // Create or continue conversation thread
        if (!currentConversationId) {
            const newConversation = await openAIClient.conversations.create({
                items: [{ type: "message", role: "user", content: [{ type: "input_text", text: message }] }]
            });
            currentConversationId = newConversation.id;
        } else {
            await openAIClient.conversations.items.create(currentConversationId, {
                items: [{ type: "message", role: "user", content: [{ type: "input_text", text: message }] }]
            });
        }

        // Send to agent
        const response = await openAIClient.responses.create(
            { conversation: currentConversationId },
            { body: { agent_reference: { name: agentName, version: agentVersion, type: "agent_reference" } } }
        );

        res.json({
            reply: response.output_text,
            conversationId: currentConversationId
        });
    } catch (error) {
        console.error("Error communicating with Foundry Agent:", error);

        // Handle basic azure credential or project errors
        let userMessage = "Sorry, I'm unable to respond right now. Please try again later.";

        if (error.code === "PermissionDenied" || error.status === 401) {
            userMessage = "I don't have permission to access the data service. Please contact your administrator.";
        } else if (error.message?.includes("Failed to fetch") || error.message?.includes("ECONNREFUSED")) {
            userMessage = "Unable to reach the AI service. Please check your network connection and try again.";
        }

        res.status(500).json({ error: userMessage });
    }
});

// Serve static assets if in production
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'dist')));

    app.get('/{*path}', (req, res) => {
        res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
}

app.listen(port, () => {
    console.log(`Server listening on port ${port}`);
});
