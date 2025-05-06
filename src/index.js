/**
 * GovFlow AI - Main Application Entry Point
 * 
 * This file initializes all agents and sets up the API routes
 * for the GovFlow AI application.
 */
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

// Import agents
const AzureSetupAgent = require('./agents/AzureSetupAgent');
const ChatbotFlowAgent = require('./agents/ChatbotFlowAgent');
const DocumentParsingAgent = require('./agents/DocumentParsingAgent');
const RAGSearchAgent = require('./agents/RAGSearchAgent');
const AppointmentSchedulerAgent = require('./agents/AppointmentSchedulerAgent');
const TaskTrackerAgent = require('./agents/TaskTrackerAgent');
const FrontendUIAgent = require('./agents/FrontendUIAgent');

// Create Express app
const app = express();
const port = process.env.PORT || 3000;

// Configure middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '../public')));

// Set up file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Initialize agents
const azureSetupAgent = new AzureSetupAgent();
const chatbotFlowAgent = new ChatbotFlowAgent();
const documentParsingAgent = new DocumentParsingAgent();
const ragSearchAgent = new RAGSearchAgent();
const appointmentSchedulerAgent = new AppointmentSchedulerAgent();
const taskTrackerAgent = new TaskTrackerAgent();
const frontendUIAgent = new FrontendUIAgent();

// Set up in-memory storage for demo purposes
const userSessions = new Map();

