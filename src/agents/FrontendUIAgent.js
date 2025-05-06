/**
 * FrontendUIAgent.js
 * Builds user interface with React components
 */
const React = require('react');

class FrontendUIAgent {
  constructor() {
    this.componentLibrary = {
      // Core UI components
      Chat: this.getChatComponent(),
      DocumentUpload: this.getDocumentUploadComponent(),
      TaskTracker: this.getTaskTrackerComponent(),
      AppointmentScheduler: this.getAppointmentSchedulerComponent(),
      
      // Mobile-specific components
      MobileNavigation: this.getMobileNavigationComponent(),
      MobileDocumentScanner: this.getMobileDocumentScannerComponent(),
      
      // UI utilities
      Notifications: this.getNotificationsComponent(),
      LanguageSelector: this.getLanguageSelectorComponent()
    };
  }

  /**
   * Get component configuration for a specific component type
   * @param {string} componentType - Type of component
   * @returns {Object} Component configuration
   */
  getComponent(componentType) {
    if (this.componentLibrary[componentType]) {
      return {
        success: true,
        component: this.componentLibrary[componentType]
      };
    }
    
    return {
      success: false,
      message: `Component type "${componentType}" not found`,
      availableComponents: Object.keys(this.componentLibrary)
    };
  }

  /**
   * Generate a complete UI configuration
   * @param {boolean} includeMobile - Whether to include mobile components
   * @returns {Object} Complete UI configuration
   */
  generateUIConfiguration(includeMobile = false) {
    // Base UI components
    const uiConfig = {
      layout: {
        desktop: {
          header: {
            type: 'header',
            title: 'GovFlow AI',
            components: ['LanguageSelector']
          },
          main: {
            type: 'split-pane',
            leftPane: {
              components: ['Chat']
            },
            rightPane: {
              components: ['TaskTracker', 'DocumentUpload']
            }
          }
        }
      },
      theme: {
        colors: {
          primary: '#0078D4',
          secondary: '#2B88D8',
          accent: '#0063B1',
          background: '#F5F5F5',
          text: '#333333',
          border: '#DDDDDD'
        },
        fonts: {
          main: "'Segoe UI', 'Roboto', sans-serif",
          heading: "'Segoe UI Light', 'Roboto Light', sans-serif"
        },
        spacing: {
          small: '8px',
          medium: '16px',
          large: '24px'
        },
        borderRadius: '4px',
        boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
      },
      components: this.componentLibrary
    };
    
    // Add mobile layout if requested
    if (includeMobile) {
      uiConfig.layout.mobile = {
        header: {
          type: 'mobile-header',
          title: 'GovFlow AI',
          components: ['MobileNavigation']
        },
        screens: {
          chat: {
            components: ['Chat']
          },
          tasks: {
            components: ['TaskTracker']
          },
          documents: {
            components: ['MobileDocumentScanner', 'DocumentUpload']
          },
          appointments: {
            components: ['AppointmentScheduler']
          }
        }
      };
    }
    
    return {
      success: true,
      uiConfig
    };
  }

  /**
   * Get chat component configuration
   * @returns {Object} Chat component configuration
   */
  getChatComponent() {
    return {
      type: 'component',
      name: 'Chat',
      props: {
        placeholderText: 'Ask a question about government services...',
        initialMessages: [
          {
            role: 'assistant',
            content: 'Hello! I\'m your government services assistant. How can I help you today?'
          }
        ],
        inputOptions: [
          {
            id: 'text',
            type: 'text',
            label: 'Text',
            icon: 'keyboard'
          },
          {
            id: 'voice',
            type: 'voice',
            label: 'Voice',
            icon: 'microphone'
          }
        ],
        messageActions: [
          {
            id: 'copy',
            label: 'Copy',
            icon: 'copy'
          },
          {
            id: 'save',
            label: 'Save',
            icon: 'save'
          }
        ]
      },
      styles: {
        container: {
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        },
        messagesContainer: {
          flex: 1,
          overflow: 'auto',
          padding: '16px'
        },
        inputContainer: {
          padding: '16px',
          borderTop: '1px solid #DDDDDD'
        }
      },
      events: [
        'onSendMessage',
        'onInputOptionChange',
        'onMessageAction'
      ]
    };
  }

  /**
   * Get document upload component configuration
   * @returns {Object} Document upload component configuration
   */
  getDocumentUploadComponent() {
    return {
      type: 'component',
      name: 'DocumentUpload',
      props: {
        title: 'Upload Government Document',
        description: 'Upload a document to get assistance understanding it',
        acceptedFormats: ['.pdf', '.jpg', '.jpeg', '.png'],
        maxFileSize: 10485760, // 10 MB
        dropzoneText: 'Drag and drop a document here, or click to select a file'
      },
      styles: {
        container: {
          padding: '16px',
          borderRadius: '4px',
          border: '1px dashed #DDDDDD',
          margin: '16px'
        },
        uploadIndicator: {
          marginTop: '16px'
        }
      },
      events: [
        'onFileSelect',
        'onUploadProgress',
        'onUploadComplete',
        'onUploadError'
      ]
    };
  }

