import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, NavLink as RouterNavLink } from 'react-router-dom';
import styled from 'styled-components';
import ChatInterface from './components/Chat/ChatInterface';
import DocumentUpload from './components/DocumentUpload/DocumentUpload';
import TaskList from './components/TaskList/TaskList';
import ResourceDashboard from './components/Dashboard/ResourceDashboard';
import AzureAIDocumentProcessor from './components/AzureIntegration/AzureAIDocumentProcessor';
import './styles/App.css';

const AppContainer = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  font-family: 'Roboto', sans-serif;
`;

const Header = styled.header`
  background-color: #0078d4; /* Azure blue */
  color: white;
  padding: 1rem;
  text-align: center;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  display: flex;
  justify-content: space-between;
  align-items: center;
`;

const Logo = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
  
  h1 {
    margin: 0;
    
    @media (max-width: 480px) {
      font-size: 1.5rem;
    }
  }
`;

const HeaderControls = styled.div`
  display: flex;
  align-items: center;
  gap: 1rem;
`;

const UserAvatar = styled.div`
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background-color: #005a9e;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: bold;
  cursor: pointer;
`;

const NavContainer = styled.div`
  display: flex;
  background-color: #f3f2f1;
  border-bottom: 1px solid #e1dfdd;
  
  @media (max-width: 768px) {
    flex-direction: column;
  }
`;

const NavBar = styled.nav`
  display: flex;
  padding: 0;
  flex-wrap: wrap;
  
  @media (max-width: 768px) {
    flex-direction: column;
    width: 100%;
  }
`;

const NavItem = styled(RouterNavLink)`
  color: #323130;
  text-decoration: none;
  padding: 0.75rem 1.25rem;
  transition: all 0.2s;
  border-bottom: 2px solid transparent;
  
  &:hover {
    background-color: #e1dfdd;
  }
  
  &.active {
    color: #0078d4;
    border-bottom: 2px solid #0078d4;
    font-weight: 500;
  }
  
  @media (max-width: 768px) {
    padding: 0.75rem 1rem;
    border-bottom: none;
    border-left: 2px solid transparent;
    
    &.active {
      border-bottom: none;
      border-left: 2px solid #0078d4;
    }
  }
`;

const NavGroup = styled.div`
  border-bottom: 1px solid #e1dfdd;
  margin-bottom: 0.5rem;
  padding: 0.5rem 1rem;
  font-weight: 500;
  color: #605e5c;
  
  @media (min-width: 769px) {
    display: none;
  }
`;

const ContentArea = styled.main`
  flex: 1;
  padding: 1rem;
  overflow-y: auto;
  background-color: #f9f9f9;
`;

const MobileMenuButton = styled.button`
  display: none;
  background: none;
  border: none;
  color: white;
  font-size: 1.5rem;
  cursor: pointer;
  
  @media (max-width: 768px) {
    display: block;
  }
`;

function App() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };
  
  return (
    <Router>
      <AppContainer>
        <Header>
          <Logo>
            <img src="data:image/svg+xml;charset=utf-8,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 23 23' width='32' height='32'%3E%3Cpath fill='%23fff' d='M11.5 22.994c6.33 0 11.5-5.172 11.5-11.5 0-6.33-5.17-11.5-11.5-11.5S0 5.164 0 11.494c0 6.328 5.17 11.5 11.5 11.5z'/%3E%3Cpath fill='%230078d4' d='M11.5 1.494c5.521 0 10 4.478 10 10 0 5.52-4.479 10-10 10s-10-4.48-10-10c0-5.522 4.479-10 10-10z'/%3E%3Cpath fill='%23fff' d='M15 10.494v-3h-7v3H6v2h2v3h7v-3h2v-2h-2zm-5 0v-1h3v1h1v1h-1v1h-3v-1H9v-1h1z'/%3E%3C/svg%3E" alt="Azure Logo" width="32" height="32" />
            <h1>Azure Solutions</h1>
          </Logo>
          
          <HeaderControls>
            <MobileMenuButton onClick={toggleMobileMenu}>
              ☰
            </MobileMenuButton>
            <UserAvatar>SE</UserAvatar>
          </HeaderControls>
        </Header>
        
        <NavContainer style={{ display: mobileMenuOpen ? 'flex' : 'flex' }}>
          <NavBar style={{ display: mobileMenuOpen || window.innerWidth > 768 ? 'flex' : 'none' }}>
            <NavGroup>Azure Resources</NavGroup>
            <NavItem to="/dashboard" onClick={() => setMobileMenuOpen(false)}>Resource Dashboard</NavItem>
            <NavItem to="/ai-processing" onClick={() => setMobileMenuOpen(false)}>AI Document Processing</NavItem>
            
            <NavGroup>Application</NavGroup>
            <NavItem to="/" end onClick={() => setMobileMenuOpen(false)}>Chat Interface</NavItem>
            <NavItem to="/documents" onClick={() => setMobileMenuOpen(false)}>Document Upload</NavItem>
            <NavItem to="/tasks" onClick={() => setMobileMenuOpen(false)}>Task Management</NavItem>
          </NavBar>
        </NavContainer>
        
        <ContentArea>
          <Routes>
            <Route path="/" element={<ChatInterface />} />
            <Route path="/documents" element={<DocumentUpload />} />
            <Route path="/tasks" element={<TaskList />} />
            <Route path="/dashboard" element={<ResourceDashboard />} />
            <Route path="/ai-processing" element={<AzureAIDocumentProcessor />} />
          </Routes>
        </ContentArea>
      </AppContainer>
    </Router>
  );
}

export default App;
