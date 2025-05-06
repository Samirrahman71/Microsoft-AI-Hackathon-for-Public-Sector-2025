import React, { useState, useRef, useEffect } from 'react';
import styled from 'styled-components';
import CAGHandler from '../../services/CAGHandler';

const ChatContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: calc(100vh - 120px);
  border-radius: 8px;
  background-color: white;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
  overflow: hidden;
`;

const ChatHeader = styled.div`
  background-color: #0078d4;
  color: white;
  padding: 1rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const ChatTitle = styled.div`
  font-weight: bold;
`;

const LanguageSelector = styled.select`
  background-color: transparent;
  color: white;
  border: 1px solid rgba(255, 255, 255, 0.3);
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.875rem;
  
  &:focus {
    outline: none;
  }
  
  option {
    background-color: #0078d4;
    color: white;
  }
`;

const MessagesContainer = styled.div`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  display: flex;
  flex-direction: column;
  gap: 1rem;
`;

const MessageBubble = styled.div`
  max-width: 75%;
  padding: 0.8rem 1rem;
  border-radius: 18px;
  background-color: ${props => props.isUser ? '#e7f5ff' : '#f0f0f0'};
  color: ${props => props.isUser ? '#0078d4' : '#333'};
  align-self: ${props => props.isUser ? 'flex-end' : 'flex-start'};
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  
  @media (max-width: 480px) {
    max-width: 85%;
  }
`;

const MessageTime = styled.div`
  font-size: 0.75rem;
  color: #666;
  margin-top: 0.3rem;
  text-align: ${props => props.isUser ? 'right' : 'left'};
`;

const InputArea = styled.form`
  display: flex;
  flex-direction: column;
  padding: 1rem;
  background-color: #f9f9f9;
  border-top: 1px solid #eee;
`;

const InputWrapper = styled.div`
  display: flex;
  width: 100%;
`;

const InputControls = styled.div`
  display: flex;
  justify-content: flex-end;
  margin-top: 0.5rem;
`;

const ModeButtons = styled.div`
  display: flex;
  gap: 0.5rem;
`;

const ModeButton = styled.button`
  background-color: ${props => props.active ? '#0078d4' : 'transparent'};
  color: ${props => props.active ? 'white' : '#666'};
  border: 1px solid ${props => props.active ? '#0078d4' : '#ddd'};
  border-radius: 4px;
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background-color: ${props => props.active ? '#005a9e' : '#f0f0f0'};
  }
`;

const MessageInput = styled.input`
  flex: 1;
  padding: 0.8rem 1rem;
  border: 1px solid #ddd;
  border-radius: 24px;
  outline: none;
  font-size: 1rem;
  
  &:focus {
    border-color: #0078d4;
  }
`;

const SendButton = styled.button`
  background-color: #0078d4;
  color: white;
  border: none;
  border-radius: 50%;
  width: 40px;
  height: 40px;
  margin-left: 0.5rem;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  
  &:hover {
    background-color: #005a9e;
  }
`;

const SourcesContainer = styled.div`
  margin-top: 0.25rem;
  font-size: 0.75rem;
  color: #666;
`;

const SourceItem = styled.a`
  color: #0078d4;
  text-decoration: none;
  margin-right: 0.5rem;
  
  &:hover {
    text-decoration: underline;
  }
`;

