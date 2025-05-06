/**
 * RAGSearchAgent.js
 * Implements Retrieval-Augmented Generation for government document searching
 */
const { SearchClient, AzureKeyCredential } = require("@azure/search-documents");
const { OpenAIEmbeddings } = require('@langchain/openai');
const { FaissStore } = require('langchain/vectorstores/faiss');
const { ChatOpenAI } = require('@langchain/openai');
const { RecursiveCharacterTextSplitter } = require('langchain/text_splitter');
const { Document } = require('langchain/document');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

class RAGSearchAgent {
  constructor() {
    // Initialize Azure Cognitive Search client if environment is configured for it
    if (process.env.AZURE_SEARCH_SERVICE_ENDPOINT && process.env.AZURE_SEARCH_ADMIN_KEY) {
      this.searchClient = new SearchClient(
        process.env.AZURE_SEARCH_SERVICE_ENDPOINT,
        process.env.AZURE_SEARCH_INDEX_NAME,
        new AzureKeyCredential(process.env.AZURE_SEARCH_ADMIN_KEY)
      );
      this.useAzureSearch = true;
    } else {
      this.useAzureSearch = false;
    }
    
    // Initialize embeddings model for FAISS or Azure Search
    this.embeddings = new OpenAIEmbeddings({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiVersion: '2023-05-15',
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT.replace('https://', '').replace('.openai.azure.com/', '')
    });
    
    // Initialize language model for generating responses
    this.llm = new ChatOpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiVersion: '2023-05-15',
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT.replace('https://', '').replace('.openai.azure.com/', ''),
      temperature: 0.3,
    });
    
    // Initialize local vectorstore if not using Azure Search
    this.vectorStore = null;
    this.localIndexPath = path.join(__dirname, '../../data/faiss_index');
  }

  /**
   * Initialize local vector store with government documents
   * @param {string} documentsPath - Path to directory containing government documents
   */
  async initializeLocalVectorStore(documentsPath) {
    try {
      // Check if FAISS index already exists
      if (fs.existsSync(this.localIndexPath)) {
        console.log('Loading existing FAISS index...');
        this.vectorStore = await FaissStore.load(this.localIndexPath, this.embeddings);
        return {
          success: true,
          message: 'Loaded existing FAISS index'
        };
      }
      
      console.log('Creating new FAISS index from documents...');
      
      // Create directory for FAISS index if it doesn't exist
      if (!fs.existsSync(path.dirname(this.localIndexPath))) {
        fs.mkdirSync(path.dirname(this.localIndexPath), { recursive: true });
      }
      
      // Load and process documents
      const documents = await this.loadDocuments(documentsPath);
      
      if (documents.length === 0) {
        return {
          success: false,
          message: 'No documents found to index'
        };
      }
      
      // Create vector store
      this.vectorStore = await FaissStore.fromDocuments(documents, this.embeddings);
      
      // Save vector store
      await this.vectorStore.save(this.localIndexPath);
      
      return {
        success: true,
        message: `Indexed ${documents.length} documents into FAISS vector store`,
        documentCount: documents.length
      };
    } catch (error) {
      console.error('Error initializing vector store:', error);
      return {
        success: false,
        message: 'Failed to initialize vector store',
        error: error.message
      };
    }
  }

  /**
   * Load documents from a directory
   * @param {string} documentsPath - Path to directory containing government documents
   * @returns {Array} Array of document objects
   */
  async loadDocuments(documentsPath) {
    const documents = [];
    const textSplitter = new RecursiveCharacterTextSplitter({
      chunkSize: 1000,
      chunkOverlap: 200
    });
    
    // Read all files in the directory
    const files = fs.readdirSync(documentsPath);
    
    for (const file of files) {
      const filePath = path.join(documentsPath, file);
      const stats = fs.statSync(filePath);
      
      // Skip directories
      if (stats.isDirectory()) continue;
      
      // Process based on file extension
      const fileExt = path.extname(file).toLowerCase();
      
      if (['.txt', '.md', '.html'].includes(fileExt)) {
        const content = fs.readFileSync(filePath, 'utf8');
        const docName = path.basename(file, fileExt);
        
        // Split text into chunks
        const textChunks = await textSplitter.splitText(content);
        
        // Create Document objects for each chunk
        textChunks.forEach((chunk, i) => {
          documents.push(
            new Document({
              pageContent: chunk,
              metadata: {
                source: file,
                fileName: docName,
                chunk: i,
                fileType: fileExt.substring(1)
              }
            })
          );
        });
      }
      // Additional file types can be handled here with appropriate parsers
    }
    
    return documents;
  }

  /**
   * Search for information related to a query
   * @param {string} query - User's query
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Object} Search results and generated response
   */
  async searchWithQuery(query, maxResults = 5) {
    try {
      if (this.useAzureSearch) {
        return await this.searchWithAzure(query, maxResults);
      } else if (this.vectorStore) {
        return await this.searchWithFAISS(query, maxResults);
      } else {
        return {
          success: false,
          message: 'Vector store not initialized. Please call initializeLocalVectorStore first.'
        };
      }
    } catch (error) {
      console.error('Error searching with query:', error);
      return {
        success: false,
        message: 'Failed to search with query',
        error: error.message
      };
    }
  }

  /**
   * Search using Azure Cognitive Search
   * @param {string} query - User's query
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Object} Search results and generated response
   */
  async searchWithAzure(query, maxResults) {
    try {
      // Search the index
      const searchResults = await this.searchClient.search(query, {
        top: maxResults,
        select: ["id", "content", "source", "fileName", "chunk"],
        queryType: "semantic",
        semanticConfiguration: "default",
        searchFields: ["content"]
      });
      
      // Process search results
      const retrievedDocuments = [];
      for await (const result of searchResults.results) {
        retrievedDocuments.push({
          content: result.document.content,
          source: result.document.source,
          fileName: result.document.fileName
        });
      }
      
      // Generate response with retrieved information
      const response = await this.generateResponse(query, retrievedDocuments);
      
      return {
        success: true,
        query,
        results: retrievedDocuments,
        response,
        searchType: 'azure'
      };
    } catch (error) {
      console.error('Error searching with Azure:', error);
      return {
        success: false,
        message: 'Failed to search with Azure Cognitive Search',
        error: error.message
      };
    }
  }

  /**
   * Search using FAISS vector store
   * @param {string} query - User's query
   * @param {number} maxResults - Maximum number of results to return
   * @returns {Object} Search results and generated response
   */
  async searchWithFAISS(query, maxResults) {
    try {
      // Search the vector store
      const results = await this.vectorStore.similaritySearch(query, maxResults);
      
      // Process search results
      const retrievedDocuments = results.map(doc => ({
        content: doc.pageContent,
        source: doc.metadata.source,
        fileName: doc.metadata.fileName
      }));
      
      // Generate response with retrieved information
      const response = await this.generateResponse(query, retrievedDocuments);
      
      return {
        success: true,
        query,
        results: retrievedDocuments,
        response,
        searchType: 'faiss'
      };
    } catch (error) {
      console.error('Error searching with FAISS:', error);
      return {
        success: false,
        message: 'Failed to search with FAISS',
        error: error.message
      };
    }
  }

  /**
   * Generate a response based on retrieved documents
   * @param {string} query - User's query
   * @param {Array} documents - Retrieved documents
   * @returns {string} Generated response
   */
  async generateResponse(query, documents) {
    try {
      if (documents.length === 0) {
        return "I couldn't find any specific information about that in my government documents database. Please try rephrasing your question or ask something else.";
      }
      
      // Combine document content with separator
      const documentContent = documents.map(doc => doc.content).join('\n\n');
      
      // Construct prompt with retrieved information
      const prompt = `You are a helpful government assistant. 
      
Based on the following information from official government sources, provide a detailed answer to the user's question.

USER QUESTION: ${query}

RETRIEVED INFORMATION:
${documentContent}

Please provide a comprehensive, accurate answer based ONLY on the information above. If the information doesn't fully answer the question, acknowledge the limitations in your response. Include official guidance, processes, and next steps when appropriate. Format your answer in clear paragraphs with appropriate markdown for readability.`;
      
      // Generate response using the LLM
      const response = await this.llm.call(prompt);
      
      return response.content;
    } catch (error) {
      console.error('Error generating response:', error);
      return "I'm sorry, I encountered an error while generating a response. Please try again.";
    }
  }

  /**
   * Search and provide insights for a document processed by the Document Parsing Agent
   * @param {Object} documentData - Document data from the Document Parsing Agent
   * @returns {Object} Additional information and context about the document
   */
  async enhanceDocumentWithRAG(documentData) {
    try {
      if (!documentData || !documentData.extractedData) {
        return {
          success: false,
          message: 'Invalid document data provided'
        };
      }
      
      // Extract key information from the document
      const documentText = documentData.extractedData.text.join(' ');
      const documentType = documentData.documentType || 'unknown';
      
      // Generate queries based on document type and content
      const queries = this.generateQueriesFromDocument(documentType, documentText);
      
      // Search for information using generated queries
      const searchResults = [];
      
      for (const query of queries) {
        const result = await this.searchWithQuery(query, 3);
        if (result.success) {
          searchResults.push({
            query,
            response: result.response
          });
        }
      }
      
      // Combine search results into enhanced document information
      const enhancedInfo = {
        success: true,
        documentType,
        additionalContext: searchResults,
        suggestedActions: await this.generateSuggestedActions(documentType, documentText, searchResults),
        relatedForms: await this.findRelatedForms(documentType, documentText)
      };
      
      return enhancedInfo;
    } catch (error) {
      console.error('Error enhancing document with RAG:', error);
      return {
        success: false,
        message: 'Failed to enhance document with additional information',
        error: error.message
      };
    }
  }

  /**
   * Generate queries based on document type and content
   * @param {string} documentType - Type of document
   * @param {string} documentText - Text content of the document
   * @returns {Array} Generated queries
   */
  generateQueriesFromDocument(documentType, documentText) {
    const queries = [];
    
    // General query about document type
    queries.push(`What is a ${documentType.replace('_', ' ')} and what is its purpose?`);
    
    // Document-specific queries
    switch (documentType) {
      case 'tax_form':
        queries.push('How to correctly fill out tax forms');
        queries.push('Common tax form errors to avoid');
        queries.push('Tax form submission deadlines and methods');
        break;
        
      case 'benefits_form':
        queries.push('Eligibility criteria for government benefits');
        queries.push('Required documentation for benefits applications');
        queries.push('How to appeal benefits denial');
        break;
        
      case 'dmv_form':
        queries.push('DMV document processing times');
        queries.push('Required identification for DMV forms');
        queries.push('How to renew vehicle registration');
        break;
        
      case 'immigration_form':
        queries.push('Immigration form processing timeline');
        queries.push('Supporting documents needed for immigration applications');
        queries.push('Next steps after immigration form submission');
        break;
        
      case 'housing_form':
        queries.push('Housing assistance eligibility requirements');
        queries.push('Housing application process timeline');
        queries.push('Required documentation for housing applications');
        break;
        
      default:
        queries.push('Common government form requirements');
        queries.push('How to track government form submission status');
        queries.push('Government form processing times');
    }
    
    return queries;
  }

  /**
   * Generate suggested actions based on document analysis
   * @param {string} documentType - Type of document
   * @param {string} documentText - Text content of the document
   * @param {Array} searchResults - Results from RAG search
   * @returns {Array} Suggested actions
   */
  async generateSuggestedActions(documentType, documentText, searchResults) {
    // Combine search results
    const contextInfo = searchResults.map(result => result.response).join('\n\n');
    
    // Generate prompt for suggested actions
    const prompt = `Based on this ${documentType.replace('_', ' ')} and the following context information:
    
${contextInfo}

Generate a list of 3-5 specific, actionable steps that someone should take in response to this document. 
Format each action item as a clear instruction prefixed with "- ".`;
    
    try {
      // Generate response
      const response = await this.llm.call(prompt);
      
      // Extract action items (lines starting with "- ")
      const actionText = response.content;
      const actionItems = actionText.split('\n')
        .filter(line => line.trim().startsWith('- '))
        .map(line => line.trim().substring(2).trim());
      
      return actionItems;
    } catch (error) {
      console.error('Error generating suggested actions:', error);
      
      // Fallback to default actions based on document type
      return this.getDefaultActions(documentType);
    }
  }

  /**
   * Get default actions based on document type
   * @param {string} documentType - Type of document
   * @returns {Array} Default suggested actions
   */
  getDefaultActions(documentType) {
    switch (documentType) {
      case 'tax_form':
        return [
          'Review all entries for accuracy',
          'Sign and date the form',
          'Make a copy for your records',
          'Submit by the required deadline',
          'Follow up if no confirmation is received within 30 days'
        ];
        
      case 'benefits_form':
        return [
          'Gather all required supporting documentation',
          'Submit application to the appropriate agency',
          'Keep a copy of all submitted materials',
          'Note your application/case number for reference',
          'Follow up after 2 weeks if no confirmation is received'
        ];
        
      case 'dmv_form':
        return [
          'Complete all required fields on the form',
          'Prepare payment for any required fees',
          'Gather required identification documents',
          'Visit your local DMV office or submit online if available',
          'Keep your receipt as proof of submission'
        ];
        
      case 'immigration_form':
        return [
          'Make sure all fields are completed accurately',
          'Include all required supporting documentation',
          'Pay the correct filing fee',
          'Submit to the correct USCIS address',
          'Keep the receipt notice for tracking your case'
        ];
        
      case 'housing_form':
        return [
          'Complete all required sections of the form',
          'Gather proof of income and identification',
          'Submit to the housing authority or property manager',
          'Request a receipt or confirmation',
          'Follow up within 2 weeks if no response'
        ];
        
      default:
        return [
          'Review the document carefully',
          'Complete all required fields',
          'Submit to the appropriate agency',
          'Keep a copy for your records',
          'Follow up if you don't receive a response'
        ];
    }
  }

  /**
   * Find related forms based on document type
   * @param {string} documentType - Type of document
   * @param {string} documentText - Text content of the document
   * @returns {Array} Related forms and resources
   */
  async findRelatedForms(documentType, documentText) {
    // Set default related forms based on document type
    const defaultRelatedForms = {
      'tax_form': [
        { name: 'Form W-2', description: 'Wage and Tax Statement', url: 'https://www.irs.gov/pub/irs-pdf/fw2.pdf' },
        { name: 'Form 1099', description: 'Miscellaneous Income', url: 'https://www.irs.gov/pub/irs-pdf/f1099msc.pdf' },
        { name: 'Form 4868', description: 'Application for Extension', url: 'https://www.irs.gov/pub/irs-pdf/f4868.pdf' }
      ],
      'benefits_form': [
        { name: 'SNAP Application', description: 'Food Assistance', url: 'https://www.fns.usda.gov/snap/applicant-recipient' },
        { name: 'Medicaid Application', description: 'Health Coverage', url: 'https://www.medicaid.gov/medicaid/eligibility/index.html' },
        { name: 'TANF Application', description: 'Temporary Assistance', url: 'https://www.acf.hhs.gov/ofa/programs/tanf' }
      ],
      'dmv_form': [
        { name: 'Driver License Application', description: 'New or Renewal', url: 'https://www.usa.gov/motor-vehicle-services' },
        { name: 'Vehicle Registration', description: 'New or Renewal', url: 'https://www.usa.gov/motor-vehicle-services' },
        { name: 'Title Transfer Form', description: 'Vehicle Ownership', url: 'https://www.usa.gov/motor-vehicle-services' }
      ],
      'immigration_form': [
        { name: 'Form I-485', description: 'Adjust Status to Permanent Resident', url: 'https://www.uscis.gov/i-485' },
        { name: 'Form I-90', description: 'Replace Permanent Resident Card', url: 'https://www.uscis.gov/i-90' },
        { name: 'Form I-130', description: 'Petition for Alien Relative', url: 'https://www.uscis.gov/i-130' }
      ],
      'housing_form': [
        { name: 'HUD Form 52649', description: 'Housing Choice Voucher', url: 'https://www.hud.gov/program_offices/public_indian_housing/programs/hcv' },
        { name: 'Form SF-424', description: 'Federal Assistance Application', url: 'https://www.grants.gov/forms/sf-424-family.html' },
        { name: 'HUD Form 903', description: 'Housing Discrimination Complaint', url: 'https://www.hud.gov/program_offices/fair_housing_equal_opp/online-complaint' }
      ],
      'government_form': [
        { name: 'SF-182', description: 'Government Training Request', url: 'https://www.opm.gov/forms/standard-forms/' },
        { name: 'SF-86', description: 'Security Clearance Questionnaire', url: 'https://www.opm.gov/forms/standard-forms/' },
        { name: 'USA Jobs Application', description: 'Federal Employment', url: 'https://www.usajobs.gov/' }
      ]
    };
    
    // Return default related forms based on document type
    return defaultRelatedForms[documentType] || defaultRelatedForms.government_form;
  }
}

module.exports = RAGSearchAgent;
