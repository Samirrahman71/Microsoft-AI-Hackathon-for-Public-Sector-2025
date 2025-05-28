"""
RAG (Retrieval-Augmented Generation) System for GovFlowAI

This module provides functionality to:
1. Process and index documents for a knowledge base
2. Retrieve relevant context based on user queries
3. Enhance LLM responses with retrieved information
"""

import os
import glob
from typing import List, Dict, Any, Tuple
import markdown
from bs4 import BeautifulSoup
import numpy as np
import faiss

# LangChain imports
from langchain_openai import OpenAIEmbeddings
from langchain_text_splitters import RecursiveCharacterTextSplitter
from langchain_core.documents import Document
from langchain_community.vectorstores import FAISS
from langchain_core.prompts import ChatPromptTemplate
from langchain_openai import ChatOpenAI

class RAGSystem:
    def __init__(self, knowledge_base_dir: str, openai_api_key: str):
        """
        Initialize the RAG system.
        
        Args:
            knowledge_base_dir: Directory containing knowledge base documents
            openai_api_key: OpenAI API key for embeddings and completions
        """
        self.knowledge_base_dir = knowledge_base_dir
        self.openai_api_key = openai_api_key
        self.embeddings = OpenAIEmbeddings(api_key=openai_api_key)
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            separators=["\n## ", "\n### ", "\n#### ", "\n", " ", ""]
        )
        self.vector_store = None
        self.indexed_docs = []
        
    def _read_markdown_file(self, file_path: str) -> str:
        """Read and parse a markdown file."""
        with open(file_path, 'r') as f:
            content = f.read()
        return content
        
    def _extract_text_from_markdown(self, md_content: str) -> str:
        """Convert markdown to plain text, preserving important structure."""
        # Convert Markdown to HTML
        html = markdown.markdown(md_content)
        
        # Parse HTML
        soup = BeautifulSoup(html, 'html.parser')
        
        # Extract text, preserving some structure
        text = soup.get_text(separator='\n')
        return text
    
    def _process_document(self, file_path: str) -> List[Document]:
        """Process a single document into chunks with metadata."""
        # Read and extract text
        md_content = self._read_markdown_file(file_path)
        text = self._extract_text_from_markdown(md_content)
        
        # Split into chunks
        chunks = self.text_splitter.split_text(text)
        
        # Create Document objects with metadata
        file_name = os.path.basename(file_path)
        category = os.path.splitext(file_name)[0]
        
        documents = []
        for i, chunk in enumerate(chunks):
            doc = Document(
                page_content=chunk,
                metadata={
                    "source": file_name,
                    "category": category,
                    "chunk_id": i
                }
            )
            documents.append(doc)
            
        return documents
    
    def build_index(self) -> None:
        """Build the vector index from all documents in the knowledge base."""
        all_documents = []
        
        # Find all markdown files
        md_files = glob.glob(os.path.join(self.knowledge_base_dir, "*.md"))
        
        for file_path in md_files:
            documents = self._process_document(file_path)
            all_documents.extend(documents)
            self.indexed_docs.append(os.path.basename(file_path))
        
        # Create vector store
        if all_documents:
            self.vector_store = FAISS.from_documents(all_documents, self.embeddings)
            print(f"Indexed {len(all_documents)} chunks from {len(md_files)} documents")
        else:
            print("No documents found to index")
    
    def retrieve_context(self, query: str, top_k: int = 5) -> List[Document]:
        """
        Retrieve relevant context from the knowledge base.
        
        Args:
            query: User query
            top_k: Number of most relevant chunks to retrieve
            
        Returns:
            List of relevant document chunks
        """
        if not self.vector_store:
            print("Vector store not initialized. Building index...")
            self.build_index()
            
        if self.vector_store:
            relevant_docs = self.vector_store.similarity_search(query, k=top_k)
            return relevant_docs
        else:
            return []
    
    def format_context_for_prompt(self, docs: List[Document]) -> str:
        """Format retrieved documents into a context string for the prompt."""
        if not docs:
            return ""
            
        context_parts = []
        for i, doc in enumerate(docs):
            source = doc.metadata.get("source", "Unknown")
            category = doc.metadata.get("category", "Unknown")
            context_parts.append(f"[CONTEXT {i+1}] From {category}:\n{doc.page_content}")
            
        return "\n\n".join(context_parts)
    
    def generate_response(self, user_query: str, system_prompt: str, location: str) -> Tuple[str, List[Dict[str, str]]]:
        """
        Generate a response using RAG.
        
        Args:
            user_query: User's question or request
            system_prompt: System prompt for the LLM
            location: User's location
            
        Returns:
            Tuple of (response text, sources list)
        """
        # Retrieve relevant context
        relevant_docs = self.retrieve_context(user_query)
        context_text = self.format_context_for_prompt(relevant_docs)
        
        # Create the augmented prompt with retrieved context
        if context_text:
            rag_system_prompt = f"""
{system_prompt}

You have access to the following information retrieved from official government resources.
Use this information to provide accurate, well-informed responses. Always cite your sources.

{context_text}
"""
        else:
            rag_system_prompt = system_prompt
            
        # Add location to the system message
        rag_system_prompt = f"{rag_system_prompt}\n\nCurrent user location: {location}"
        
        # Create the chat model
        chat_model = ChatOpenAI(
            api_key=self.openai_api_key, 
            model="gpt-4o-mini",
            temperature=0.7
        )
        
        # Create the prompt template
        prompt = ChatPromptTemplate.from_messages([
            ("system", rag_system_prompt),
            ("user", "{input}")
        ])
        
        # Create the chain and run it
        chain = prompt | chat_model
        response = chain.invoke({"input": user_query})
        
        # Extract sources
        sources = []
        if relevant_docs:
            for doc in relevant_docs:
                source = doc.metadata.get("source", "Unknown")
                category = doc.metadata.get("category", "Unknown")
                if any(s.get("source") == source for s in sources):
                    continue
                sources.append({
                    "source": source,
                    "category": category
                })
        
        return response.content, sources
