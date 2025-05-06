# Azure Hack Frontend

A mobile-friendly React frontend application for the Azure Hack repository featuring a clean chat interface, document upload functionality, and task management.

## Features

- **Chat Interface**: Interactive chat system to communicate with Azure AI services
- **Document Upload**: Easy drag-and-drop document uploader with status tracking
- **Task Management**: Comprehensive task list with filtering, searching, and CRUD operations
- **Mobile-Friendly Design**: Responsive layout that works well on all devices

## Project Structure

```
azure-hack-frontend/
├── public/                # Static files
│   ├── index.html         # HTML entry point
│   └── manifest.json      # Web app manifest
├── src/
│   ├── components/        # React components
│   │   ├── Chat/          # Chat interface components
│   │   ├── DocumentUpload/# Document upload components 
│   │   └── TaskList/      # Task management components
│   ├── styles/            # CSS and styled components
│   ├── assets/            # Images and other assets
│   ├── App.js             # Main application component
│   └── index.js           # JavaScript entry point
└── package.json           # Project dependencies and scripts
```

## Getting Started

1. Make sure you have Node.js and npm installed
2. Clone this repository
3. Install dependencies:
   ```
   npm install
   ```
4. Start the development server:
   ```
   npm start
   ```
5. Open [http://localhost:3000](http://localhost:3000) to view it in the browser

## Backend Integration

This frontend is designed to connect with the Azure Hack backend which provides:

- Document processing using Azure AI Document Intelligence
- Conversational AI capabilities via Azure OpenAI
- Search functionality through Azure AI Search
- Task management and storage via Azure services

## Mobile Support

The application is built with mobile-first principles:
- Responsive layouts that adapt to different screen sizes
- Touch-friendly interface elements
- Optimized performance for mobile devices

## Technologies Used

- React.js
- Styled Components for CSS-in-JS styling
- React Router for navigation
- Axios for API requests

## License

MIT
