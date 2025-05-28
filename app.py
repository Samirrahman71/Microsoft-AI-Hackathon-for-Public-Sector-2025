from flask import Flask, request, jsonify, render_template_string
import os
import openai
import json
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

app = Flask(__name__)

# Set up OpenAI API key from environment variables
# The actual key should be set in Vercel environment variables
openai.api_key = os.getenv("OPENAI_API_KEY", "")

# Modern, accessible color palette
COLOR_PALETTE = {
    "primary": "#4F46E5",        # Indigo - primary actions
    "primary_dark": "#4338CA",   # Darker indigo - hover states
    "primary_light": "#EEF2FF",  # Light indigo - backgrounds
    "secondary": "#10B981",      # Emerald green - success states
    "accent": "#8B5CF6",         # Purple - accent elements
    "neutral_dark": "#1F2937",   # Almost black - text
    "neutral_medium": "#6B7280", # Medium gray - secondary text
    "neutral_light": "#F9FAFB",  # Light gray - backgrounds
    "error": "#EF4444",          # Red - error states
    "warning": "#F59E0B",        # Amber - warning states
    "info": "#3B82F6",           # Blue - info messages
    "success": "#10B981",        # Green - success messages
}

# Sample knowledge base - this would be replaced with a proper RAG implementation
KNOWLEDGE_BASE = [
    {
        "topic": "driver's license renewal",
        "content": "To renew your driver's license in California, you'll need to complete a DL 44 form, pay the renewal fee ($38 for a basic Class C license), pass a vision test, provide your thumbprint, and have your photo taken. You may need to take a written test if your license has been expired for too long. You can renew your license up to 6 months before it expires. For most drivers, you can renew online at dmv.ca.gov."
    },
    {
        "topic": "vehicle registration",
        "content": "To register a vehicle in California, you'll need a completed Application for Title or Registration (REG 343), the vehicle's title properly signed over to you, a smog certification (if applicable), proof of insurance, and payment for registration fees and taxes. For a new vehicle, you'll need to visit a DMV office or mail in your application. For registration renewal, you can usually do this online at dmv.ca.gov."
    },
    {
        "topic": "address change",
        "content": "To change your address with the California DMV, you have three options: 1) Online: Visit dmv.ca.gov and use the Change of Address system, 2) By Mail: Complete a Change of Address (DMV 14) form and mail it to the DMV, or 3) In Person: Visit any DMV office and submit the form. California law requires you to notify the DMV within 10 days of changing your address."
    },
    {
        "topic": "calfresh",
        "content": "CalFresh is California's food assistance program (formerly known as Food Stamps). You can apply online at GetCalFresh.org, by phone by calling your county social services office, in person at your local county social services office, or by mail by downloading and completing the application, then mailing it to your county office. Eligibility is based on income, resources, and household size. Benefits are provided on an Electronic Benefit Transfer (EBT) card that works like a debit card at grocery stores and farmers markets."
    },
    {
        "topic": "tax benefits",
        "content": "California offers several tax benefits for low-income families: California Earned Income Tax Credit (CalEITC), Young Child Tax Credit, Renter's Credit, Child and Dependent Care Expenses Credit, and Student Loan Interest Deduction. For the CalEITC, you may qualify if you earned less than $30,000. The Young Child Tax Credit provides up to $1,000 for families with children under 6 years old. Visit ftb.ca.gov for more information and to check eligibility."
    },
    {
        "topic": "housing assistance",
        "content": "To apply for housing assistance in California, contact your local Public Housing Authority (PHA), complete an application for either public housing or Section 8 Housing Choice Vouchers, provide documentation of income, assets, and family composition, and wait to be placed on a waiting list (these can be long in many areas). California also offers other housing programs through the Department of Housing and Community Development (HCD) and CalHFA for first-time homebuyers. For immediate help, call 211 to connect with local housing resources."
    }
]

