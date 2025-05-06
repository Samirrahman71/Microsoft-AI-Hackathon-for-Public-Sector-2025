import React, { useState } from 'react';
import styled from 'styled-components';

const ProcessorContainer = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  padding: 1.5rem;
  background-color: white;
  border-radius: 8px;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
`;

const Title = styled.h2`
  color: #0078d4;
  margin-bottom: 1rem;
`;

const ServiceSelector = styled.div`
  display: flex;
  flex-wrap: wrap;
  gap: 1rem;
  margin-bottom: 1.5rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const ServiceCard = styled.div`
  flex: 1;
  min-width: 200px;
  padding: 1.5rem;
  border-radius: 8px;
  background-color: ${props => props.selected ? '#f0f7ff' : '#f9f9f9'};
  border: 2px solid ${props => props.selected ? '#0078d4' : 'transparent'};
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: #f0f7ff;
  }
  
  @media (max-width: 768px) {
    min-width: 100%;
  }
`;

const ServiceIcon = styled.div`
  width: 40px;
  height: 40px;
  margin-bottom: 1rem;
  color: #0078d4;
`;

const ServiceTitle = styled.h3`
  margin: 0 0 0.5rem 0;
  font-size: 1.1rem;
`;

const ServiceDescription = styled.p`
  font-size: 0.875rem;
  color: #666;
  margin: 0;
`;

const ProcessingOptions = styled.div`
  display: flex;
  flex-direction: column;
  gap: 1rem;
  margin-bottom: 1.5rem;
`;

const OptionGroup = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const OptionLabel = styled.label`
  font-weight: 500;
  margin-bottom: 0.25rem;
`;

const OptionInput = styled.input`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
`;

const OptionSelect = styled.select`
  padding: 0.75rem;
  border: 1px solid #ddd;
  border-radius: 4px;
  background-color: white;
`;

const OptionCheckbox = styled.div`
  display: flex;
  align-items: center;
  gap: 0.5rem;
  
  input {
    width: 18px;
    height: 18px;
  }
`;

const ConfigSection = styled.div`
  background-color: #f9f9f9;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
`;

const ConfigHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
`;

const ConfigTitle = styled.h3`
  margin: 0;
  font-size: 1.1rem;
`;

const CodeBlock = styled.pre`
  background-color: #2b2b2b;
  color: #f8f8f8;
  padding: 1rem;
  border-radius: 4px;
  overflow-x: auto;
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 0.875rem;
`;

const ButtonRow = styled.div`
  display: flex;
  gap: 1rem;
  margin-top: 1rem;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const Button = styled.button`
  padding: 0.75rem 1.5rem;
  border-radius: 4px;
  font-size: 1rem;
  cursor: pointer;
  font-weight: 500;
  transition: background-color 0.2s;
  
  ${props => props.primary && `
    background-color: #0078d4;
    color: white;
    border: none;
    
    &:hover {
      background-color: #005a9e;
    }
  `}
  
  ${props => props.secondary && `
    background-color: transparent;
    color: #0078d4;
    border: 1px solid #0078d4;
    
    &:hover {
      background-color: #f0f7ff;
    }
  `}
`;

const ResultSection = styled.div`
  display: ${props => props.visible ? 'block' : 'none'};
`;

const ResultTabs = styled.div`
  display: flex;
  border-bottom: 1px solid #ddd;
  margin-bottom: 1rem;
`;

const ResultTab = styled.div`
  padding: 0.75rem 1.5rem;
  cursor: pointer;
  border-bottom: 2px solid ${props => props.active ? '#0078d4' : 'transparent'};
  color: ${props => props.active ? '#0078d4' : '#666'};
  font-weight: ${props => props.active ? '500' : 'normal'};
  
  &:hover {
    color: #0078d4;
  }
`;

const ResultContent = styled.div`
  min-height: 300px;
`;

const JsonViewer = styled.div`
  background-color: #f9f9f9;
  border-radius: 4px;
  padding: 1rem;
  max-height: 400px;
  overflow-y: auto;
`;