// Middleware to log requests
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.url}`);
  next();
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Chat endpoint
app.post('/api/chat', async (req, res) => {
  try {
    const { message, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }
    
    // Generate a user ID if not provided
    const userSessionId = userId || `user-${Date.now()}`;
    
    // Process the message with ChatbotFlowAgent
    const response = await chatbotFlowAgent.processInput(message);
    
    // If task breakdown is included, create a task flow
    if (response.taskBreakdown) {
      const taskFlowResponse = taskTrackerAgent.createTaskFlow(userSessionId, response.taskBreakdown);
      if (taskFlowResponse.success) {
        response.taskFlowId = taskFlowResponse.taskFlow.id;
      }
    }
    
    // Store session if it's new
    if (!userSessions.has(userSessionId)) {
      userSessions.set(userSessionId, {
        id: userSessionId,
        createdAt: new Date().toISOString(),
        messages: []
      });
    }
    
    // Update session with message history
    const session = userSessions.get(userSessionId);
    session.messages.push({ role: 'user', content: message });
    session.messages.push({ role: 'assistant', content: response.text });
    
    res.json({
      response: response.text,
      userId: userSessionId,
      metadata: {
        taskFlowId: response.taskFlowId,
        isFallback: response.isFallback,
        location: response.location
      }
    });
  } catch (error) {
    console.error('Error processing chat message:', error);
    res.status(500).json({ error: 'Failed to process message' });
  }
});

// Document processing endpoint
app.post('/api/documents/upload', upload.single('document'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }
    
    const filePath = req.file.path;
    
    // Process document with DocumentParsingAgent
    const documentResult = await documentParsingAgent.processDocument(filePath);
    
    if (!documentResult.success) {
      return res.status(400).json({ error: documentResult.message });
    }
    
    // Enhance document with RAG context
    const enhancedResult = await ragSearchAgent.enhanceDocumentWithRAG(documentResult);
    
    // Create a task flow for document processing if user ID is provided
    if (req.body.userId) {
      const documentTaskFlow = taskTrackerAgent.getTaskFlowTemplate('document');
      if (documentTaskFlow.success) {
        const taskFlowResponse = taskTrackerAgent.createTaskFlow(req.body.userId, documentTaskFlow.template);
        if (taskFlowResponse.success) {
          enhancedResult.taskFlowId = taskFlowResponse.taskFlow.id;
        }
      }
    }
    
    res.json(enhancedResult);
  } catch (error) {
    console.error('Error processing document:', error);
    res.status(500).json({ error: 'Failed to process document' });
  }
});

// Appointment scheduling endpoints
app.get('/api/appointments/available', async (req, res) => {
  try {
    const { appointmentType, location, date } = req.query;
    
    if (!appointmentType || !location || !date) {
      return res.status(400).json({ error: 'Appointment type, location, and date are required' });
    }
    
    const availableTimes = await appointmentSchedulerAgent.getAvailableAppointmentTimes(
      appointmentType,
      location,
      date
    );
    
    res.json(availableTimes);
  } catch (error) {
    console.error('Error getting available appointment times:', error);
    res.status(500).json({ error: 'Failed to get available appointment times' });
  }
});

app.post('/api/appointments/book', async (req, res) => {
  try {
    const { appointmentType, location, date, slotId, userInfo, userId } = req.body;
    
    if (!appointmentType || !location || !date || !slotId || !userInfo) {
      return res.status(400).json({ error: 'Missing required booking information' });
    }
    
    const bookingResult = await appointmentSchedulerAgent.bookAppointment({
      appointmentType,
      location,
      date,
      slotId,
      userInfo
    });
    
    // Create a task flow for appointment if user ID is provided
    if (userId && bookingResult.success) {
      const appointmentTaskFlow = taskTrackerAgent.getTaskFlowTemplate('appointment');
      if (appointmentTaskFlow.success) {
        const taskFlowResponse = taskTrackerAgent.createTaskFlow(userId, appointmentTaskFlow.template);
        if (taskFlowResponse.success) {
          bookingResult.taskFlowId = taskFlowResponse.taskFlow.id;
        }
      }
    }
    
    res.json(bookingResult);
  } catch (error) {
    console.error('Error booking appointment:', error);
    res.status(500).json({ error: 'Failed to book appointment' });
  }
});

// Task tracker endpoints
app.get('/api/tasks/:userId', (req, res) => {
  try {
    const { userId } = req.params;
    
    if (!userId) {
      return res.status(400).json({ error: 'User ID is required' });
    }
    
    const userFlows = taskTrackerAgent.getUserTaskFlows(userId);
    res.json(userFlows);
  } catch (error) {
    console.error('Error getting user task flows:', error);
    res.status(500).json({ error: 'Failed to get user task flows' });
  }
});

app.get('/api/tasks/:userId/:taskFlowId', (req, res) => {
  try {
    const { userId, taskFlowId } = req.params;
    
    if (!userId || !taskFlowId) {
      return res.status(400).json({ error: 'User ID and task flow ID are required' });
    }
    
    const taskFlow = taskTrackerAgent.getTaskFlow(userId, taskFlowId);
    
    if (!taskFlow.success) {
      return res.status(404).json({ error: 'Task flow not found' });
    }
    
    // Generate UI representation
    const uiRepresentation = taskTrackerAgent.generateTaskTracker(taskFlow.taskFlow);
    
    res.json({
      taskFlow: taskFlow.taskFlow,
      ui: uiRepresentation.success ? uiRepresentation.trackerData : null
    });
  } catch (error) {
    console.error('Error getting task flow:', error);
    res.status(500).json({ error: 'Failed to get task flow' });
  }
});

app.put('/api/tasks/:userId/:taskFlowId/:stepId/:taskId', (req, res) => {
  try {
    const { userId, taskFlowId, stepId, taskId } = req.params;
    const { completed } = req.body;
    
    if (!userId || !taskFlowId || !stepId || !taskId || completed === undefined) {
      return res.status(400).json({ error: 'Missing required parameters' });
    }
    
    const updateResult = taskTrackerAgent.updateTaskStatus(
      userId,
      taskFlowId,
      stepId,
      taskId,
      completed
    );
    
    if (!updateResult.success) {
      return res.status(400).json({ error: updateResult.message });
    }
    
    res.json(updateResult);
  } catch (error) {
    console.error('Error updating task status:', error);
    res.status(500).json({ error: 'Failed to update task status' });
  }
});

// UI configuration endpoint
app.get('/api/ui/config', (req, res) => {
  try {
    const { includeMobile } = req.query;
    const uiConfig = frontendUIAgent.generateUIConfiguration(includeMobile === 'true');
    res.json(uiConfig);
  } catch (error) {
    console.error('Error generating UI configuration:', error);
    res.status(500).json({ error: 'Failed to generate UI configuration' });
  }
});

// Initialize the application
async function initializeApp() {
  try {
    console.log('Initializing GovFlow AI...');
    
    // Validate Azure OpenAI setup
    const azureValidation = await azureSetupAgent.validateSetup();
    console.log('Azure OpenAI validation:', azureValidation.success ? 'Success' : 'Failed');
    
    // Initialize RAG with documents if path is provided
    if (process.env.DOCUMENTS_PATH) {
      const ragInit = await ragSearchAgent.initializeLocalVectorStore(process.env.DOCUMENTS_PATH);
      console.log('RAG initialization:', ragInit.success ? 'Success' : 'Failed');
    }
    
    // Start the server
    app.listen(port, () => {
      console.log(`GovFlow AI server running on port ${port}`);
      console.log(`API available at http://localhost:${port}/api`);
      console.log(`Frontend available at http://localhost:${port}`);
    });
  } catch (error) {
    console.error('Error initializing application:', error);
    process.exit(1);
  }
}

// Start the application
initializeApp();