const ChatInterface = () => {
  const [messages, setMessages] = useState([
    { id: 1, text: "Hello! I am GovChat, your government assistant. How can I help you today?", isUser: false, time: "10:00 AM", sources: [] }
  ]);
  const [inputText, setInputText] = useState('');
  const [inputMode, setInputMode] = useState('text');
  const [language, setLanguage] = useState('en');
  const [isProcessing, setIsProcessing] = useState(false);
  const messagesEndRef = useRef(null);
  const cagHandler = useRef(new CAGHandler());

  useEffect(() => {
    scrollToBottom();
  }, [messages]);
  
  useEffect(() => {
    cagHandler.current.setLanguage(language);
    updatePlaceholders();
  }, [language]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  
  const updatePlaceholders = () => {
    // Placeholder text based on input mode and language
    const placeholders = {
      text: {
        en: "Type your message here...",
        es: "Escribe tu mensaje aquí...",
        fr: "Tapez votre message ici..."
      },
      voice: {
        en: "Click microphone to speak...",
        es: "Haz clic en el micrófono para hablar...",
        fr: "Cliquez sur le microphone pour parler..."
      },
      camera: {
        en: "Click camera to scan document...",
        es: "Haz clic en la cámara para escanear documento...",
        fr: "Cliquez sur l'appareil photo pour scanner un document..."
      }
    };
    
    // Return the appropriate placeholder
    return placeholders[inputMode][language] || placeholders[inputMode].en;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (inputText.trim() === '' || isProcessing) return;
    
    // Get current time
    const now = new Date();
    const hours = now.getHours() % 12 || 12;
    const minutes = now.getMinutes().toString().padStart(2, '0');
    const ampm = now.getHours() >= 12 ? 'PM' : 'AM';
    const timeString = `${hours}:${minutes} ${ampm}`;
    
    // Add user message
    const userMessage = {
      id: messages.length + 1,
      text: inputText,
      isUser: true,
      time: timeString,
      sources: []
    };
    
    setMessages([...messages, userMessage]);
    setInputText('');
    setIsProcessing(true);
    
    try {
      // Process the user input through CAG Handler
      const response = await cagHandler.current.processInput(inputText);
      
      // Create the bot response message
      const botResponse = {
        id: messages.length + 2,
        text: response.content,
        isUser: false,
        time: timeString,
        sources: response.sources || []
      };
      
      setMessages(prevMessages => [...prevMessages, botResponse]);
    } catch (error) {
      console.error('Error processing message:', error);
      
      // Add error message
      const errorResponse = {
        id: messages.length + 2,
        text: "I'm sorry, but I encountered an error processing your request. Please try again later.",
        isUser: false,
        time: timeString,
        sources: []
      };
      
      setMessages(prevMessages => [...prevMessages, errorResponse]);
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatMessageText = (text) => {
    return text
      // Convert links
      .replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer">$1</a>')
      // Convert bold text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      // Convert numbered lists (basic support)
      .replace(/^(\d+\.\s)(.*)$/gm, '<li>$2</li>')
      // Convert bullet lists (basic support)
      .replace(/^(\*\s)(.*)$/gm, '<li>$2</li>')
      // Handle paragraphs
      .split('\n\n')
      .map(para => `<p>${para}</p>`)
      .join('');
  };
  
  const handleInputModeChange = (mode) => {
    setInputMode(mode);
  };

  return (
    <ChatContainer>
      <ChatHeader>
        <ChatTitle>GovChat Assistant</ChatTitle>
        <LanguageSelector value={language} onChange={(e) => setLanguage(e.target.value)}>
          <option value="en">English</option>
          <option value="es">Español</option>
          <option value="fr">Français</option>
        </LanguageSelector>
      </ChatHeader>
      <MessagesContainer>
        {messages.map((message) => (
          <div key={message.id}>
            <MessageBubble isUser={message.isUser}>
              <div dangerouslySetInnerHTML={{ __html: formatMessageText(message.text) }} />
              {message.sources && message.sources.length > 0 && (
                <SourcesContainer>
                  Sources: 
                  {message.sources.map((source, index) => (
                    <SourceItem key={index} href={source} target="_blank" rel="noopener noreferrer">
                      [{index + 1}]
                    </SourceItem>
                  ))}
                </SourcesContainer>
              )}
            </MessageBubble>
            <MessageTime isUser={message.isUser}>{message.time}</MessageTime>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </MessagesContainer>
      <InputArea onSubmit={handleSubmit}>
        <InputWrapper>
          <MessageInput
            type="text"
            placeholder={updatePlaceholders()}
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            disabled={isProcessing || inputMode !== 'text'}
          />
          <SendButton type="submit" disabled={isProcessing}>
            {isProcessing ? (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20Z" fill="white" opacity="0.5"/>
                <path d="M12 4C7.59 4 4 7.59 4 12C4 16.41 7.59 20 12 20C16.41 20 20 16.41 20 12C20 7.59 16.41 4 12 4ZM16.59 16.59L12 12V6C14.76 6 17 8.24 17 11V12H16.59Z" fill="white"/>
              </svg>
            ) : (
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path d="M2.01 21L23 12 2.01 3 2 10l15 2-15 2z" fill="white"/>
              </svg>
            )}
          </SendButton>
        </InputWrapper>
        
        <InputControls>
          <ModeButtons>
            <ModeButton 
              active={inputMode === 'text'} 
              onClick={() => handleInputModeChange('text')}>
              <i className="fas fa-keyboard"></i>
            </ModeButton>
            <ModeButton 
              active={inputMode === 'voice'} 
              onClick={() => handleInputModeChange('voice')}>
              <i className="fas fa-microphone"></i>
            </ModeButton>
            <ModeButton 
              active={inputMode === 'camera'} 
              onClick={() => handleInputModeChange('camera')}>
              <i className="fas fa-camera"></i>
            </ModeButton>
          </ModeButtons>
        </InputControls>
      </InputArea>
    </ChatContainer>
  );
};

export default ChatInterface;
