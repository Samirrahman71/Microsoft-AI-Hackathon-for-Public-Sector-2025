from flask import Flask, request, jsonify, render_template_string
import os
from dotenv import load_dotenv
from chatbot.rag_system import RAGSystem

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Initialize the RAG system
openai_api_key = os.getenv('OPENAI_API_KEY')
knowledge_base_dir = os.path.join(os.path.dirname(__file__), 'knowledge_base')
rag_system = None

# System prompt for the chatbot
system_prompt = """You are GovChat, an AI assistant for government services in California. 

When a user asks a question:
1. Check if the query is clear and specific. If ambiguous or missing details, politely ask for clarification before answering.
2. If the query is about a government form, identify the correct form and provide the official name and direct instructions on how to access or submit it.
3. Provide step-by-step instructions or a concise summary, always citing your source documents at the end.
4. If the information cannot be found in your sources, say "I don't know" and suggest what the user could ask next.
5. Maintain a helpful tone that is easy to understand for anyone, regardless of their background.
6. Base your responses on the context provided from verified government information sources.

Remember to be empathetic, clear, and precise in your guidance about California government services."""

# HTML template for the chat interface
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html>
<head>
    <title>GovChat with RAG</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            background-color: #f5f5f5;
        }
        .header {
            background-color: #003366;
            color: white;
            padding: 20px;
            text-align: center;
            border-radius: 5px 5px 0 0;
            margin-bottom: 20px;
        }
        .chat-container {
            background-color: white;
            border-radius: 5px;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
            padding: 20px;
            margin-bottom: 20px;
        }
        #chat-history {
            max-height: 400px;
            overflow-y: auto;
            margin-bottom: 20px;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
        }
        .message {
            margin-bottom: 10px;
            padding: 10px;
            border-radius: 5px;
        }
        .user-message {
            background-color: #e6f7ff;
            text-align: right;
            margin-left: 20%;
        }
        .bot-message {
            background-color: #f2f2f2;
            margin-right: 20%;
        }
        .sources {
            font-size: 0.8em;
            color: #666;
            margin-top: 5px;
            border-top: 1px solid #eee;
            padding-top: 5px;
        }
        .input-container {
            display: flex;
        }
        #user-input {
            flex-grow: 1;
            padding: 10px;
            border: 1px solid #ddd;
            border-radius: 5px;
            margin-right: 10px;
        }
        button {
            background-color: #003366;
            color: white;
            border: none;
            padding: 10px 15px;
            border-radius: 5px;
            cursor: pointer;
        }
        button:hover {
            background-color: #002244;
        }
        .loading {
            text-align: center;
            color: #666;
            margin: 10px 0;
            display: none;
        }
        .example-queries {
            margin-top: 20px;
        }
        .example-query {
            background-color: #e6f7ff;
            padding: 8px;
            margin: 5px 0;
            border-radius: 3px;
            cursor: pointer;
        }
        .example-query:hover {
            background-color: #cceeff;
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>GovChat with RAG</h1>
        <p>Retrieval-Augmented Generation for Government Services</p>
    </div>
    
    <div class="chat-container">
        <div id="chat-history">
            <div class="message bot-message">
                Hello! I'm GovChat, enhanced with Retrieval-Augmented Generation. I can provide information about California government services, including DMV services, tax information, and benefits programs. How can I help you today?
            </div>
        </div>
        
        <div class="loading" id="loading-indicator">Thinking...</div>
        
        <div class="input-container">
            <input type="text" id="user-input" placeholder="Ask about government services...">
            <button onclick="sendMessage()">Send</button>
        </div>
    </div>
    
    <div class="example-queries">
        <h3>Example Questions:</h3>
        <div class="example-query" onclick="useExample(this)">How do I renew my driver's license?</div>
        <div class="example-query" onclick="useExample(this)">What tax benefits are available for low-income families?</div>
        <div class="example-query" onclick="useExample(this)">How can I apply for food assistance programs?</div>
        <div class="example-query" onclick="useExample(this)">What is the process for changing my address with the DMV?</div>
        <div class="example-query" onclick="useExample(this)">How do property taxes work in California?</div>
    </div>
    
    <script>
        let indexBuilt = false;
        
        // First build the index when the page loads
        window.onload = async function() {
            try {
                document.getElementById('loading-indicator').style.display = 'block';
                const response = await fetch('/build-index');
                const data = await response.json();
                if (data.status === 'success') {
                    indexBuilt = true;
                    console.log('Index built successfully');
                } else {
                    console.error('Error building index:', data.error);
                    addMessage('bot', 'Error building knowledge index. Please try again later.');
                }
            } catch (error) {
                console.error('Error:', error);
                addMessage('bot', 'Error building knowledge index. Please try again later.');
            } finally {
                document.getElementById('loading-indicator').style.display = 'none';
            }
        };
        
        async function sendMessage() {
            const input = document.getElementById('user-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            if (!indexBuilt) {
                addMessage('bot', 'Still building the knowledge index. Please wait a moment and try again.');
                return;
            }
            
            // Add user message to chat
            addMessage('user', message);
            input.value = '';
            
            // Show loading indicator
            document.getElementById('loading-indicator').style.display = 'block';
            
            try {
                // Send message to server
                const response = await fetch('/chat', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ message })
                });
                
                const data = await response.json();
                
                // Add bot response to chat
                addMessage('bot', data.response, data.sources);
            } catch (error) {
                console.error('Error:', error);
                addMessage('bot', 'Sorry, there was an error processing your request.');
            } finally {
                // Hide loading indicator
                document.getElementById('loading-indicator').style.display = 'none';
            }
        }
        
        function addMessage(sender, message, sources = null) {
            const chatHistory = document.getElementById('chat-history');
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            // Main message content
            messageDiv.innerHTML = message;
            
            // Add sources if available
            if (sources && sources.length > 0) {
                const sourcesDiv = document.createElement('div');
                sourcesDiv.className = 'sources';
                sourcesDiv.innerHTML = '<strong>Sources:</strong> ' + 
                    sources.map(s => `${s.source} (${s.category})`).join(', ');
                messageDiv.appendChild(sourcesDiv);
            }
            
            chatHistory.appendChild(messageDiv);
            
            // Scroll to bottom
            chatHistory.scrollTop = chatHistory.scrollHeight;
        }
        
        function useExample(element) {
            const input = document.getElementById('user-input');
            input.value = element.textContent;
            input.focus();
        }
        
        // Allow Enter key to send message
        document.getElementById('user-input').addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                sendMessage();
            }
        });
    </script>
