"""
Test script for the RAG (Retrieval-Augmented Generation) system
"""

import os
from dotenv import load_dotenv
from chatbot.rag_system import RAGSystem

# Load environment variables
load_dotenv()

def test_rag_system():
    """Test the RAG system with a few example queries"""
    
    # Initialize the RAG system
    openai_api_key = os.getenv('OPENAI_API_KEY')
    knowledge_base_dir = os.path.join(os.path.dirname(__file__), 'knowledge_base')
    
    if not openai_api_key:
        print("Error: OPENAI_API_KEY not found in environment variables.")
        return
    
    print(f"Initializing RAG system with knowledge base at: {knowledge_base_dir}")
    rag_system = RAGSystem(knowledge_base_dir=knowledge_base_dir, openai_api_key=openai_api_key)
    
    # Build the index
    print("Building the vector index...")
    rag_system.build_index()
    
    # Test queries
    test_queries = [
        "How do I renew my driver's license in California?",
        "What tax benefits are available for low-income families in California?",
        "How can I apply for food assistance programs?",
        "What is the process for changing my address with the DMV?",
        "How do property taxes work in California?"
    ]
    
    # Test system prompt
    system_prompt = """You are GovFlowAI, a helpful government services assistant. 
    Provide accurate, specific information about government services based on the context provided.
    Keep responses concise and direct, focusing on actionable steps the user can take.
    If the information isn't in the provided context, say so clearly."""
    
    # Process each query
    for i, query in enumerate(test_queries):
        print(f"\n\n===== Test Query {i+1}: {query} =====")
        
        # Retrieve context
        print("\nRetrieving relevant context...")
        relevant_docs = rag_system.retrieve_context(query)
        
        print(f"Found {len(relevant_docs)} relevant document chunks")
        if relevant_docs:
            print("\nTop retrieved context:")
            for j, doc in enumerate(relevant_docs[:2]):  # Show top 2 for brevity
                source = doc.metadata.get("source", "Unknown")
                print(f"Document {j+1} from {source}:")
                print(f"{doc.page_content[:200]}..." if len(doc.page_content) > 200 else doc.page_content)
        
        # Generate response
        print("\nGenerating response...")
        response, sources = rag_system.generate_response(
            user_query=query,
            system_prompt=system_prompt,
            location="California"
        )
        
        print("\nResponse:")
        print(response)
        
        print("\nSources used:")
        for source in sources:
            print(f"- {source.get('source', 'Unknown')} ({source.get('category', 'Unknown')})")

if __name__ == "__main__":
    test_rag_system()