# Enhanced HTML template with improved UI
HTML_TEMPLATE = '''
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>GovFlowAI - California Government Services</title>
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css">
    <style>
        :root {
            --primary: #4F46E5;
            --primary-dark: #4338CA;
            --primary-light: #EEF2FF;
            --secondary: #10B981;
            --accent: #8B5CF6;
            --neutral-dark: #1F2937;
            --neutral-medium: #6B7280;
            --neutral-light: #F9FAFB;
            --error: #EF4444;
            --warning: #F59E0B;
            --info: #3B82F6;
            --success: #10B981;
            --border-radius: 8px;
            --shadow-sm: 0 1px 2px 0 rgba(0, 0, 0, 0.05);
            --shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);
            --shadow-lg: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
            --font-family: 'Inter', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
        }
        
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
        }
        
        body {
            font-family: var(--font-family);
            color: var(--neutral-dark);
            background-color: var(--neutral-light);
            line-height: 1.5;
        }
        
        .app-container {
            display: flex;
            flex-direction: column;
            min-height: 100vh;
        }
        
        .header {
            background-color: var(--primary);
            color: white;
            padding: 1rem;
            text-align: center;
            box-shadow: var(--shadow);
        }
        
        .header h1 {
            font-size: 1.5rem;
            margin-bottom: 0.25rem;
        }
        
        .header p {
            font-size: 0.875rem;
            opacity: 0.9;
        }
        
        .main-container {
            display: flex;
            flex: 1;
            padding: 1rem;
            gap: 1rem;
            max-width: 1400px;
            margin: 0 auto;
            width: 100%;
        }
        
        .sidebar {
            width: 300px;
            background-color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            padding: 1rem;
            flex-shrink: 0;
        }
        
        .main-content {
            flex: 1;
            background-color: white;
            border-radius: var(--border-radius);
            box-shadow: var(--shadow);
            overflow: hidden;
            display: flex;
            flex-direction: column;
        }
        
        .chat-container {
            flex: 1;
            overflow-y: auto;
            padding: 1rem;
        }
        
        .input-container {
            display: flex;
            padding: 1rem;
            background-color: var(--neutral-light);
            border-top: 1px solid #E5E7EB;
        }
        
        .input-container input {
            flex: 1;
            padding: 0.75rem 1rem;
            border: 1px solid #E5E7EB;
            border-radius: var(--border-radius) 0 0 var(--border-radius);
            font-size: 1rem;
            outline: none;
        }
        
        .input-container input:focus {
            border-color: var(--primary);
            box-shadow: 0 0 0 2px var(--primary-light);
        }
        
        .input-container button {
            background-color: var(--primary);
            color: white;
            border: none;
            padding: 0.75rem 1.5rem;
            border-radius: 0 var(--border-radius) var(--border-radius) 0;
            font-weight: 500;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .input-container button:hover {
            background-color: var(--primary-dark);
        }
        
        .section-title {
            font-size: 1.25rem;
            font-weight: 600;
            margin-bottom: 1rem;
            color: var(--primary-dark);
        }
        
        .quick-links {
            margin-bottom: 2rem;
        }
        
        .quick-link-item {
            display: flex;
            align-items: center;
            padding: 0.75rem;
            background-color: var(--primary-light);
            border-radius: var(--border-radius);
            margin-bottom: 0.5rem;
            cursor: pointer;
            transition: background-color 0.2s;
        }
        
        .quick-link-item:hover {
            background-color: rgba(238, 242, 255, 0.7);
        }
        
        .quick-link-item i {
            margin-right: 0.75rem;
            color: var(--primary);
            font-size: 1rem;
            width: 20px;
            text-align: center;
        }
        
        .example-questions .quick-link-item {
            background-color: white;
            border: 1px solid #E5E7EB;
        }
        
        .example-questions .quick-link-item:hover {
            background-color: var(--neutral-light);
        }
        
        .message {
            display: flex;
            margin-bottom: 1rem;
            animation: fadeIn 0.3s ease-in-out;
        }
        
        @keyframes fadeIn {
            from { opacity: 0; transform: translateY(10px); }
            to { opacity: 1; transform: translateY(0); }
        }
        
        .message-content {
            padding: 1rem;
            border-radius: var(--border-radius);
            max-width: 80%;
        }
        
        .user-message {
            justify-content: flex-end;
        }
        
        .user-message .message-content {
            background-color: var(--primary);
            color: white;
            border-radius: var(--border-radius) var(--border-radius) 0 var(--border-radius);
        }
        
        .bot-message .message-content {
            background-color: var(--neutral-light);
            color: var(--neutral-dark);
            border-radius: 0 var(--border-radius) var(--border-radius) var(--border-radius);
        }
        
        .form-recommendation {
            background-color: var(--primary-light);
            border: 1px solid var(--primary);
            border-radius: var(--border-radius);
            padding: 1rem;
            margin-top: 1rem;
        }
        
        .form-recommendation h3 {
            color: var(--primary-dark);
            margin-bottom: 0.5rem;
            font-size: 1rem;
        }
        
        .form-button {
            display: inline-block;
            background-color: var(--primary);
            color: white;
            padding: 0.5rem 1rem;
            border-radius: var(--border-radius);
            text-decoration: none;
            margin-top: 0.5rem;
            font-weight: 500;
            transition: background-color 0.2s;
        }
        
        .form-button:hover {
            background-color: var(--primary-dark);
        }
        
        .form-button i {
            margin-right: 0.5rem;
        }
        
        .feedback-options {
            display: flex;
            gap: 0.5rem;
            margin-top: 1rem;
        }
        
        .feedback-options button {
            background-color: white;
            border: 1px solid #E5E7EB;
            padding: 0.5rem 0.75rem;
            border-radius: var(--border-radius);
            cursor: pointer;
            transition: all 0.2s;
        }
        
        .feedback-options button:hover {
            background-color: var(--neutral-light);
        }
        
        .feedback-options button.positive {
            border-color: var(--success);
            color: var(--success);
        }
        
        .feedback-options button.positive:hover {
            background-color: rgba(16, 185, 129, 0.1);
        }
        
        .feedback-options button.negative {
            border-color: var(--error);
            color: var(--error);
        }
        
        .feedback-options button.negative:hover {
            background-color: rgba(239, 68, 68, 0.1);
        }
        
        .loading {
            display: none;
            text-align: center;
            padding: 1rem;
            color: var(--neutral-medium);
        }
        
        .loading .dots {
            display: inline-block;
        }
        
        .loading .dots::after {
            content: '.';
            animation: dots 1.5s steps(5, end) infinite;
        }
        
        @keyframes dots {
            0%, 20% { content: '.'; }
            40% { content: '..'; }
            60% { content: '...'; }
            80%, 100% { content: ''; }
        }
        
        @media (max-width: 768px) {
            .main-container {
                flex-direction: column;
            }
            
            .sidebar {
                width: 100%;
                margin-bottom: 1rem;
            }
            
            .message-content {
                max-width: 90%;
            }
        }
    </style>
</head>
<body>
    <div class="app-container">
        <header class="header">
            <h1>GovFlowAI</h1>
            <p>Your California Government Services Assistant</p>
        </header>
        
        <div class="main-container">
            <aside class="sidebar">
                <div class="quick-links">
                    <h2 class="section-title">Quick Services</h2>
                    <div class="quick-link-item" onclick="sendQuickQuestion('How do I renew my driver\\'s license?')">
                        <i class="fas fa-id-card"></i> Renew License
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('How do I change my address with the DMV?')">
                        <i class="fas fa-home"></i> Change Address
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('How do I apply for a California ID card?')">
                        <i class="fas fa-address-card"></i> Get ID Card
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('How do I register my vehicle in California?')">
                        <i class="fas fa-car"></i> Register Vehicle
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('How do I apply for CalFresh benefits?')">
                        <i class="fas fa-utensils"></i> Food Assistance
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('What tax credits are available in California?')">
                        <i class="fas fa-file-invoice-dollar"></i> Tax Information
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('What healthcare programs are available in California?')">
                        <i class="fas fa-hospital"></i> Healthcare Programs
                    </div>
                </div>
                
                <div class="example-questions">
                    <h2 class="section-title">Try Asking About:</h2>
                    <div class="quick-link-item" onclick="sendQuickQuestion('How do I renew my driver\\'s license?')">
                        <i class="fas fa-question-circle"></i> How do I renew my driver's license?
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('What tax benefits are available for low-income families?')">
                        <i class="fas fa-question-circle"></i> What tax benefits are available for low-income families?
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('How can I apply for housing assistance?')">
                        <i class="fas fa-question-circle"></i> How can I apply for housing assistance?
                    </div>
                    <div class="quick-link-item" onclick="sendQuickQuestion('What forms do I need for vehicle registration?')">
                        <i class="fas fa-question-circle"></i> What forms do I need for vehicle registration?
                    </div>
                </div>
            </aside>
            
            <main class="main-content">
                <div id="chat-container" class="chat-container">
                    <div class="message bot-message">
                        <div class="message-content">
                            <p>Hello! I'm GovFlowAI, your California government services assistant. How can I help you today?</p>
                        </div>
                    </div>
                </div>
                
                <div id="loading" class="loading">
                    Thinking<span class="dots"></span>
                </div>
                
                <div class="input-container">
                    <input type="text" id="user-input" placeholder="Ask about California government services..." autocomplete="off">
                    <button id="send-button" onclick="sendMessage()">Send</button>
                </div>
            </main>
        </div>
    </div>
    
    <script>
        // Initialize conversation history
        let conversationHistory = [];
        
        // Function to send a message
        function sendMessage() {
            const input = document.getElementById('user-input');
            const message = input.value.trim();
            
            if (!message) return;
            
            // Clear input field
            input.value = '';
            
            // Add user message to chat
            addMessage('user', message);
            
            // Show loading indicator
            document.getElementById('loading').style.display = 'block';
            
            // Send message to server
            fetch('/chat', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    message: message,
                    history: conversationHistory
                })
            })
            .then(response => response.json())
            .then(data => {
                // Hide loading indicator
                document.getElementById('loading').style.display = 'none';
                
                // Add bot response to chat
                addMessage('bot', data.response);
                
                // Update conversation history
                conversationHistory.push({
                    role: 'user',
                    content: message
                });
                
                conversationHistory.push({
                    role: 'assistant',
                    content: data.response
                });
            })
            .catch(error => {
                console.error('Error:', error);
                
                // Hide loading indicator
                document.getElementById('loading').style.display = 'none';
                
                // Add error message to chat
                addMessage('bot', 'Sorry, there was an error processing your request. Please try again.');
            });
        }
        
        // Function to send a quick question
        function sendQuickQuestion(question) {
            // Set the input value
            const input = document.getElementById('user-input');
            input.value = question;
            
            // Send the message
            sendMessage();
        }
        
        // Function to add a message to the chat
        function addMessage(sender, content) {
            const chatContainer = document.getElementById('chat-container');
            
            // Create message element
            const messageDiv = document.createElement('div');
            messageDiv.className = `message ${sender}-message`;
            
            // Create message content
            const messageContent = document.createElement('div');
            messageContent.className = 'message-content';
            messageContent.innerHTML = content;
            
            // Add message content to message
            messageDiv.appendChild(messageContent);
            
            // Add message to chat
            chatContainer.appendChild(messageDiv);
            
            // Add feedback options if it's a bot message
            if (sender === 'bot') {
                const feedbackDiv = document.createElement('div');
                feedbackDiv.className = 'feedback-options';
                feedbackDiv.innerHTML = `
                    <button class="positive" onclick="provideFeedback(true)"><i class="fas fa-thumbs-up"></i> Helpful</button>
                    <button class="negative" onclick="provideFeedback(false)"><i class="fas fa-thumbs-down"></i> Not Helpful</button>
                `;
                messageContent.appendChild(feedbackDiv);
            }
            
            // Scroll to bottom
            chatContainer.scrollTop = chatContainer.scrollHeight;
        }
        
        // Function to provide feedback
        function provideFeedback(isPositive) {
            const feedbackMessage = isPositive ? 'Thank you for your feedback!' : 'Sorry this wasn\\'t helpful. How can I improve?';
            
            // Send feedback to server (you can implement this part)
            console.log('Feedback:', isPositive);
            
            // Add feedback acknowledgment
            addMessage('bot', feedbackMessage);
        }
        
        // Listen for Enter key in input field
        document.getElementById('user-input').addEventListener('keypress', function(e) {
            if (e.key === 'Enter') {
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

@app.route('/chat', methods=['POST'])
def chat():
    try:
        data = request.json
        user_message = data.get('message', '')
        conversation_history = data.get('history', [])
        
        if not user_message:
            return jsonify({'status': 'error', 'message': 'No message provided'}), 400
        
        # Using a proper RAG implementation with the knowledge base
        context = retrieve_from_knowledge_base(user_message)
        
        # Prepare conversation context for the API call
        messages = [
            {"role": "system", "content": f"You are GovFlowAI, an AI assistant for California government services. Your goal is to help users with clear, step-by-step guidance about DMV services, tax information, benefits programs, and official forms. Use the following information to inform your response: {context}"}
        ]
        
        # Add conversation history
        for item in conversation_history[-4:]:  # Limit to last 4 exchanges to keep context manageable
            messages.append({"role": item["role"], "content": item["content"]})
        
        # Add the current user message
        messages.append({"role": "user", "content": user_message})
        
        # Make API call to OpenAI
        try:
            response = openai.ChatCompletion.create(
                model="gpt-3.5-turbo",
                messages=messages,
                temperature=0.7,
                max_tokens=500
            )
            
            assistant_response = response.choices[0].message['content']
            
        except Exception as e:
            print(f"OpenAI API error: {e}")
            # Fallback to simple response generator if API call fails
            assistant_response = generate_simple_response(user_message, context)
        
        return jsonify({
            'status': 'success',
            'response': assistant_response
        })
        
    except Exception as e:
        print(f"Error: {e}")
        return jsonify({
            'status': 'error',
            'message': str(e)
        }), 500

def retrieve_from_knowledge_base(query):
    """Retrieval function to get relevant information from knowledge base"""
    query = query.lower()
    relevant_info = []
    
    for item in KNOWLEDGE_BASE:
        if any(keyword in query for keyword in item["topic"].split()):
            relevant_info.append(item["content"])
    
    # If no specific matches, return general information
    if not relevant_info:
        return "You are a helpful assistant for California government services."
    
    return " ".join(relevant_info)

def generate_simple_response(message, context):
    """Generate a simple response when the API call fails"""
    message_lower = message.lower()
    
    if "license" in message_lower or "renew" in message_lower:
        return """
        <p>To renew your driver's license in California, you'll need to:</p>
        <ol>
            <li>Complete a DL 44 form (available at DMV offices or you can start online)</li>
            <li>Pay the renewal fee ($38 for a basic Class C license)</li>
            <li>Pass a vision test</li>
            <li>Provide your thumbprint</li>
            <li>Have your photo taken</li>
        </ol>
        <p>You can renew your license up to 6 months before it expires. For most drivers, you can renew online at <a href="https://www.dmv.ca.gov" target="_blank">dmv.ca.gov</a>.</p>
        """
    
    elif "registration" in message_lower or "vehicle" in message_lower:
        return """
        <p>To register a vehicle in California, you'll need:</p>
        <ol>
            <li>A completed Application for Title or Registration (REG 343)</li>
            <li>The vehicle's title properly signed over to you</li>
            <li>A smog certification (if applicable)</li>
            <li>Proof of insurance</li>
            <li>Payment for registration fees and taxes</li>
        </ol>
        <p>For a new vehicle, you'll need to visit a DMV office or mail in your application. For registration renewal, you can usually do this online at <a href="https://www.dmv.ca.gov" target="_blank">dmv.ca.gov</a>.</p>
        """
    
    elif "address" in message_lower and "change" in message_lower:
        return """
        <p>To change your address with the California DMV, you have three options:</p>
        <ol>
            <li>Online: Visit <a href="https://www.dmv.ca.gov" target="_blank">dmv.ca.gov</a> and use the Change of Address system</li>
            <li>By Mail: Complete a Change of Address (DMV 14) form and mail it to the DMV</li>
            <li>In Person: Visit any DMV office and submit the form</li>
        </ol>
        <p>Remember, California law requires you to notify the DMV within 10 days of changing your address.</p>
        """
    
    else:
        return """
        <p>I can help you with information about California government services including:</p>
        <ul>
            <li>DMV services (driver's licenses, vehicle registration, ID cards)</li>
            <li>Benefits programs (CalFresh, Medi-Cal, CalWORKs)</li>
            <li>Tax information and credits</li>
            <li>Housing assistance programs</li>
            <li>Official forms and applications</li>
        </ul>
        <p>Please let me know what specific information you're looking for, and I'll be happy to assist you.</p>
        """

if __name__ == "__main__":
    print("Starting GovFlowAI...")
    app.run(debug=True, port=5060)