const ExtractedField = styled.div`
  display: flex;
  flex-direction: column;
  background-color: white;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 1rem;
  margin-bottom: 0.5rem;
`;

const FieldLabel = styled.span`
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 0.25rem;
`;

const FieldValue = styled.span`
  font-weight: 500;
`;

const ConfidenceBar = styled.div`
  height: 6px;
  background-color: #f0f0f0;
  border-radius: 3px;
  margin-top: 0.5rem;
  
  &::before {
    content: '';
    display: block;
    height: 100%;
    width: ${props => props.confidence}%;
    background-color: ${props => {
      if (props.confidence > 90) return '#52c41a';
      if (props.confidence > 75) return '#1890ff';
      if (props.confidence > 60) return '#fa8c16';
      return '#f5222d';
    }};
    border-radius: 3px;
  }
`;

const ConfidenceLabel = styled.div`
  display: flex;
  justify-content: flex-end;
  font-size: 0.75rem;
  margin-top: 0.25rem;
  color: #666;
`;

const AzureAIDocumentProcessor = () => {
  const [selectedService, setSelectedService] = useState('form-recognizer');
  const [modelType, setModelType] = useState('prebuilt-invoice');
  const [showResults, setShowResults] = useState(false);
  const [activeResultTab, setActiveResultTab] = useState('extracted');
  
  // This would connect to actual Azure services in a real implementation
  const processDocument = () => {
    setShowResults(true);
  };
  
  const generateSampleCode = () => {
    if (selectedService === 'form-recognizer') {
      return `// Azure Document Intelligence integration with React
import { DocumentAnalysisClient } from "@azure/ai-form-recognizer";
import { AzureKeyCredential } from "@azure/core-auth";

// Your Azure AI Document Intelligence resource information
const endpoint = "https://your-form-recognizer-resource.cognitiveservices.azure.com/";
const apiKey = process.env.REACT_APP_FORM_RECOGNIZER_API_KEY;

const analyzeDocument = async (documentFile) => {
  const client = new DocumentAnalysisClient(
    endpoint,
    new AzureKeyCredential(apiKey)
  );
  
  const poller = await client.beginAnalyzeDocument(
    "${modelType === 'prebuilt-invoice' ? 'prebuilt-invoice' : 
      modelType === 'prebuilt-receipt' ? 'prebuilt-receipt' : 
      modelType === 'prebuilt-idDocument' ? 'prebuilt-idDocument' : 
      modelType === 'custom' ? 'your-custom-model-id' : 'prebuilt-document'}",
    documentFile
  );
  
  const result = await poller.pollUntilDone();
  return result;
};`;
    } else if (selectedService === 'openai') {
      return `// Azure OpenAI integration with React
import { OpenAIClient, AzureKeyCredential } from "@azure/openai";

// Your Azure OpenAI resource information
const endpoint = "https://your-azure-openai-resource.openai.azure.com/";
const apiKey = process.env.REACT_APP_AZURE_OPENAI_API_KEY;
const deploymentId = "your-gpt-deployment";

const analyzeDocumentContent = async (documentText) => {
  const client = new OpenAIClient(
    endpoint,
    new AzureKeyCredential(apiKey)
  );
  
  const result = await client.getChatCompletions(
    deploymentId,
    [
      { role: "system", content: "You are an AI assistant that helps extract and summarize key information from documents." },
      { role: "user", content: \`Extract the key information from this document: \${documentText}\` }
    ],
    {
      temperature: 0.3,
      maxTokens: 800
    }
  );
  
  return result.choices[0].message.content;
};`;
    } else {
      return `// Azure AI Search integration with React
import { SearchClient, AzureKeyCredential } from "@azure/search-documents";

// Your Azure AI Search resource information
const endpoint = "https://your-search-service.search.windows.net/";
const apiKey = process.env.REACT_APP_SEARCH_API_KEY;
const indexName = "documents-index";

const searchDocuments = async (searchQuery) => {
  const client = new SearchClient(
    endpoint,
    indexName,
    new AzureKeyCredential(apiKey)
  );
  
  const searchResults = await client.search(searchQuery, {
    select: ["id", "title", "content", "category"],
    queryType: "semantic",
    searchFields: ["title", "content"],
    top: 10
  });
  
  return searchResults;
};`;
    }
  };
  
  // Sample extracted data for demonstration
  const sampleInvoiceData = {
    invoiceNumber: "INV-3337",
    invoiceDate: "2025-04-15",
    dueDate: "2025-05-15",
    vendorName: "Contoso Ltd.",
    vendorAddress: "123 Commerce St, Seattle, WA 98122",
    customerName: "Alpine Ski House",
    subtotal: "$1,250.00",
    tax: "$100.00",
    total: "$1,350.00",
    lineItems: [
      { description: "Azure App Service Plan (P1v3)", quantity: 1, unitPrice: "$750.00", amount: "$750.00" },
      { description: "Azure Storage Account (500 GB)", quantity: 1, unitPrice: "$500.00", amount: "$500.00" }
    ]
  };
  
  return (
    <ProcessorContainer>
      <Title>Azure AI Document Processing</Title>
      
      <ServiceSelector>
        <ServiceCard 
          selected={selectedService === 'form-recognizer'}
          onClick={() => setSelectedService('form-recognizer')}
        >
          <ServiceIcon>
            <svg viewBox="0 0 18 18" fill="currentColor">
              <path d="M16 0H2C0.9 0 0 0.9 0 2V16C0 17.1 0.9 18 2 18H16C17.1 18 18 17.1 18 16V2C18 0.9 17.1 0 16 0ZM2 16V2H16V16H2Z" />
              <path d="M4 14H14V4H4V14ZM6 6H12V8H6V6ZM6 10H12V12H6V10Z" />
            </svg>
          </ServiceIcon>
          <ServiceTitle>Document Intelligence</ServiceTitle>
          <ServiceDescription>Extract structured data from documents using Azure AI Document Intelligence</ServiceDescription>
        </ServiceCard>
        
        <ServiceCard 
          selected={selectedService === 'openai'}
          onClick={() => setSelectedService('openai')}
        >
          <ServiceIcon>
            <svg viewBox="0 0 18 18" fill="currentColor">
              <path d="M9 0C4.03 0 0 4.03 0 9C0 13.97 4.03 18 9 18C13.97 18 18 13.97 18 9C18 4.03 13.97 0 9 0ZM13.5 10.5H10.5V13.5H7.5V10.5H4.5V7.5H7.5V4.5H10.5V7.5H13.5V10.5Z" />
            </svg>
          </ServiceIcon>
          <ServiceTitle>Azure OpenAI</ServiceTitle>
          <ServiceDescription>Analyze document content with Azure OpenAI Service for summarization and insights</ServiceDescription>
        </ServiceCard>
        
        <ServiceCard 
          selected={selectedService === 'search'}
          onClick={() => setSelectedService('search')}
        >
          <ServiceIcon>
            <svg viewBox="0 0 18 18" fill="currentColor">
              <path d="M12.5 11H11.71L11.43 10.73C12.41 9.59 13 8.11 13 6.5C13 2.91 10.09 0 6.5 0C2.91 0 0 2.91 0 6.5C0 10.09 2.91 13 6.5 13C8.11 13 9.59 12.41 10.73 11.43L11 11.71V12.5L16 17.49L17.49 16L12.5 11ZM6.5 11C4.01 11 2 8.99 2 6.5C2 4.01 4.01 2 6.5 2C8.99 2 11 4.01 11 6.5C11 8.99 8.99 11 6.5 11Z" />
            </svg>
          </ServiceIcon>
          <ServiceTitle>Azure AI Search</ServiceTitle>
          <ServiceDescription>Index and search documents with Azure AI Search for intelligent content discovery</ServiceDescription>
        </ServiceCard>
      </ServiceSelector>
      
      {selectedService === 'form-recognizer' && (
        <ProcessingOptions>
          <OptionGroup>
            <OptionLabel>Model Type</OptionLabel>
            <OptionSelect value={modelType} onChange={(e) => setModelType(e.target.value)}>
              <option value="prebuilt-invoice">Prebuilt - Invoice</option>
              <option value="prebuilt-receipt">Prebuilt - Receipt</option>
              <option value="prebuilt-idDocument">Prebuilt - ID Document</option>
              <option value="prebuilt-document">Prebuilt - Document</option>
              <option value="custom">Custom Model</option>
            </OptionSelect>
          </OptionGroup>
          
          {modelType === 'custom' && (
            <OptionGroup>
              <OptionLabel>Custom Model ID</OptionLabel>
              <OptionInput type="text" placeholder="Enter your custom model ID" />
            </OptionGroup>
          )}
          
          <OptionGroup>
            <OptionLabel>Processing Options</OptionLabel>
            <OptionCheckbox>
              <input type="checkbox" id="extract-tables" defaultChecked />
              <label htmlFor="extract-tables">Extract Tables</label>
            </OptionCheckbox>
            <OptionCheckbox>
              <input type="checkbox" id="extract-key-value-pairs" defaultChecked />
              <label htmlFor="extract-key-value-pairs">Extract Key-Value Pairs</label>
            </OptionCheckbox>
            <OptionCheckbox>
              <input type="checkbox" id="extract-text" defaultChecked />
              <label htmlFor="extract-text">Extract Text</label>
            </OptionCheckbox>
          </OptionGroup>
        </ProcessingOptions>
      )}
      
      {selectedService === 'openai' && (
        <ProcessingOptions>
          <OptionGroup>
            <OptionLabel>OpenAI Model</OptionLabel>
            <OptionSelect>
              <option value="gpt-4">GPT-4</option>
              <option value="gpt-35-turbo">GPT-3.5 Turbo</option>
            </OptionSelect>
          </OptionGroup>
          
          <OptionGroup>
            <OptionLabel>Processing Task</OptionLabel>
            <OptionSelect>
              <option value="summarize">Summarize Document</option>
              <option value="extract-entities">Extract Entities</option>
              <option value="answer-questions">Answer Questions from Document</option>
              <option value="custom-prompt">Custom Prompt</option>
            </OptionSelect>
          </OptionGroup>
          
          <OptionGroup>
            <OptionLabel>Temperature</OptionLabel>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
              <input type="range" min="0" max="10" defaultValue="3" style={{ flex: 1 }} />
              <span>0.3</span>
            </div>
          </OptionGroup>
          
          <OptionGroup>
            <OptionLabel>Max Tokens</OptionLabel>
            <OptionInput type="number" defaultValue="800" />
          </OptionGroup>
        </ProcessingOptions>
      )}
      
      {selectedService === 'search' && (
        <ProcessingOptions>
          <OptionGroup>
            <OptionLabel>Search Index</OptionLabel>
            <OptionSelect>
              <option value="documents-index">documents-index</option>
              <option value="contracts-index">contracts-index</option>
              <option value="invoices-index">invoices-index</option>
            </OptionSelect>
          </OptionGroup>
          
          <OptionGroup>
            <OptionLabel>Search Query</OptionLabel>
            <OptionInput type="text" placeholder="Enter search query" />
          </OptionGroup>
          
          <OptionGroup>
            <OptionLabel>Search Type</OptionLabel>
            <OptionSelect>
              <option value="semantic">Semantic Search</option>
              <option value="full-text">Full Text Search</option>
              <option value="vector">Vector Search</option>
            </OptionSelect>
          </OptionGroup>
          
          <OptionGroup>
            <OptionLabel>Filter Results</OptionLabel>
            <OptionInput type="text" placeholder="category eq 'invoice' and date ge '2025-01-01'" />
          </OptionGroup>
        </ProcessingOptions>
      )}
      
      <ConfigSection>
        <ConfigHeader>
          <ConfigTitle>Integration Code</ConfigTitle>
          <Button secondary>Copy Code</Button>
        </ConfigHeader>
        <CodeBlock>
          {generateSampleCode()}
        </CodeBlock>
      </ConfigSection>
      
      <ButtonRow>
        <Button primary onClick={processDocument}>Process Document</Button>
        <Button secondary>Save Configuration</Button>
      </ButtonRow>
      
      <ResultSection visible={showResults}>
        <Title>Processing Results</Title>
        
        <ResultTabs>
          <ResultTab 
            active={activeResultTab === 'extracted'} 
            onClick={() => setActiveResultTab('extracted')}
          >
            Extracted Data
          </ResultTab>
          <ResultTab 
            active={activeResultTab === 'json'} 
            onClick={() => setActiveResultTab('json')}
          >
            JSON Output
          </ResultTab>
          <ResultTab 
            active={activeResultTab === 'visual'} 
            onClick={() => setActiveResultTab('visual')}
          >
            Visual Results
          </ResultTab>
        </ResultTabs>
        
        <ResultContent>
          {activeResultTab === 'extracted' && (
            <div>
              <ExtractedField>
                <FieldLabel>Invoice Number</FieldLabel>
                <FieldValue>{sampleInvoiceData.invoiceNumber}</FieldValue>
                <ConfidenceBar confidence={98} />
                <ConfidenceLabel>98% confidence</ConfidenceLabel>
              </ExtractedField>
              
              <ExtractedField>
                <FieldLabel>Invoice Date</FieldLabel>
                <FieldValue>{sampleInvoiceData.invoiceDate}</FieldValue>
                <ConfidenceBar confidence={97} />
                <ConfidenceLabel>97% confidence</ConfidenceLabel>
              </ExtractedField>
              
              <ExtractedField>
                <FieldLabel>Vendor</FieldLabel>
                <FieldValue>{sampleInvoiceData.vendorName}</FieldValue>
                <ConfidenceBar confidence={95} />
                <ConfidenceLabel>95% confidence</ConfidenceLabel>
              </ExtractedField>
              
              <ExtractedField>
                <FieldLabel>Customer</FieldLabel>
                <FieldValue>{sampleInvoiceData.customerName}</FieldValue>
                <ConfidenceBar confidence={92} />
                <ConfidenceLabel>92% confidence</ConfidenceLabel>
              </ExtractedField>
              
              <ExtractedField>
                <FieldLabel>Total Amount</FieldLabel>
                <FieldValue>{sampleInvoiceData.total}</FieldValue>
                <ConfidenceBar confidence={99} />
                <ConfidenceLabel>99% confidence</ConfidenceLabel>
              </ExtractedField>
            </div>
          )}
          
          {activeResultTab === 'json' && (
            <JsonViewer>
              <pre>{JSON.stringify(sampleInvoiceData, null, 2)}</pre>
            </JsonViewer>
          )}
          
          {activeResultTab === 'visual' && (
            <div style={{ textAlign: 'center', padding: '2rem' }}>
              <p>Visual representation of document analysis would appear here, showing bounding boxes around recognized fields.</p>
              <img 
                src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='300' viewBox='0 0 400 300'%3E%3Crect width='400' height='300' fill='%23f0f0f0'/%3E%3Ctext x='50%25' y='50%25' font-family='Arial' font-size='14' text-anchor='middle' dominant-baseline='middle'%3EDocument Analysis Visualization%3C/text%3E%3C/svg%3E"
                alt="Document Analysis Visualization" 
                style={{ maxWidth: '100%', border: '1px solid #ddd', borderRadius: '4px' }}
              />
            </div>
          )}
        </ResultContent>
      </ResultSection>
    </ProcessorContainer>
  );
};

export default AzureAIDocumentProcessor;
