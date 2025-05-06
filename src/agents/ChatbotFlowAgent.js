/**
 * ChatbotFlowAgent.js
 * Handles natural language routing using LangChain
 */
const { ChatOpenAI } = require('@langchain/openai');
const { PromptTemplate } = require('langchain/prompts');
const { LLMChain } = require('langchain/chains');
const { StringOutputParser } = require('@langchain/core/output_parsers');
require('dotenv').config();

class ChatbotFlowAgent {
  constructor() {
    this.llm = new ChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiVersion: '2023-05-15',
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT.replace('https://', '').replace('.openai.azure.com/', ''),
      temperature: 0.7,
    });

    // Initialize predefined task breakdown templates
    this.taskBreakdownTemplates = {
      'move': this.getMovingTaskBreakdown(),
      'apply': this.getBenefitsApplicationBreakdown(),
      'document': this.getDocumentProcessingBreakdown(),
      'appointment': this.getAppointmentBreakdown()
    };

    // Create prompt templates
    this.createPromptTemplates();
  }

  createPromptTemplates() {
    // Main query classification template
    this.classificationTemplate = new PromptTemplate({
      template: `You are a government services assistant that helps citizens navigate complex processes.
      
Analyze the user query and classify it into one of these categories:
- MOVE: Queries about moving to a new location and associated government tasks
- BENEFITS: Queries about government benefits or applications
- DOCUMENT: Queries about understanding government documents or forms
- APPOINTMENT: Queries about scheduling appointments with government offices
- GENERAL: General questions about government services
- UNKNOWN: Queries that don't fall into other categories

User Query: {query}
Classification:`,
      inputVariables: ['query'],
    });

    // Fallback template for unknown queries
    this.fallbackTemplate = new PromptTemplate({
      template: `You are a helpful government services assistant.
      
The user has asked a question that doesn't fall into our predefined categories.
Provide a general helpful response.

User Query: {query}
Helpful Response:`,
      inputVariables: ['query'],
    });
  }

  /**
   * Process user input and route to appropriate response handler
   */
  async processInput(userInput) {
    try {
      // Classify the input
      const classificationChain = new LLMChain({
        llm: this.llm,
        prompt: this.classificationTemplate,
        outputParser: new StringOutputParser(),
      });
      
      const classification = await classificationChain.run(userInput);
      console.log(`Query classified as: ${classification}`);
      
      // Route to appropriate handler based on classification
      if (classification.includes('MOVE')) {
        return this.handleMoveQuery(userInput);
      } else if (classification.includes('BENEFITS')) {
        return this.handleBenefitsQuery(userInput);
      } else if (classification.includes('DOCUMENT')) {
        return this.handleDocumentQuery(userInput);
      } else if (classification.includes('APPOINTMENT')) {
        return this.handleAppointmentQuery(userInput);
      } else if (classification.includes('GENERAL')) {
        return this.handleGeneralQuery(userInput);
      } else {
        // Fallback for unknown queries
        return this.handleUnknownQuery(userInput);
      }
    } catch (error) {
      console.error('Error processing input:', error);
      return {
        text: "I'm sorry, I encountered an error processing your request. Please try again.",
        error: true,
        errorDetails: error.message
      };
    }
  }

  /**
   * Handle queries about moving to a new location
   */
  async handleMoveQuery(query) {
    // Check if the query mentions a specific location
    const locationMatch = query.match(/mov(e|ing) to ([a-zA-Z\s]+)/i);
    const location = locationMatch ? locationMatch[2].trim() : 'a new location';
    
    const movePrompt = new PromptTemplate({
      template: `You are a government services assistant helping someone who is moving to {location}.
      
Provide a helpful response about the government-related tasks they need to complete when moving.
Include specific steps for updating addresses with the DMV, voter registration, postal service, etc.
Also mention local government offices they should contact in {location}.

User Query: {query}
Response:`,
      inputVariables: ['location', 'query'],
    });
    
    const moveChain = new LLMChain({
      llm: this.llm,
      prompt: movePrompt,
      outputParser: new StringOutputParser(),
    });
    
    const response = await moveChain.call({ 
      location: location,
      query: query
    });
    
    return {
      text: response.text,
      taskBreakdown: this.taskBreakdownTemplates.move,
      location: location
    };
  }

  /**
   * Handle queries about government benefits
   */
  async handleBenefitsQuery(query) {
    const benefitsPrompt = new PromptTemplate({
      template: `You are a government benefits assistant.
      
Provide helpful information about government benefit programs related to this query.
Include eligibility requirements and application processes when relevant.
Be specific about which forms are needed and where to submit them.

User Query: {query}
Response:`,
      inputVariables: ['query'],
    });
    
    const benefitsChain = new LLMChain({
      llm: this.llm,
      prompt: benefitsPrompt,
      outputParser: new StringOutputParser(),
    });
    
    const response = await benefitsChain.call({ query });
    
    return {
      text: response.text,
      taskBreakdown: this.taskBreakdownTemplates.apply
    };
  }

  /**
   * Handle queries about understanding government documents
   */
  async handleDocumentQuery(query) {
    const documentPrompt = new PromptTemplate({
      template: `You are a government document assistant.
      
Help the user understand government documents or forms they're asking about.
Explain key terminology, form fields, and next steps.
If they haven't uploaded a document yet, guide them on how to do so.

User Query: {query}
Response:`,
      inputVariables: ['query'],
    });
    
    const documentChain = new LLMChain({
      llm: this.llm,
      prompt: documentPrompt,
      outputParser: new StringOutputParser(),
    });
    
    const response = await documentChain.call({ query });
    
    return {
      text: response.text,
      taskBreakdown: this.taskBreakdownTemplates.document
    };
  }

  /**
   * Handle queries about scheduling appointments
   */
  async handleAppointmentQuery(query) {
    const appointmentPrompt = new PromptTemplate({
      template: `You are an appointment scheduling assistant for government services.
      
Help the user understand how to schedule appointments with government offices.
Provide information about required documents, waiting times, and preparation steps.
If they're ready to book, guide them through the scheduling process.

User Query: {query}
Response:`,
      inputVariables: ['query'],
    });
    
    const appointmentChain = new LLMChain({
      llm: this.llm,
      prompt: appointmentPrompt,
      outputParser: new StringOutputParser(),
    });
    
    const response = await appointmentChain.call({ query });
    
    return {
      text: response.text,
      taskBreakdown: this.taskBreakdownTemplates.appointment
    };
  }

  /**
   * Handle general government service queries
   */
  async handleGeneralQuery(query) {
    const generalPrompt = new PromptTemplate({
      template: `You are a government services assistant.
      
Provide helpful information about government services related to this query.
Include relevant agency information, contact details, and next steps when appropriate.

User Query: {query}
Response:`,
      inputVariables: ['query'],
    });
    
    const generalChain = new LLMChain({
      llm: this.llm,
      prompt: generalPrompt,
      outputParser: new StringOutputParser(),
    });
    
    const response = await generalChain.call({ query });
    
    return {
      text: response.text,
      isGeneralQuery: true
    };
  }

  /**
   * Handle unknown queries with fallback response
   */
  async handleUnknownQuery(query) {
    const fallbackChain = new LLMChain({
      llm: this.llm,
      prompt: this.fallbackTemplate,
      outputParser: new StringOutputParser(),
    });
    
    const response = await fallbackChain.call({ query });
    
    return {
      text: response.text,
      isFallback: true
    };
  }

  /**
   * Template for moving-related tasks
   */
  getMovingTaskBreakdown() {
    return {
      title: "Moving Checklist",
      steps: [
        {
          id: "address-update",
          title: "Update Address",
          tasks: [
            { id: "usps", title: "USPS Change of Address", completed: false },
            { id: "dmv", title: "DMV Address Update", completed: false },
            { id: "voter", title: "Voter Registration Update", completed: false },
            { id: "irs", title: "IRS Address Change", completed: false }
          ]
        },
        {
          id: "utilities",
          title: "Set Up Utilities",
          tasks: [
            { id: "water", title: "Water Service", completed: false },
            { id: "power", title: "Electricity Service", completed: false },
            { id: "internet", title: "Internet Service", completed: false }
          ]
        },
        {
          id: "local-registration",
          title: "Local Registration",
          tasks: [
            { id: "pet", title: "Pet Registration", completed: false },
            { id: "schools", title: "School Registration", completed: false },
            { id: "property", title: "Property Tax Information", completed: false }
          ]
        }
      ]
    };
  }

  /**
   * Template for benefits application tasks
   */
  getBenefitsApplicationBreakdown() {
    return {
      title: "Benefits Application Process",
      steps: [
        {
          id: "eligibility",
          title: "Check Eligibility",
          tasks: [
            { id: "requirements", title: "Review Requirements", completed: false },
            { id: "calculator", title: "Use Benefit Calculator", completed: false }
          ]
        },
        {
          id: "documentation",
          title: "Gather Documents",
          tasks: [
            { id: "id", title: "Identification Documents", completed: false },
            { id: "income", title: "Income Verification", completed: false },
            { id: "residence", title: "Proof of Residence", completed: false },
            { id: "expenses", title: "Expense Documentation", completed: false }
          ]
        },
        {
          id: "application",
          title: "Submit Application",
          tasks: [
            { id: "form", title: "Complete Application Form", completed: false },
            { id: "submit", title: "Submit Application", completed: false },
            { id: "followup", title: "Schedule Follow-up", completed: false }
          ]
        }
      ]
    };
  }

  /**
   * Template for document processing tasks
   */
  getDocumentProcessingBreakdown() {
    return {
      title: "Document Understanding Process",
      steps: [
        {
          id: "upload",
          title: "Document Upload",
          tasks: [
            { id: "scan", title: "Scan Document", completed: false },
            { id: "upload", title: "Upload to System", completed: false }
          ]
        },
        {
          id: "analysis",
          title: "Document Analysis",
          tasks: [
            { id: "extract", title: "Extract Information", completed: false },
            { id: "explain", title: "Generate Explanation", completed: false }
          ]
        },
        {
          id: "action",
          title: "Take Action",
          tasks: [
            { id: "response", title: "Generate Response", completed: false },
            { id: "appeal", title: "Appeal Process (if needed)", completed: false },
            { id: "next-steps", title: "Determine Next Steps", completed: false }
          ]
        }
      ]
    };
  }

  /**
   * Template for appointment scheduling tasks
   */
  getAppointmentBreakdown() {
    return {
      title: "Appointment Scheduling Process",
      steps: [
        {
          id: "preparation",
          title: "Prepare for Appointment",
          tasks: [
            { id: "docs", title: "Gather Required Documents", completed: false },
            { id: "forms", title: "Complete Pre-Appointment Forms", completed: false }
          ]
        },
        {
          id: "scheduling",
          title: "Schedule Appointment",
          tasks: [
            { id: "find-time", title: "Find Available Time Slots", completed: false },
            { id: "book", title: "Book Appointment", completed: false },
            { id: "confirm", title: "Receive Confirmation", completed: false }
          ]
        },
        {
          id: "reminders",
          title: "Appointment Reminders",
          tasks: [
            { id: "calendar", title: "Add to Calendar", completed: false },
            { id: "email", title: "Email Reminder", completed: false },
            { id: "sms", title: "SMS Reminder", completed: false }
          ]
        }
      ]
    };
  }
}

module.exports = ChatbotFlowAgent;
