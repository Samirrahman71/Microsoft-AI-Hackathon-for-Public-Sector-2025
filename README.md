# GovFlowAI - California Government Services Assistant

A modern, AI-powered assistant for California government services with a clean UI and RAG capabilities.

## Features

- **Modern UI** with an improved color palette and responsive design
- **Retrieval-Augmented Generation (RAG)** for accurate information about California services
- **Quick Links** for common government services
- **Example Questions** to help users get started
- **Mobile Responsive** design that works on all devices

## Deployment Instructions for Vercel

1. Create a new project in Vercel
2. Connect this GitHub repository
3. Configure the following:
   - Framework Preset: Other
   - Build Command: None
   - Output Directory: .
   - Install Command: pip install -r requirements.txt
4. Under Environment Variables, add:
   - OPENAI_API_KEY: [Your OpenAI API Key Here]
5. Click "Deploy"

## Local Development

To run the application locally:

```bash
pip install -r requirements.txt
python app.py
```

The application will be available at http://localhost:5060

## License

MIT
