/**
 * DocumentParsingAgent.js
 * Processes images or PDFs using Azure Form Recognizer
 */
const { DocumentAnalysisClient, AzureKeyCredential } = require('@azure/ai-form-recognizer');
const { BlobServiceClient } = require('@azure/storage-blob');
const { v4: uuidv4 } = require('uuid');
const path = require('path');
const fs = require('fs');
require('dotenv').config();

class DocumentParsingAgent {
  constructor() {
    // Initialize Azure Form Recognizer client
    this.formRecognizerClient = new DocumentAnalysisClient(
      process.env.AZURE_FORM_RECOGNIZER_ENDPOINT,
      new AzureKeyCredential(process.env.AZURE_FORM_RECOGNIZER_KEY)
    );
    
    // Initialize Azure Storage client for document storage
    this.blobServiceClient = BlobServiceClient.fromConnectionString(
      process.env.AZURE_STORAGE_CONNECTION_STRING
    );
    this.containerClient = this.blobServiceClient.getContainerClient(
      process.env.AZURE_STORAGE_CONTAINER_NAME
    );
  }

  /**
   * Process a document from a file path
   * @param {string} filePath - Path to the document file
   * @returns {Object} Extracted data and explanations
   */
  async processDocument(filePath) {
    try {
      const fileExtension = path.extname(filePath).toLowerCase();
      const fileBuffer = fs.readFileSync(filePath);
      
      // Upload to blob storage for persistence
      const blobName = `${uuidv4()}${fileExtension}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(fileBuffer, fileBuffer.length);
      
      // Process based on file type
      if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'].includes(fileExtension)) {
        return await this.processImage(fileBuffer, blockBlobClient.url);
      } else if (fileExtension === '.pdf') {
        return await this.processPdf(fileBuffer, blockBlobClient.url);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('Error processing document:', error);
      return {
        success: false,
        message: 'Failed to process document',
        error: error.message
      };
    }
  }

  /**
   * Process a document from a base64 string
   * @param {string} base64Data - Base64 encoded document data
   * @param {string} fileExtension - File extension (e.g., '.pdf', '.jpg')
   * @returns {Object} Extracted data and explanations
   */
  async processBase64Document(base64Data, fileExtension) {
    try {
      // Remove data:image/* prefix if present
      const base64Content = base64Data.includes('base64,') 
        ? base64Data.split('base64,')[1] 
        : base64Data;
      
      const fileBuffer = Buffer.from(base64Content, 'base64');
      
      // Upload to blob storage for persistence
      const blobName = `${uuidv4()}${fileExtension}`;
      const blockBlobClient = this.containerClient.getBlockBlobClient(blobName);
      await blockBlobClient.upload(fileBuffer, fileBuffer.length);
      
      // Process based on file type
      if (['.jpg', '.jpeg', '.png', '.bmp', '.tiff', '.gif'].includes(fileExtension.toLowerCase())) {
        return await this.processImage(fileBuffer, blockBlobClient.url);
      } else if (fileExtension.toLowerCase() === '.pdf') {
        return await this.processPdf(fileBuffer, blockBlobClient.url);
      } else {
        throw new Error(`Unsupported file type: ${fileExtension}`);
      }
    } catch (error) {
      console.error('Error processing base64 document:', error);
      return {
        success: false,
        message: 'Failed to process document',
        error: error.message
      };
    }
  }

  /**
   * Process an image document
   * @param {Buffer} imageBuffer - Buffer containing the image data
   * @param {string} storageUrl - URL where the image is stored
   * @returns {Object} Extracted data and explanations
   */
  async processImage(imageBuffer, storageUrl) {
    try {
      // Use prebuilt document analysis model
      const poller = await this.formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-document', 
        imageBuffer
      );
      
      const result = await poller.pollUntilDone();
      
      // Extract fields and text content
      const extractedData = this.extractDocumentData(result);
      const documentType = this.identifyDocumentType(extractedData);
      
      // Generate explanation and guidance
      const explanation = await this.generateExplanation(extractedData, documentType);
      const guidance = await this.generateActionGuidance(documentType, extractedData);
      
      return {
        success: true,
        documentType,
        extractedData,
        explanation,
        guidance,
        storageUrl,
        confidence: result.confidence || 0,
        fileType: 'image'
      };
    } catch (error) {
      console.error('Error processing image:', error);
      return {
        success: false,
        message: 'Failed to process image',
        error: error.message
      };
    }
  }

  /**
   * Process a PDF document
   * @param {Buffer} pdfBuffer - Buffer containing the PDF data
   * @param {string} storageUrl - URL where the PDF is stored
   * @returns {Object} Extracted data and explanations
   */
  async processPdf(pdfBuffer, storageUrl) {
    try {
      // Use prebuilt document analysis model
      const poller = await this.formRecognizerClient.beginAnalyzeDocument(
        'prebuilt-document', 
        pdfBuffer
      );
      
      const result = await poller.pollUntilDone();
      
      // Extract fields and text content
      const extractedData = this.extractDocumentData(result);
      const documentType = this.identifyDocumentType(extractedData);
      
      // Generate explanation and guidance
      const explanation = await this.generateExplanation(extractedData, documentType);
      const guidance = await this.generateActionGuidance(documentType, extractedData);
      
      return {
        success: true,
        documentType,
        extractedData,
        explanation,
        guidance,
        storageUrl,
        confidence: result.confidence || 0,
        fileType: 'pdf',
        pageCount: result.pages ? result.pages.length : 1
      };
    } catch (error) {
      console.error('Error processing PDF:', error);
      return {
        success: false,
        message: 'Failed to process PDF',
        error: error.message
      };
    }
  }

  /**
   * Extract structured data from Form Recognizer result
   * @param {Object} result - Form Recognizer analysis result
   * @returns {Object} Structured extracted data
   */
  extractDocumentData(result) {
    const extractedData = {
      keyValuePairs: {},
      tables: [],
      text: [],
      entities: []
    };
    
    // Extract key-value pairs
    if (result.keyValuePairs) {
      result.keyValuePairs.forEach(kvp => {
        if (kvp.key && kvp.value) {
          const key = kvp.key.content.trim();
          const value = kvp.value.content.trim();
          extractedData.keyValuePairs[key] = value;
        }
      });
    }
    
    // Extract tables
    if (result.tables) {
      result.tables.forEach(table => {
        const extractedTable = {
          rowCount: table.rowCount,
          columnCount: table.columnCount,
          cells: []
        };
        
        table.cells.forEach(cell => {
          extractedTable.cells.push({
            rowIndex: cell.rowIndex,
            columnIndex: cell.columnIndex,
            text: cell.content,
            isHeader: cell.kind === 'columnHeader' || cell.kind === 'rowHeader'
          });
        });
        
        extractedData.tables.push(extractedTable);
      });
    }
    
    // Extract text content
    if (result.pages) {
      result.pages.forEach(page => {
        if (page.lines) {
          page.lines.forEach(line => {
            extractedData.text.push(line.content);
          });
        }
      });
    }
    
    // Extract entities if available
    if (result.entities) {
      result.entities.forEach(entity => {
        extractedData.entities.push({
          category: entity.category,
          subCategory: entity.subCategory,
          content: entity.content,
          confidence: entity.confidence
        });
      });
    }
    
    return extractedData;
  }

  /**
   * Identify the type of government document
   * @param {Object} extractedData - Extracted document data
   * @returns {string} Document type
   */
  identifyDocumentType(extractedData) {
    const text = extractedData.text.join(' ').toLowerCase();
    const keyValueKeys = Object.keys(extractedData.keyValuePairs).map(k => k.toLowerCase());
    
    // Check for tax forms
    if (text.includes('internal revenue service') || text.includes('irs') || 
        text.includes('tax return') || text.includes('form 1040')) {
      return 'tax_form';
    }
    
    // Check for benefits/assistance forms
    if (text.includes('supplemental nutrition assistance') || text.includes('snap') ||
        text.includes('medicaid') || text.includes('medicare') ||
        text.includes('social security') || text.includes('disability')) {
      return 'benefits_form';
    }
    
    // Check for DMV/license forms
    if (text.includes('department of motor vehicles') || text.includes('dmv') ||
        text.includes('driver license') || text.includes('vehicle registration')) {
      return 'dmv_form';
    }
    
    // Check for immigration forms
    if (text.includes('department of homeland security') || text.includes('uscis') ||
        text.includes('immigration') || text.includes('citizenship')) {
      return 'immigration_form';
    }
    
    // Check for housing forms
    if (text.includes('housing') || text.includes('lease') || text.includes('mortgage') ||
        text.includes('rental agreement') || text.includes('property tax')) {
      return 'housing_form';
    }
    
    // Default to generic government form
    return 'government_form';
  }

  /**
   * Generate an explanation of the document
   * @param {Object} extractedData - Extracted document data
   * @param {string} documentType - Type of document
   * @returns {string} Human-readable explanation
   */
  async generateExplanation(extractedData, documentType) {
    // Simple explanation generation based on document type and extracted data
    let explanation = `This appears to be a ${this.getDocumentTypeLabel(documentType)}. `;
    
    // Add information about key fields
    if (Object.keys(extractedData.keyValuePairs).length > 0) {
      explanation += "I found the following important information:\n\n";
      
      for (const [key, value] of Object.entries(extractedData.keyValuePairs)) {
        explanation += `- ${key}: ${value}\n`;
      }
    }
    
    // Add information about tables if present
    if (extractedData.tables.length > 0) {
      explanation += `\nThe document contains ${extractedData.tables.length} table(s) with information organized in rows and columns.\n`;
    }
    
    // Add document-type specific explanations
    switch (documentType) {
      case 'tax_form':
        explanation += "\nThis is a tax-related document. It typically requires careful review of income, deductions, and tax calculations.";
        break;
      case 'benefits_form':
        explanation += "\nThis document relates to government benefits. It may contain information about eligibility, benefit amounts, or application status.";
        break;
      case 'dmv_form':
        explanation += "\nThis is a DMV-related document. It likely contains information about vehicle registration, driver's licensing, or related fees.";
        break;
      case 'immigration_form':
        explanation += "\nThis is an immigration-related document. It may contain information about your immigration status, application process, or requirements.";
        break;
      case 'housing_form':
        explanation += "\nThis document relates to housing. It may contain information about leases, mortgages, property taxes, or housing assistance.";
        break;
      default:
        explanation += "\nThis appears to be a general government document. Review the extracted information to understand its purpose and any required actions.";
    }
    
    return explanation;
  }

  /**
   * Generate guidance on actions to take based on the document
   * @param {string} documentType - Type of document
   * @param {Object} extractedData - Extracted document data
   * @returns {Object} Action guidance
   */
  async generateActionGuidance(documentType, extractedData) {
    // Prepare guidance based on document type
    const guidance = {
      nextSteps: [],
      requiredActions: [],
      deadlines: [],
      contactInformation: {}
    };
    
    // Extract possible deadline information from text
    const text = extractedData.text.join(' ');
    const deadlineRegex = /\b(due|deadline|by)\b.{0,15}\b\d{1,2}\/\d{1,2}\/\d{2,4}\b/gi;
    const deadlineMatches = text.match(deadlineRegex);
    
    if (deadlineMatches) {
      guidance.deadlines = deadlineMatches.map(match => match.trim());
    }
    
    // Extract possible contact information
    const phoneRegex = /\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g;
    const phoneMatches = text.match(phoneRegex);
    
    if (phoneMatches) {
      guidance.contactInformation.phone = phoneMatches[0];
    }
    
    // Add document-type specific guidance
    switch (documentType) {
      case 'tax_form':
        guidance.nextSteps = [
          "Review all financial information for accuracy",
          "Ensure all required fields are completed",
          "Sign and date the form where indicated",
          "Make copies for your records",
          "Submit by the filing deadline"
        ];
        guidance.requiredActions = [
          "Submit to the IRS by mail or electronically",
          "Pay any taxes owed or request refund deposit information"
        ];
        break;
        
      case 'benefits_form':
        guidance.nextSteps = [
          "Verify all personal information is correct",
          "Ensure income and resource information is accurate",
          "Check that all required supporting documentation is attached",
          "Make copies for your records"
        ];
        guidance.requiredActions = [
          "Submit to the appropriate benefit agency",
          "Follow up on your application status after 7-10 business days"
        ];
        break;
        
      case 'dmv_form':
        guidance.nextSteps = [
          "Verify all vehicle or license information is correct",
          "Ensure all required fields are completed",
          "Prepare payment for any associated fees",
          "Gather required identification documents"
        ];
        guidance.requiredActions = [
          "Visit local DMV office or submit online if available",
          "Pay applicable fees",
          "Schedule appointment if required"
        ];
        break;
        
      case 'immigration_form':
        guidance.nextSteps = [
          "Verify all personal information is correct",
          "Ensure all required fields are completed",
          "Gather supporting documentation",
          "Make copies of everything for your records"
        ];
        guidance.requiredActions = [
          "Submit to USCIS with appropriate filing fee",
          "Track your case with provided receipt number",
          "Prepare for potential interview or biometrics appointment"
        ];
        break;
        
      case 'housing_form':
        guidance.nextSteps = [
          "Review all terms and conditions carefully",
          "Verify financial information is accurate",
          "Ensure all required fields are completed",
          "Make copies for your records"
        ];
        guidance.requiredActions = [
          "Sign and date where indicated",
          "Submit to housing authority, landlord, or mortgage company",
          "Keep proof of submission or payment"
        ];
        break;
        
      default:
        guidance.nextSteps = [
          "Review document carefully",
          "Identify any required actions or deadlines",
          "Make copies for your records"
        ];
        guidance.requiredActions = [
          "Determine appropriate submission method",
          "Follow up if confirmation not received"
        ];
    }
    
    return guidance;
  }

  /**
   * Get human-readable label for document type
   * @param {string} documentType - Document type code
   * @returns {string} Human-readable document type
   */
  getDocumentTypeLabel(documentType) {
    const labels = {
      'tax_form': 'Tax Form',
      'benefits_form': 'Government Benefits Form',
      'dmv_form': 'DMV Document',
      'immigration_form': 'Immigration Document',
      'housing_form': 'Housing Document',
      'government_form': 'Government Document'
    };
    
    return labels[documentType] || 'Government Document';
  }
}

module.exports = DocumentParsingAgent;
