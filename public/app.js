// GovChat Application JavaScript

document.addEventListener('DOMContentLoaded', function() {
  // Navigation functionality
  initNavigation();
  
  // Chat functionality
  initChat();
  
  // Document upload functionality
  initDocumentUpload();
  
  // Task tracker functionality
  initTaskTracker();
  
  // Appointment scheduler functionality
  initAppointmentScheduler();
  
  // Mobile menu handling
  initMobileMenu();
});

// Initialize navigation
function initNavigation() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      this.classList.add('active');
      
      // Get the target section id from the href
      const targetId = this.getAttribute('href');
      
      // Scroll to the target section
      document.querySelector(targetId).scrollIntoView({ 
        behavior: 'smooth' 
      });
      
      e.preventDefault();
    });
  });
  
  // Set active nav link based on scroll position
  window.addEventListener('scroll', function() {
    const scrollPosition = window.scrollY;
    
    // Get all sections
    const sections = document.querySelectorAll('section[id]');
    
    sections.forEach(section => {
      const sectionTop = section.offsetTop - 100;
      const sectionHeight = section.offsetHeight;
      const sectionId = '#' + section.getAttribute('id');
      
      if (scrollPosition >= sectionTop && scrollPosition < sectionTop + sectionHeight) {
        // Remove active class from all links
        navLinks.forEach(link => link.classList.remove('active'));
        
        // Add active class to current section link
        document.querySelector(`.nav-link[href="${sectionId}"]`).classList.add('active');
      }
    });
  });
}

// Initialize chat
function initChat() {
  const chatInput = document.getElementById('chat-input');
  const sendButton = document.getElementById('send-button');
  const chatMessages = document.getElementById('chat-messages');
  const inputOptions = document.querySelectorAll('.input-option');
  
  if (!chatInput || !sendButton || !chatMessages) return;
  
  sendButton.addEventListener('click', function() {
    const message = chatInput.value.trim();
    if (message) {
      addMessage(message, 'user');
      chatInput.value = '';
      
      // Simulate AI response after a short delay
      setTimeout(() => {
        let response;
        
        if (message.toLowerCase().includes('move') || message.toLowerCase().includes('moving')) {
          response = "I can help you with your move! When you move to a new location, you'll need to update your address with several government agencies:\n\n1. USPS Change of Address form\n2. DMV for driver's license and vehicle registration\n3. Voter registration\n4. IRS address change\n\nI've added a Moving Checklist to your Task Tracker to help you keep track of everything.";
          
          // Auto-update the task tracker with a moving checklist
          createMovingTaskList();
        } else if (message.toLowerCase().includes('benefits') || message.toLowerCase().includes('snap') || message.toLowerCase().includes('assistance')) {
          response = "To apply for government benefits, you'll need to gather several documents:\n\n• Identification (driver's license, passport)\n• Proof of income (pay stubs, tax returns)\n• Proof of residence (utility bills, lease)\n• Social Security numbers for all household members\n\nWould you like me to help you find the specific application for your state?";
          
          // Auto-update the task tracker with a benefits checklist
          createBenefitsTaskList();
        } else if (message.toLowerCase().includes('appointment') || message.toLowerCase().includes('schedule')) {
          response = "I can help you schedule an appointment with a government office. Please select the type of appointment you need in the scheduler panel, then choose a location, date, and time. Once you've selected a time slot, click 'Book Appointment' to confirm.";
          
          // Scroll to appointment section
          document.querySelector('#appointments').scrollIntoView({ behavior: 'smooth' });
        } else if (message.toLowerCase().includes('document') || message.toLowerCase().includes('form')) {
          response = "You can upload government documents for analysis using the Document Processing panel. I can help explain the content, extract important information, and suggest next steps based on the document type.";
          
          // Scroll to documents section
          document.querySelector('#documents').scrollIntoView({ behavior: 'smooth' });
        } else {
          response = "I'm here to help you navigate government services and processes. You can ask me about:\n\n• Moving to a new location\n• Applying for benefits or assistance\n• Understanding government documents\n• Scheduling appointments with government offices\n\nWhat specifically can I help you with today?";
        }
        
        addMessage(response, 'assistant');
      }, 1000);
    }
  });
  
  chatInput.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') {
      sendButton.click();
    }
  });
  
  inputOptions.forEach(option => {
    option.addEventListener('click', function() {
      inputOptions.forEach(opt => opt.classList.remove('active'));
      this.classList.add('active');
      
      const optionType = this.getAttribute('data-option');
      if (optionType === 'voice') {
        chatInput.placeholder = 'Click microphone to speak...';
      } else if (optionType === 'camera') {
        chatInput.placeholder = 'Click camera to scan document...';
      } else {
        chatInput.placeholder = 'Ask a question about government services...';
      }
    });
  });
}

