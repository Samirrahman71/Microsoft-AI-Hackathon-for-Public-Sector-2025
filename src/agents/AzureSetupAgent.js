/**
 * AzureSetupAgent.js
 * Handles setup and validation of Azure OpenAI integration
 */
const { OpenAI } = require('@langchain/openai');
require('dotenv').config();

class AzureSetupAgent {
  constructor() {
    this.openai = new OpenAI({
      azureOpenAIApiKey: process.env.AZURE_OPENAI_API_KEY,
      azureOpenAIApiVersion: '2023-05-15',
      azureOpenAIApiDeploymentName: process.env.AZURE_OPENAI_DEPLOYMENT_NAME,
      azureOpenAIApiInstanceName: process.env.AZURE_OPENAI_ENDPOINT.replace('https://', '').replace('.openai.azure.com/', ''),
      azureOpenAIApiEmbeddingDeploymentName: process.env.AZURE_OPENAI_EMBEDDING_DEPLOYMENT_NAME,
    });
  }

  /**
   * Validates the Azure OpenAI integration with a test prompt
   */
  async validateSetup() {
    try {
      const testPrompt = "Respond with 'Azure OpenAI integration successful' if you receive this message.";
      
      const response = await this.openai.completions.create({
        prompt: testPrompt,
        max_tokens: 50,
        temperature: 0.7,
      });
      
      const responseText = response.choices[0].text.trim();
      console.log('Response:', responseText);
      
      if (responseText.includes('successful')) {
        return { 
          success: true, 
          message: 'Azure OpenAI integration validated successfully',
          model: response.model 
        };
      } else {
        return { 
          success: false, 
          message: 'Azure OpenAI integration validation failed: Unexpected response',
          response: responseText 
        };
      }
    } catch (error) {
      console.error('Azure OpenAI validation error:', error);
      return { 
        success: false, 
        message: 'Azure OpenAI integration validation failed', 
        error: error.message 
      };
    }
  }

  /**
   * Gets information about the available models
   */
  async getModelInfo() {
    try {
      // List available models
      const models = await this.openai.models.list();
      return {
        success: true,
        models: models.data.map(model => ({
          id: model.id,
          owned_by: model.owned_by,
          created: model.created
        }))
      };
    } catch (error) {
      console.error('Error fetching model information:', error);
      return {
        success: false,
        message: 'Failed to retrieve model information',
        error: error.message
      };
    }
  }
}

module.exports = AzureSetupAgent;
