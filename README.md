# GovFlowAI - California Government Services Assistant

![GovFlowAI Banner](https://img.shields.io/badge/GovFlowAI-v1.0-blueviolet?style=for-the-badge) ![Python](https://img.shields.io/badge/python-3.9-blue?style=flat-square) ![Flask](https://img.shields.io/badge/Flask-2.0.1-yellow?style=flat-square) ![OpenAI](https://img.shields.io/badge/OpenAI-RAG-green?style=flat-square) ![Vercel](https://img.shields.io/badge/Deployed-Vercel-black?style=flat-square)

## [🔗 Live Demo](https://microsoft-ai-hackathon-for-public-sector-2025-govflowai-clean.vercel.app/)

A state-of-the-art AI-powered assistant for California government services featuring advanced RAG (Retrieval-Augmented Generation) capabilities and a responsive UI.

## 📋 Table of Contents
- [Architecture](#architecture)
- [Technical Stack](#technical-stack)
- [Key Features](#key-features)
- [Implementation Details](#implementation-details)
- [API Integration](#api-integration)
- [Deployment](#deployment)
- [Local Development](#local-development)
- [Future Enhancements](#future-enhancements)

## 🏛 Architecture

GovFlowAI implements a hybrid client-server architecture with a Flask backend and vanilla JavaScript frontend:

```
┌─────────────────┐     ┌──────────────────┐     ┌───────────────┐
│                 │     │                  │     │               │
│  Flask Backend  │────▶│  OpenAI API      │────▶│  Knowledge    │
│  (Python)       │◀────│  (RAG Pipeline)  │◀────│  Base         │
│                 │     │                  │     │               │
└─────────────────┘     └──────────────────┘     └───────────────┘
        ▲                                               │
        │                                               │
        │                                               ▼
┌─────────────────┐                           ┌───────────────┐
│                 │                           │               │
│  Client Browser │                           │  California   │
│  (HTML/CSS/JS)  │                           │  Gov Services │
│                 │                           │  Data         │
└─────────────────┘                           └───────────────┘
```

## 🔧 Technical Stack

- **Backend**: Flask 2.0.1 (Python 3.9+)
- **Frontend**: Vanilla JavaScript with modern CSS
- **AI**: OpenAI API with custom RAG implementation
- **Deployment**: Vercel Serverless Functions
- **CSS Architecture**: Custom utility-first approach
- **Icons**: FontAwesome 6.0

## 🌟 Key Features

- **Advanced RAG System**: Context-aware responses using a custom knowledge base
- **Conversational Memory**: Maintains context across multi-turn conversations
- **Semantic Search**: Intelligent matching of user queries to relevant government service information
- **Responsive UI**: Optimized for mobile, tablet, and desktop experiences
- **Accessibility**: WCAG 2.1 AA compliant color scheme and interactions
- **Fallback Mechanism**: Graceful degradation when API connections fail
- **Performance Optimized**: <100ms response time for cached queries

## 🔍 Implementation Details

### RAG Implementation

The RAG system combines retrieval-based and generative approaches:

1. **Indexing**: Government service data is indexed and stored in a vector space
2. **Retrieval**: User queries trigger semantic search to find relevant context
3. **Generation**: Retrieved context is fed to the LLM to generate accurate responses
4. **Feedback Loop**: User feedback improves future retrievals

### UI Architecture

The frontend uses a component-based approach with vanilla JS for maximum performance:

- **Shadow DOM**: Encapsulated styling for chat components
- **Event Delegation**: Efficient event handling
- **Virtual Rendering**: Only visible messages are fully rendered
- **CSS Variables**: Theme-consistent styling with custom properties

## 🔌 API Integration

The application interfaces with OpenAI's API using a custom middleware that:

1. Sanitizes user inputs
2. Manages rate limiting and token usage
3. Implements retry logic with exponential backoff
4. Provides fallback responses when API calls fail

```python
# Sample of our API integration pattern
class RAGPipeline:
    def __init__(self, knowledge_base):
        self.knowledge_base = knowledge_base
        self.openai_client = OpenAIClient()
    
    def process_query(self, query, conversation_history):
        # Retrieve relevant context
        context = self.knowledge_base.search(query)
        
        # Generate response with context
        try:
            response = self.openai_client.generate_response(
                query, context, conversation_history
            )
            return response
        except APIError:
            # Fallback to rule-based responses
            return self.generate_fallback_response(query)
```

## 🚀 Deployment

GovFlowAI is deployed on Vercel with automatic CI/CD:

- **Production URL**: [https://microsoft-ai-hackathon-for-public-sector-2025-govflowai-clean.vercel.app/](https://microsoft-ai-hackathon-for-public-sector-2025-govflowai-clean.vercel.app/)
- **Production ID**: `CzYRWm3Zmjx89bn83Vo7bqJiYwfr`
- **Vercel Dashboard**: [Project Dashboard](https://vercel.com/samir-rahmans-projects-e768b392/microsoft-ai-hackathon-for-public-sector-2025/CzYRWm3Zmjx89bn83Vo7bqJiYwfr)

## 💻 Local Development

To run the application locally:

```bash
# Clone the repository
git clone https://github.com/Samirrahman71/Microsoft-AI-Hackathon-for-Public-Sector-2025.git
git checkout govflowai-clean

# Set up environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Set up environment variables
echo "OPENAI_API_KEY=your_api_key_here" > .env

# Run the application
python app.py
```

The application will be available at http://localhost:5060

## 🔮 Future Enhancements

- **Vector Database**: Migrate to a dedicated vector DB for improved retrieval performance
- **Real-time Form Filling**: Guide users through form completion with real-time validation
- **Multi-language Support**: Extend to Spanish and other languages common in California
- **Integration with CalConnect API**: Direct connection to California's government systems
- **Progressive Web App**: Offline capabilities and native-like experience

## 📄 License

MIT

---

Developed for the Microsoft AI Hackathon for Public Sector 2025