  /**
   * Get task tracker component configuration
   * @returns {Object} Task tracker component configuration
   */
  getTaskTrackerComponent() {
    return {
      type: 'component',
      name: 'TaskTracker',
      props: {
        title: 'Your Progress',
        showCompletedTasks: true,
        collapsibleSteps: true,
        enableTaskEditing: true
      },
      styles: {
        container: {
          padding: '16px',
          margin: '16px',
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        },
        progressBar: {
          height: '8px',
          backgroundColor: '#E1E1E1',
          borderRadius: '4px',
          marginBottom: '16px'
        },
        progressFill: {
          height: '100%',
          backgroundColor: '#0078D4',
          borderRadius: '4px'
        },
        step: {
          marginBottom: '16px'
        },
        task: {
          display: 'flex',
          alignItems: 'center',
          marginBottom: '8px'
        }
      },
      events: [
        'onTaskComplete',
        'onTaskEdit',
        'onStepComplete',
        'onStepCollapse'
      ]
    };
  }

  /**
   * Get appointment scheduler component configuration
   * @returns {Object} Appointment scheduler component configuration
   */
  getAppointmentSchedulerComponent() {
    return {
      type: 'component',
      name: 'AppointmentScheduler',
      props: {
        title: 'Schedule an Appointment',
        appointmentTypes: [
          { id: 'dmv', label: 'DMV Services' },
          { id: 'tax', label: 'Tax Assistance' },
          { id: 'benefits', label: 'Benefits Consultation' },
          { id: 'immigration', label: 'Immigration Services' },
          { id: 'housing', label: 'Housing Assistance' }
        ],
        locations: [
          { id: 'main-office', label: 'Main Office' },
          { id: 'satellite-office', label: 'Satellite Office' },
          { id: 'community-center', label: 'Community Center' }
        ],
        timeSlotInterval: 30, // minutes
        minDaysInAdvance: 1,
        maxDaysInAdvance: 30
      },
      styles: {
        container: {
          padding: '16px',
          margin: '16px',
          backgroundColor: 'white',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)'
        },
        calendar: {
          marginTop: '16px',
          border: '1px solid #DDDDDD',
          borderRadius: '4px'
        },
        timeSlot: {
          cursor: 'pointer',
          padding: '8px',
          margin: '4px',
          border: '1px solid #DDDDDD',
          borderRadius: '4px',
          textAlign: 'center'
        },
        selectedTimeSlot: {
          backgroundColor: '#0078D4',
          color: 'white',
          border: '1px solid #0063B1'
        }
      },
      events: [
        'onAppointmentTypeChange',
        'onLocationChange',
        'onDateSelect',
        'onTimeSlotSelect',
        'onAppointmentBook',
        'onAppointmentCancel'
      ]
    };
  }

  /**
   * Get mobile navigation component configuration
   * @returns {Object} Mobile navigation component configuration
   */
  getMobileNavigationComponent() {
    return {
      type: 'component',
      name: 'MobileNavigation',
      props: {
        items: [
          { id: 'chat', label: 'Chat', icon: 'chat', screen: 'chat' },
          { id: 'tasks', label: 'Tasks', icon: 'tasks', screen: 'tasks' },
          { id: 'documents', label: 'Documents', icon: 'document', screen: 'documents' },
          { id: 'appointments', label: 'Appointments', icon: 'calendar', screen: 'appointments' }
        ],
        activeItem: 'chat'
      },
      styles: {
        container: {
          display: 'flex',
          justifyContent: 'space-around',
          position: 'fixed',
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: 'white',
          borderTop: '1px solid #DDDDDD',
          padding: '8px'
        },
        item: {
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          padding: '8px',
          fontSize: '12px'
        },
        activeItem: {
          color: '#0078D4'
        }
      },
      events: [
        'onItemSelect'
      ]
    };
  }

  /**
   * Get mobile document scanner component configuration
   * @returns {Object} Mobile document scanner component configuration
   */
  getMobileDocumentScannerComponent() {
    return {
      type: 'component',
      name: 'MobileDocumentScanner',
      props: {
        cameraFacing: 'environment',
        flashEnabled: false,
        captureButtonText: 'Capture Document',
        guidanceText: 'Position document within the frame',
        enableAutoCapture: true,
        captureDelay: 2000 // ms
      },
      styles: {
        container: {
          position: 'relative',
          width: '100%',
          height: '100%'
        },
        cameraView: {
          width: '100%',
          height: '100%',
          objectFit: 'cover'
        },
        documentFrame: {
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          width: '80%',
          height: '60%',
          border: '2px dashed white',
          borderRadius: '8px'
        },
        captureButton: {
          position: 'absolute',
          bottom: '16px',
          left: '50%',
          transform: 'translateX(-50%)',
          padding: '12px 24px',
          backgroundColor: '#0078D4',
          color: 'white',
          borderRadius: '24px',
          border: 'none'
        }
      },
      events: [
        'onCameraReady',
        'onPictureTaken',
        'onDocumentDetected',
        'onCameraError'
      ]
    };
  }

  /**
   * Get notifications component configuration
   * @returns {Object} Notifications component configuration
   */
  getNotificationsComponent() {
    return {
      type: 'component',
      name: 'Notifications',
      props: {
        position: 'top-right',
        autoHideDuration: 5000,
        maxNotifications: 3
      },
      styles: {
        container: {
          position: 'fixed',
          top: '16px',
          right: '16px',
          zIndex: 1000
        },
        notification: {
          padding: '16px',
          marginBottom: '8px',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.2)',
          backgroundColor: 'white',
          display: 'flex',
          alignItems: 'center'
        },
        successNotification: {
          borderLeft: '4px solid #4CAF50'
        },
        errorNotification: {
          borderLeft: '4px solid #F44336'
        },
        infoNotification: {
          borderLeft: '4px solid #2196F3'
        },
        warningNotification: {
          borderLeft: '4px solid #FF9800'
        }
      },
      events: [
        'onNotificationShow',
        'onNotificationClose',
        'onNotificationAction'
      ]
    };
  }

  /**
   * Get language selector component configuration
   * @returns {Object} Language selector component configuration
   */
  getLanguageSelectorComponent() {
    return {
      type: 'component',
      name: 'LanguageSelector',
      props: {
        languages: [
          { id: 'en', label: 'English', flag: '🇺🇸' },
          { id: 'es', label: 'Español', flag: '🇪🇸' },
          { id: 'fr', label: 'Français', flag: '🇫🇷' },
          { id: 'zh', label: '中文', flag: '🇨🇳' },
          { id: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
          { id: 'ko', label: '한국어', flag: '🇰🇷' }
        ],
        defaultLanguage: 'en',
        displayStyle: 'dropdown' // 'dropdown' or 'flags'
      },
      styles: {
        container: {
          position: 'relative'
        },
        selector: {
          padding: '8px',
          border: '1px solid #DDDDDD',
          borderRadius: '4px',
          backgroundColor: 'white',
          cursor: 'pointer'
        },
        dropdown: {
          position: 'absolute',
          top: '100%',
          right: 0,
          backgroundColor: 'white',
          border: '1px solid #DDDDDD',
          borderRadius: '4px',
          boxShadow: '0 2px 4px rgba(0, 0, 0, 0.1)',
          zIndex: 100
        },
        option: {
          padding: '8px 16px',
          cursor: 'pointer',
          whiteSpace: 'nowrap'
        }
      },
      events: [
        'onLanguageChange'
      ]
    };
  }

  /**
   * Generate React component code from configuration
   * @param {string} componentType - Type of component to generate
   * @returns {Object} Generated component code
   */
  generateComponentCode(componentType) {
    const componentConfig = this.getComponent(componentType);
    
    if (!componentConfig.success) {
      return componentConfig;
    }
    
    const config = componentConfig.component;
    
    // Generate React component code
    const componentCode = `
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import styled from 'styled-components';

// Styled components
const Container = styled.div\`
  ${Object.entries(config.styles.container).map(([property, value]) => `${property}: ${value};`).join('\n  ')}
\`;

/**
 * ${config.name} Component
 */
const ${config.name} = (props) => {
  // State initialization
  ${config.events.includes('onSendMessage') ? "const [inputValue, setInputValue] = useState('');" : ''}
  ${config.events.includes('onTaskComplete') ? "const [tasks, setTasks] = useState([]);" : ''}
  ${config.events.includes('onAppointmentTypeChange') ? "const [selectedType, setSelectedType] = useState(null);" : ''}
  ${config.events.includes('onLanguageChange') ? "const [currentLanguage, setCurrentLanguage] = useState(props.defaultLanguage || 'en');" : ''}
  ${config.events.includes('onFileSelect') ? "const [selectedFile, setSelectedFile] = useState(null);" : ''}
  ${config.events.includes('onUploadProgress') ? "const [uploadProgress, setUploadProgress] = useState(0);" : ''}
  
  // Component implementation
  return (
    <Container>
      <h2>${config.props.title || config.name}</h2>
      ${config.props.description ? `<p>${config.props.description}</p>` : ''}
      ${componentType === 'Chat' ? `
      <div className="messages-container">
        {props.messages.map((message, index) => (
          <div key={index} className={\`message \${message.role}\`}>
            <div className="message-content">{message.content}</div>
          </div>
        ))}
      </div>
      <div className="input-container">
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder={props.placeholderText || 'Type a message...'}
        />
        <button onClick={() => {
          if (inputValue.trim()) {
            props.onSendMessage?.(inputValue);
            setInputValue('');
          }
        }}>
          Send
        </button>
      </div>
      ` : ''}
      ${componentType === 'DocumentUpload' ? `
      <div 
        className="dropzone"
        onClick={() => document.getElementById('file-input').click()}
        onDragOver={(e) => e.preventDefault()}
        onDrop={(e) => {
          e.preventDefault();
          const file = e.dataTransfer.files[0];
          if (file) {
            setSelectedFile(file);
            props.onFileSelect?.(file);
          }
        }}
      >
        {selectedFile ? selectedFile.name : props.dropzoneText}
      </div>
      <input
        id="file-input"
        type="file"
        style={{ display: 'none' }}
        accept={props.acceptedFormats?.join(',')}
        onChange={(e) => {
          const file = e.target.files[0];
          if (file) {
            setSelectedFile(file);
            props.onFileSelect?.(file);
          }
        }}
      />
      {uploadProgress > 0 && (
        <div className="progress-bar">
          <div className="progress" style={{ width: \`\${uploadProgress}%\` }}></div>
        </div>
      )}
      ` : ''}
      ${componentType === 'TaskTracker' ? `
      <div className="progress-container">
        <div className="progress-bar">
          <div 
            className="progress-fill" 
            style={{ width: \`\${props.progress || 0}%\` }}
          ></div>
        </div>
        <div className="progress-text">{props.progress || 0}% Complete</div>
      </div>
      <div className="steps-container">
        {props.steps?.map((step, stepIndex) => (
          <div 
            key={step.id} 
            className={\`step \${step.status}\`}
          >
            <div 
              className="step-header"
              onClick={() => props.onStepCollapse?.(step.id)}
            >
              <div className="step-title">{step.title}</div>
              <div className="step-progress">{step.progress}%</div>
            </div>
            <div className="step-tasks">
              {step.tasks?.map(task => (
                <div key={task.id} className="task">
                  <input
                    type="checkbox"
                    checked={task.completed}
                    onChange={() => props.onTaskComplete?.(step.id, task.id, !task.completed)}
                  />
                  <span>{task.title}</span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      ` : ''}
    </Container>
  );
};

${config.name}.propTypes = {
  ${Object.entries(config.props).map(([prop, value]) => {
    if (Array.isArray(value)) {
      return `${prop}: PropTypes.array`;
    } else if (typeof value === 'string') {
      return `${prop}: PropTypes.string`;
    } else if (typeof value === 'number') {
      return `${prop}: PropTypes.number`;
    } else if (typeof value === 'boolean') {
      return `${prop}: PropTypes.bool`;
    } else {
      return `${prop}: PropTypes.any`;
    }
  }).join(',\n  ')}
};

export default ${config.name};
`;
    
    return {
      success: true,
      componentCode
    };
  }

  /**
   * Generate a full React application with all components
   */
  generateFullApplication() {
    return {
      success: true,
      message: 'Application structure generated',
      appStructure: {
        'src': {
          'components': {
            'Chat.js': this.generateComponentCode('Chat').componentCode,
            'DocumentUpload.js': this.generateComponentCode('DocumentUpload').componentCode,
            'TaskTracker.js': this.generateComponentCode('TaskTracker').componentCode,
            'AppointmentScheduler.js': this.generateComponentCode('AppointmentScheduler').componentCode,
            'LanguageSelector.js': this.generateComponentCode('LanguageSelector').componentCode,
            'Notifications.js': this.generateComponentCode('Notifications').componentCode
          },
          'pages': {
            'Home.js': '// Main home page component',
            'Documents.js': '// Document processing page',
            'Appointments.js': '// Appointment scheduling page',
            'Tasks.js': '// Task tracking page'
          },
          'services': {
            'api.js': '// API service for backend communication',
            'storage.js': '// Local storage service',
            'auth.js': '// Authentication service'
          },
          'context': {
            'AppContext.js': '// Global application context',
            'TaskContext.js': '// Task management context',
            'UserContext.js': '// User information context',
            'NotificationContext.js': '// Notifications context'
          },
          'App.js': '// Main App component',
          'index.js': '// Application entry point'
        },
        'public': {
          'index.html': '<!-- Main HTML file -->',
          'assets': {
            'images': {
              'logo.svg': '<!-- App logo -->',
              'icons': '<!-- UI icons directory -->'
            }
          }
        }
      }
    };
  }
}

module.exports = FrontendUIAgent;