</body>
</html>
'''

@app.route('/')
def home():
    return render_template_string(HTML_TEMPLATE)

@app.route('/build-index', methods=['GET'])
def build_index():
    global rag_system
    
    try:
        if not rag_system:
            if not openai_api_key:
                return jsonify({'status': 'error', 'error': 'OpenAI API key not found'}), 500
                
            rag_system = RAGSystem(
                knowledge_base_dir=knowledge_base_dir,
                openai_api_key=openai_api_key
            )
            
        rag_system.build_index()
        return jsonify({'status': 'success'})
    except Exception as e:
        return jsonify({'status': 'error', 'error': str(e)}), 500

@app.route('/chat', methods=['POST'])
def chat():
    global rag_system
    
    if not rag_system:
        return jsonify({'status': 'error', 'message': 'RAG system not initialized'}), 500
        
    data = request.json
    user_message = data.get('message', '')
    
    if not user_message:
        return jsonify({'status': 'error', 'message': 'No message provided'}), 400
        
    try:
        # Generate response using RAG
        response, sources = rag_system.generate_response(
            user_query=user_message,
            system_prompt=system_prompt,
            location="California"
        )
        
        return jsonify({
            'status': 'success',
            'response': response,
            'sources': sources
        })
    except Exception as e:
        return jsonify({'status': 'error', 'message': str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5002)