// Add message to chat
function addMessage(content, role) {
  const chatMessages = document.getElementById('chat-messages');
  if (!chatMessages) return;
  
  const messageDiv = document.createElement('div');
  messageDiv.className = `message ${role}`;
  
  const contentDiv = document.createElement('div');
  contentDiv.className = 'message-content';
  contentDiv.innerText = content;
  
  messageDiv.appendChild(contentDiv);
  chatMessages.appendChild(messageDiv);
  
  // Scroll to bottom
  chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initialize document upload
function initDocumentUpload() {
  const dropzone = document.getElementById('document-dropzone');
  const fileInfo = document.getElementById('file-info');
  const removeFileButton = document.getElementById('remove-file');
  const analyzeFileButton = document.getElementById('analyze-file');
  
  if (!dropzone || !fileInfo) return;
  
  dropzone.addEventListener('click', function() {
    // Simulate file selection
    showFileInfo();
  });
  
  if (removeFileButton) {
    removeFileButton.addEventListener('click', function() {
      hideFileInfo();
    });
  }
  
  if (analyzeFileButton) {
    analyzeFileButton.addEventListener('click', function() {
      // Simulate analyzing document
      addMessage("I've uploaded a SNAP approval letter for analysis.", 'user');
      
      setTimeout(() => {
        const response = "I've analyzed your SNAP (Supplemental Nutrition Assistance Program) approval letter. Here's what I found:\n\n• Your application has been APPROVED\n• Monthly benefit amount: $250\n• Benefit period: 05/01/2025 to 10/31/2025\n• Next recertification date: 09/15/2025\n\nYour benefits will be loaded onto your EBT card within 3 business days. I've added a reminder to your Task Tracker for your recertification deadline.";
        addMessage(response, 'assistant');
        
        // Create a benefits task list
        createBenefitsTaskList(true);
      }, 2000);
    });
  }
  
  function showFileInfo() {
    dropzone.style.display = 'none';
    fileInfo.style.display = 'flex';
  }
  
  function hideFileInfo() {
    dropzone.style.display = 'block';
    fileInfo.style.display = 'none';
  }
}

// Initialize task tracker
function initTaskTracker() {
  const stepHeaders = document.querySelectorAll('.step-header');
  const taskCheckboxes = document.querySelectorAll('.task-checkbox');
  
  stepHeaders.forEach(header => {
    header.addEventListener('click', function() {
      const content = this.nextElementSibling;
      content.style.display = content.style.display === 'none' ? 'block' : 'none';
    });
  });
  
  taskCheckboxes.forEach(checkbox => {
    checkbox.addEventListener('click', function() {
      this.classList.toggle('checked');
      if (this.classList.contains('checked')) {
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check';
        this.appendChild(checkIcon);
      } else {
        this.innerHTML = '';
      }
      
      updateProgress();
    });
  });
}

// Update progress in task tracker
function updateProgress() {
  const taskCheckboxes = document.querySelectorAll('.task-checkbox');
  const progressFill = document.querySelector('.progress-fill');
  const progressText = document.querySelector('.progress-text');
  
  if (!progressFill || !progressText) return;
  
  const totalTasks = taskCheckboxes.length;
  const completedTasks = document.querySelectorAll('.task-checkbox.checked').length;
  const progressPercent = Math.round((completedTasks / totalTasks) * 100);
  
  progressFill.style.width = `${progressPercent}%`;
  progressText.textContent = `${progressPercent}% Complete`;
}

// Initialize appointment scheduler
function initAppointmentScheduler() {
  const timeSlots = document.querySelectorAll('.time-slot');
  const appointmentType = document.getElementById('appointment-type');
  const appointmentLocation = document.getElementById('appointment-location');
  const appointmentDate = document.getElementById('appointment-date');
  const bookButton = document.querySelector('.appointment-scheduler .button');
  
  timeSlots.forEach(slot => {
    slot.addEventListener('click', function() {
      timeSlots.forEach(s => s.classList.remove('selected'));
      this.classList.add('selected');
    });
  });
  
  if (bookButton) {
    bookButton.addEventListener('click', function() {
      if (!appointmentType || !appointmentLocation || !appointmentDate) return;
      
      const type = appointmentType.value;
      const location = appointmentLocation.value;
      const date = appointmentDate.value;
      const selectedSlot = document.querySelector('.time-slot.selected');
      
      if (!type || !location || !date || !selectedSlot) {
        alert('Please select all appointment details');
        return;
      }
      
      addMessage(`I'd like to book a ${type} appointment at the ${location} on ${date} at ${selectedSlot.textContent}.`, 'user');
      
      setTimeout(() => {
        const response = `Your ${type} appointment has been scheduled for ${date} at ${selectedSlot.textContent} at the ${location}. You'll receive an email confirmation shortly. I've added this to your Task Tracker.`;
        addMessage(response, 'assistant');
        
        // Create an appointment task list
        createAppointmentTaskList(type, location, date, selectedSlot.textContent);
      }, 1000);
    });
  }
}

// Initialize mobile menu
function initMobileMenu() {
  const mobileMenuButton = document.querySelector('.mobile-menu-button');
  const mobileMenu = document.querySelector('.mobile-menu');
  const mobileMenuClose = document.querySelector('.mobile-menu-close');
  
  if (mobileMenuButton && mobileMenu && mobileMenuClose) {
    mobileMenuButton.addEventListener('click', function() {
      mobileMenu.classList.add('open');
    });
    
    mobileMenuClose.addEventListener('click', function() {
      mobileMenu.classList.remove('open');
    });
  }
}

// Create moving task list
function createMovingTaskList() {
  const tasksContainer = document.querySelector('.steps');
  if (!tasksContainer) return;
  
  // Clear existing tasks
  tasksContainer.innerHTML = '';
  
  // Create moving checklist
  const steps = [
    {
      title: 'Update Address',
      tasks: [
        { id: 'usps', title: 'USPS Change of Address', completed: false },
        { id: 'dmv', title: 'DMV Address Update', completed: false },
        { id: 'voter', title: 'Voter Registration Update', completed: false },
        { id: 'irs', title: 'IRS Address Change', completed: false }
      ]
    },
    {
      title: 'Set Up Utilities',
      tasks: [
        { id: 'water', title: 'Water Service', completed: false },
        { id: 'power', title: 'Electricity Service', completed: false },
        { id: 'internet', title: 'Internet Service', completed: false }
      ]
    },
    {
      title: 'Local Registration',
      tasks: [
        { id: 'pet', title: 'Pet Registration', completed: false },
        { id: 'schools', title: 'School Registration', completed: false },
        { id: 'property', title: 'Property Tax Information', completed: false }
      ]
    }
  ];
  
  renderTaskList(steps, 'Moving Checklist');
}

// Create benefits task list
function createBenefitsTaskList(isApproved = false) {
  const tasksContainer = document.querySelector('.steps');
  if (!tasksContainer) return;
  
  // Clear existing tasks
  tasksContainer.innerHTML = '';
  
  // Create benefits checklist
  let steps;
  
  if (isApproved) {
    steps = [
      {
        title: 'SNAP Benefits Approved',
        tasks: [
          { id: 'ebt-card', title: 'Receive EBT Card', completed: true },
          { id: 'check-balance', title: 'Check Benefit Balance', completed: false },
          { id: 'recertification', title: 'Mark Recertification Date (09/15/2025)', completed: false }
        ]
      },
      {
        title: 'Using Your Benefits',
        tasks: [
          { id: 'allowed-purchases', title: 'Review Allowed Purchases', completed: false },
          { id: 'find-stores', title: 'Find Participating Stores', completed: false }
        ]
      },
      {
        title: 'Maintaining Eligibility',
        tasks: [
          { id: 'report-changes', title: 'Report Income Changes', completed: false },
          { id: 'prepare-recert', title: 'Prepare for Recertification', completed: false }
        ]
      }
    ];
  } else {
    steps = [
      {
        title: 'Check Eligibility',
        tasks: [
          { id: 'requirements', title: 'Review Requirements', completed: false },
          { id: 'calculator', title: 'Use Benefit Calculator', completed: false }
        ]
      },
      {
        title: 'Gather Documents',
        tasks: [
          { id: 'id', title: 'Identification Documents', completed: false },
          { id: 'income', title: 'Income Verification', completed: false },
          { id: 'residence', title: 'Proof of Residence', completed: false },
          { id: 'expenses', title: 'Expense Documentation', completed: false }
        ]
      },
      {
        title: 'Submit Application',
        tasks: [
          { id: 'form', title: 'Complete Application Form', completed: false },
          { id: 'submit', title: 'Submit Application', completed: false },
          { id: 'followup', title: 'Schedule Follow-up', completed: false }
        ]
      }
    ];
  }
  
  renderTaskList(steps, 'Benefits Application Process');
}

// Create appointment task list
function createAppointmentTaskList(type, location, date, time) {
  const tasksContainer = document.querySelector('.steps');
  if (!tasksContainer) return;
  
  // Clear existing tasks
  tasksContainer.innerHTML = '';
  
  // Format the appointment details
  const formattedDate = new Date(date).toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  // Create appointment checklist
  const steps = [
    {
      title: 'Prepare for Appointment',
      tasks: [
        { id: 'docs', title: 'Gather Required Documents', completed: false },
        { id: 'forms', title: 'Complete Pre-Appointment Forms', completed: false }
      ]
    },
    {
      title: `${type} Appointment Details`,
      tasks: [
        { id: 'date', title: `Date: ${formattedDate}`, completed: false },
        { id: 'time', title: `Time: ${time}`, completed: false },
        { id: 'location', title: `Location: ${location}`, completed: false }
      ]
    },
    {
      title: 'After Your Appointment',
      tasks: [
        { id: 'follow-up', title: 'Follow up on Requirements', completed: false },
        { id: 'feedback', title: 'Provide Feedback', completed: false }
      ]
    }
  ];
  
  renderTaskList(steps, 'Appointment Checklist');
}

// Render task list
function renderTaskList(steps, title) {
  const tasksContainer = document.querySelector('.steps');
  const progressText = document.querySelector('.progress-text');
  
  if (!tasksContainer) return;
  
  if (progressText) {
    progressText.textContent = '0% Complete';
  }
  
  document.querySelector('.progress-fill').style.width = '0%';
  
  // Set title if provided
  if (title) {
    const taskHeader = document.querySelector('.task-tracker .panel-header h2');
    if (taskHeader) {
      taskHeader.textContent = title;
    }
  }
  
  // Create each step
  steps.forEach((step, stepIndex) => {
    const stepElement = document.createElement('div');
    stepElement.className = 'step';
    
    // Create step header
    const stepHeader = document.createElement('div');
    stepHeader.className = 'step-header';
    
    const stepTitle = document.createElement('div');
    stepTitle.className = 'step-title';
    
    const icon = document.createElement('i');
    if (stepIndex === 0) {
      icon.className = 'fas fa-spinner fa-spin';
      icon.style.color = 'var(--primary-color)';
    } else {
      icon.className = 'fas fa-clock';
      icon.style.color = 'var(--text-color)';
    }
    
    stepTitle.appendChild(icon);
    
    const titleText = document.createElement('span');
    titleText.textContent = step.title;
    stepTitle.appendChild(titleText);
    
    const stepProgress = document.createElement('div');
    stepProgress.className = 'step-progress';
    stepProgress.textContent = '0%';
    
    stepHeader.appendChild(stepTitle);
    stepHeader.appendChild(stepProgress);
    stepElement.appendChild(stepHeader);
    
    // Create step content
    const stepContent = document.createElement('div');
    stepContent.className = 'step-content';
    stepContent.style.display = stepIndex === 0 ? 'block' : 'none';
    
    const tasks = document.createElement('div');
    tasks.className = 'tasks';
    
    // Create each task
    step.tasks.forEach(task => {
      const taskElement = document.createElement('div');
      taskElement.className = 'task';
      
      const checkbox = document.createElement('div');
      checkbox.className = 'task-checkbox';
      if (task.completed) {
        checkbox.classList.add('checked');
        const checkIcon = document.createElement('i');
        checkIcon.className = 'fas fa-check';
        checkbox.appendChild(checkIcon);
      }
      
      const taskLabel = document.createElement('div');
      taskLabel.className = 'task-label';
      taskLabel.textContent = task.title;
      
      taskElement.appendChild(checkbox);
      taskElement.appendChild(taskLabel);
      tasks.appendChild(taskElement);
    });
    
    stepContent.appendChild(tasks);
    stepElement.appendChild(stepContent);
    tasksContainer.appendChild(stepElement);
  });
  
  // Re-initialize task tracker
  initTaskTracker();
}

// Auto-start features for demo
setTimeout(() => {
  // Automatically show a welcome message in chat
  addMessage("Hi there! I'd like help moving to a new city.", 'user');
  
  setTimeout(() => {
    addMessage("I can help you with your move! When you move to a new location, you'll need to update your address with several government agencies:\n\n1. USPS Change of Address form\n2. DMV for driver's license and vehicle registration\n3. Voter registration\n4. IRS address change\n\nI've added a Moving Checklist to your Task Tracker to help you keep track of everything.", 'assistant');
    
    // Create a moving task list
    createMovingTaskList();
    
    // Scroll to tasks section after a brief delay
    setTimeout(() => {
      document.querySelector('#tasks').scrollIntoView({ behavior: 'smooth' });
      
      // Simulate completing first task
      setTimeout(() => {
        const firstCheckbox = document.querySelector('.task-checkbox');
        if (firstCheckbox) {
          firstCheckbox.click();
        }
      }, 2000);
    }, 1000);
  }, 1000);
}, 1500);
