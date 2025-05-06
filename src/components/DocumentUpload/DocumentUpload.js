import React, { useState } from 'react';
import styled from 'styled-components';

const DocumentUploadContainer = styled.div`
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

const UploadArea = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border: 2px dashed #ccc;
  border-radius: 8px;
  padding: 2rem;
  background-color: #f9f9f9;
  transition: all 0.3s ease;
  
  &:hover {
    border-color: #0078d4;
    background-color: #f0f7ff;
  }
`;

const FileInput = styled.input`
  display: none;
`;

const UploadButton = styled.button`
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 0.75rem 1.5rem;
  font-size: 1rem;
  cursor: pointer;
  margin-top: 1rem;
  transition: background-color 0.3s;
  
  &:hover {
    background-color: #005a9e;
  }
  
  &:disabled {
    background-color: #ccc;
    cursor: not-allowed;
  }
`;

const DropText = styled.p`
  margin: 1rem 0;
  color: #666;
  text-align: center;
`;

const DocumentList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
`;

const DocumentItem = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem;
  background-color: #f9f9f9;
  border-radius: 4px;
  border-left: 4px solid #0078d4;
  
  @media (max-width: 768px) {
    flex-direction: column;
    align-items: flex-start;
    gap: 0.5rem;
  }
`;

const DocumentInfo = styled.div`
  flex: 1;
`;

const DocumentName = styled.div`
  font-weight: 500;
`;

const DocumentSize = styled.div`
  font-size: 0.875rem;
  color: #666;
`;

const DocumentStatus = styled.div`
  font-size: 0.875rem;
  font-weight: 500;
  padding: 0.25rem 0.75rem;
  border-radius: 12px;
  background-color: ${props => {
    switch(props.status) {
      case 'uploaded': return '#e6f7ff';
      case 'processing': return '#fff7e6';
      case 'completed': return '#e6f7ee';
      case 'error': return '#fff1f0';
      default: return '#f0f0f0';
    }
  }};
  color: ${props => {
    switch(props.status) {
      case 'uploaded': return '#0078d4';
      case 'processing': return '#fa8c16';
      case 'completed': return '#52c41a';
      case 'error': return '#f5222d';
      default: return '#666';
    }
  }};
`;

const DocumentUpload = () => {
  const [documents, setDocuments] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = React.createRef();

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    addFiles(files);
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const addFiles = (files) => {
    const newDocuments = files.map(file => ({
      id: Date.now() + Math.random().toString(36).substr(2, 9),
      name: file.name,
      size: formatFileSize(file.size),
      status: 'uploaded',
      file
    }));
    
    setDocuments([...documents, ...newDocuments]);
    
    // Simulate processing for demo purposes
    newDocuments.forEach(doc => {
      setTimeout(() => {
        setDocuments(prevDocs => 
          prevDocs.map(d => 
            d.id === doc.id ? { ...d, status: 'processing' } : d
          )
        );
        
        setTimeout(() => {
          setDocuments(prevDocs => 
            prevDocs.map(d => 
              d.id === doc.id ? { ...d, status: 'completed' } : d
            )
          );
        }, 3000);
      }, 1500);
    });
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const files = Array.from(e.dataTransfer.files);
      addFiles(files);
      e.dataTransfer.clearData();
    }
  };

  const triggerFileInput = () => {
    fileInputRef.current.click();
  };

  return (
    <DocumentUploadContainer>
      <Title>Document Upload</Title>
      
      <UploadArea 
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        style={{ borderColor: isDragging ? '#0078d4' : '#ccc', backgroundColor: isDragging ? '#f0f7ff' : '#f9f9f9' }}
      >
        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z" fill="#0078d4"/>
        </svg>
        
        <DropText>Drag & drop files here or</DropText>
        
        <FileInput 
          type="file" 
          ref={fileInputRef}
          onChange={handleFileChange}
          multiple
        />
        
        <UploadButton onClick={triggerFileInput}>
          Browse Files
        </UploadButton>
      </UploadArea>
      
      {documents.length > 0 && (
        <>
          <Title>Uploaded Documents</Title>
          <DocumentList>
            {documents.map(doc => (
              <DocumentItem key={doc.id}>
                <DocumentInfo>
                  <DocumentName>{doc.name}</DocumentName>
                  <DocumentSize>{doc.size}</DocumentSize>
                </DocumentInfo>
                <DocumentStatus status={doc.status}>
                  {doc.status.charAt(0).toUpperCase() + doc.status.slice(1)}
                </DocumentStatus>
              </DocumentItem>
            ))}
          </DocumentList>
        </>
      )}
    </DocumentUploadContainer>
  );
};

export default DocumentUpload;
