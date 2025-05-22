// Constants
const DEFAULT_LOCATION = 'California';

// DOM Elements
const chatMessages = document.getElementById('chat-messages');
const userInput = document.getElementById('user-input');
const chatForm = document.getElementById('chat-form');
const typingIndicator = document.getElementById('typing-indicator');
const formContainer = document.getElementById('form-container');
const closeFormBtn = document.getElementById('close-form');
const formTitle = document.getElementById('form-title');
const formContent = document.querySelector('.form-content');
const container = document.querySelector('.container');

// Form templates for different DMV services - Ensure these match backend requirements
const FORM_TEMPLATES = {
    address_change: {
        title: 'Change of Address Form',
        fields: [
            { id: 'full-name', label: 'Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'driver-license', label: 'Driver\'s License Number', type: 'text', required: true },
            // Current Address Fields
            { id: 'current-address-street', label: 'Current Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'current_address' },
            { id: 'current-address-city', label: 'Current City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'current_address' },
            { id: 'current-address-state', label: 'Current State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'current_address' },
            { id: 'current-address-zip', label: 'Current ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'current_address' },
            { id: 'current-address-county', label: 'Current County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'current_address' },
            // New Address Fields
            { id: 'new-address-street', label: 'New Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'new_address' },
            { id: 'new-address-city', label: 'New City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'new_address' },
            { id: 'new-address-state', label: 'New State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'new_address' },
            { id: 'new-address-zip', label: 'New ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'new_address' },
            { id: 'new-address-county', label: 'New County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'new_address' },

            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', required: true }
        ]
    },
    license_replacement: {
        title: 'Driver License Replacement Form',
        fields: [
            { id: 'full-name', label: 'Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'ssn', label: 'Social Security Number', type: 'text', required: true },
            // Current Address Fields
            { id: 'current-address-street', label: 'Current Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'current_address' },
            { id: 'current-address-city', label: 'Current City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'current_address' },
            { id: 'current-address-state', label: 'Current State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'current_address' },
            { id: 'current-address-zip', label: 'Current ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'current_address' },
            { id: 'current-address-county', label: 'Current County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'current_address' },

            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', required: true }
        ]
    },
    vehicle_registration: {
        title: 'Vehicle Registration Form',
        fields: [
            { id: 'full-name', label: 'Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'driver-license', label: 'Driver\'s License Number', type: 'text', required: true },
            { id: 'vehicle-make', label: 'Vehicle Make', type: 'text', required: true },
            { id: 'vehicle-model', label: 'Vehicle Model', type: 'text', required: true },
            { id: 'vehicle-year', label: 'Vehicle Year', type: 'text', required: true },
            // Current Address Fields
            { id: 'current-address-street', label: 'Current Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'current_address' },
            { id: 'current-address-city', label: 'Current City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'current_address' },
            { id: 'current-address-state', label: 'Current State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'current_address' },
            { id: 'current-address-zip', label: 'Current ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'current_address' },
            { id: 'current-address-county', label: 'Current County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'current_address' },

            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', required: true }
        ]
    },
    vehicle_transfer: {
        title: 'Vehicle Transfer Form',
        fields: [
            { id: 'full-name', label: 'Seller Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Seller Date of Birth', type: 'date', required: true },
            { id: 'driver-license', label: 'Seller Driver\'s License Number', type: 'text', required: true },
             { id: 'vehicle-make', label: 'Vehicle Make', type: 'text', required: true },
            { id: 'vehicle-model', label: 'Vehicle Model', type: 'text', required: true },
            { id: 'vehicle-year', label: 'Vehicle Year', type: 'text', required: true },
             { id: 'buyer-full-name', label: 'Buyer Full Name', type: 'text', required: true },
            // Current Address Fields (Seller's)
            { id: 'current-address-street', label: 'Seller Current Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'current_address' },
            { id: 'current-address-city', label: 'Seller Current City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'current_address' },
            { id: 'current-address-state', label: 'Seller Current State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'current_address' },
            { id: 'current-address-zip', label: 'Seller Current ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'current_address' },
            { id: 'current-address-county', label: 'Seller Current County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'current_address' },

            { id: 'email', label: 'Seller Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Seller Phone Number', type: 'tel', required: true }
        ]
    },
     license_renewal: {
        title: 'Driver License Renewal Form',
        fields: [
            { id: 'full-name', label: 'Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'current-license', label: 'Current Driver\'s License Number', type: 'text', required: true },
            // Current Address Fields
            { id: 'current-address-street', label: 'Current Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'current_address' },
            { id: 'current-address-city', label: 'Current City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'current_address' },
            { id: 'current-address-state', label: 'Current State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'current_address' },
            { id: 'current-address-zip', label: 'Current ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'current_address' },
            { id: 'current-address-county', label: 'Current County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'current_address' },

            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', required: true }
        ]
    },
     vehicle_title: {
        title: 'Vehicle Title Replacement Form',
        fields: [
            { id: 'full-name', label: 'Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'driver-license', label: 'Driver\'s License Number', type: 'text', required: true },
            { id: 'vehicle-make', label: 'Vehicle Make', type: 'text', required: true },
            { id: 'vehicle-model', label: 'Vehicle Model', type: 'text', required: true },
            { id: 'vehicle-year', label: 'Vehicle Year', type: 'text', required: true },
            // Current Address Fields
            { id: 'current-address-street', label: 'Current Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'current_address' },
            { id: 'current-address-city', label: 'Current City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'current_address' },
            { id: 'current-address-state', label: 'Current State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'current_address' },
            { id: 'current-address-zip', label: 'Current ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'current_address' },
            { id: 'current-address-county', label: 'Current County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'current_address' },

            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', required: true }
        ]
    },
     new_resident: {
        title: 'New Resident License Application',
        fields: [
            { id: 'full-name', label: 'Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'out-of-state-license', label: 'Out-of-State License Number', type: 'text', required: true },
            { id: 'ssn', label: 'Social Security Number', type: 'text', required: true },
             // Current Address Fields
            { id: 'current-address-street', label: 'Current Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'current_address' },
            { id: 'current-address-city', label: 'Current City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'current_address' },
            { id: 'current-address-state', label: 'Current State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'current_address' },
            { id: 'current-address-zip', label: 'Current ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'current_address' },
            { id: 'current-address-county', label: 'Current County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'current_address' },

            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', required: true }
        ]
    },
     real_id: {
        title: 'REAL ID Application',
        fields: [
            { id: 'full-name', label: 'Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'ssn', label: 'Social Security Number', type: 'text', required: true },
             // Current Address Fields
            { id: 'current-address-street', label: 'Current Street Address', type: 'text', required: true, section: 'Address Information', addressPart: 'street', addressType: 'current_address' },
            { id: 'current-address-city', label: 'Current City', type: 'text', required: true, section: 'Address Information', addressPart: 'city', addressType: 'current_address' },
            { id: 'current-address-state', label: 'Current State', type: 'text', required: true, section: 'Address Information', addressPart: 'state', addressType: 'current_address' },
            { id: 'current-address-zip', label: 'Current ZIP Code', type: 'text', required: true, section: 'Address Information', addressPart: 'zip', addressType: 'current_address' },
            { id: 'current-address-county', label: 'Current County', type: 'text', required: false, section: 'Address Information', addressPart: 'county', addressType: 'current_address' },
             { id: 'proof-of-residence', label: 'Proof of Residence (e.g., utility bill)', type: 'text', required: true },

            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', required: true }
        ]
    },
     dmv_appointment: {
        title: 'DMV Appointment Request',
        fields: [
            { id: 'full-name', label: 'Full Name', type: 'text', required: true },
            { id: 'date-of-birth', label: 'Date of Birth', type: 'date', required: true },
            { id: 'driver-license', label: 'Driver\'s License Number (Optional)', type: 'text', required: false },
            { id: 'service-type', label: 'Service Type (e.g., Driving Test)', type: 'text', required: true },
            { id: 'preferred-date', label: 'Preferred Date', type: 'date', required: true },
            { id: 'preferred-time', label: 'Preferred Time', type: 'time', required: false },
            { id: 'preferred-location', label: 'Preferred DMV Location', type: 'text', required: false },

            { id: 'email', label: 'Email Address', type: 'email', required: true },
            { id: 'phone', label: 'Phone Number', type: 'tel', required: true }
        ]
    }
};

// Event Listeners
chatForm.addEventListener('submit', handleUserMessage);
userInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
    }
});

closeFormBtn.addEventListener('click', () => {
    formContainer.classList.remove('active');
    container.classList.remove('form-active');
});

// Handle user message
async function handleUserMessage(e) {
    e.preventDefault();
    const message = userInput.value.trim();
    if (!message) return;

    // Add user message to chat
    addUserMessage(message);
    userInput.value = '';

    // Show typing indicator
    showTypingIndicator();

    try {
        const response = await fetch('/api/chat/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                message: message,
                location: DEFAULT_LOCATION
            })
        });

        const data = await response.json();
        hideTypingIndicator();

        if (data.error) {
            addBotMessage('I apologize, but I encountered an error. Please try again.');
            console.error('Error:', data.error);
            return;
        }

        // Add bot response
        addBotMessage(data.response);

        // Update form if data is available
        if (data.form_data) {
            updateFormDisplay(data.form_data, data.extracted_data);
            formContainer.classList.add('active');
            container.classList.add('form-active');
        }

    } catch (error) {
        hideTypingIndicator();
        addBotMessage('I apologize, but I encountered an error. Please try again.');
        console.error('Error:', error);
    }
}

// Update form display with template and extracted data
function updateFormDisplay(formData, extractedData) {
    const template = FORM_TEMPLATES[formData.form_type];
    if (!template) return;

    // Update form title
    formTitle.textContent = template.title;

    // Clear existing form content
    const form = document.getElementById('dmv-form');
    form.innerHTML = '';

    // Add official seal
    const seal = document.createElement('div');
    seal.className = 'official-seal';
    seal.innerHTML = '<img src="/static/chatbot/images/official-seal.png" alt="Official Seal" />';
    form.appendChild(seal);

    // Group fields by section
    const sections = {
        'Personal Information': [],
        'Address Information': [],
        'Contact Information': [],
        'Vehicle Information': [],
        'Appointment Information': [],
        'Other Information': []
    };

    template.fields.forEach(field => {
        const section = field.section || (['full-name', 'date-of-birth', 'driver-license', 'ssn', 'out-of-state-license', 'buyer-full-name'].includes(field.id) ? 'Personal Information' :
                           field.id.includes('address') ? 'Address Information' :
                           ['email', 'phone'].includes(field.id) ? 'Contact Information' :
                           field.id.includes('vehicle') ? 'Vehicle Information' :
                           ['service-type', 'preferred-date', 'preferred-time', 'preferred-location'].includes(field.id) ? 'Appointment Information' :
                           'Other Information');
        sections[section].push(field);
    });

    // Add sections to form
    Object.entries(sections).forEach(([sectionTitle, fields]) => {
        if (fields.length === 0) return;

        const section = document.createElement('div');
        section.className = 'form-section';
        section.innerHTML = `<h3>${sectionTitle}</h3>`;

        // Group address fields into rows
        if (sectionTitle === 'Address Information') {
             const addressTypes = { 'current_address': [], 'new_address': [] };
             fields.forEach(field => {
                 if (field.addressType) addressTypes[field.addressType].push(field);
             });

             Object.entries(addressTypes).forEach(([addrType, addrFields]) => {
                 if (addrFields.length === 0) return;
                 
                 // Create groups for street, city/state, zip/county
                 const streetField = addrFields.find(f => f.addressPart === 'street');
                 const cityField = addrFields.find(f => f.addressPart === 'city');
                 const stateField = addrFields.find(f => f.addressPart === 'state');
                 const zipField = addrFields.find(f => f.addressPart === 'zip');
                 const countyField = addrFields.find(f => f.addressPart === 'county');

                 // Add Street Address
                 if(streetField) {
                     const group = document.createElement('div');
                     group.className = 'form-group';
                     group.innerHTML = `
                         <label for="${streetField.id}">${streetField.label}</label>
                         <input type="${streetField.type}" 
                                class="form-control" 
                                id="${streetField.id}" 
                                name="${streetField.id}"
                                ${streetField.required ? 'required' : ''}
                                placeholder="Enter ${streetField.label.toLowerCase()}"
                                value="${extractedData?.[streetField.addressType]?.[streetField.addressPart] || ''}">
                     `;
                     section.appendChild(group);
                 }

                 // Add City and State in a row
                 if(cityField || stateField) {
                      const row = document.createElement('div');
                      row.className = 'form-row';
                      if(cityField) row.innerHTML += `
                          <div class="form-col">
                              <div class="form-group">
                                  <label for="${cityField.id}">${cityField.label}</label>
                                  <input type="${cityField.type}" 
                                         class="form-control" 
                                         id="${cityField.id}" 
                                         name="${cityField.id}"
                                         ${cityField.required ? 'required' : ''}
                                         placeholder="Enter ${cityField.label.toLowerCase()}"
                                         value="${extractedData?.[cityField.addressType]?.[cityField.addressPart] || ''}">
                              </div>
                          </div>
                      `;
                       if(stateField) row.innerHTML += `
                          <div class="form-col">
                              <div class="form-group">
                                  <label for="${stateField.id}">${stateField.label}</label>
                                  <input type="${stateField.type}" 
                                         class="form-control" 
                                         id="${stateField.id}" 
                                         name="${stateField.id}"
                                         ${stateField.required ? 'required' : ''}
                                         placeholder="Enter ${stateField.label.toLowerCase()}"
                                         value="${extractedData?.[stateField.addressType]?.[stateField.addressPart] || ''}">
                              </div>
                          </div>
                      `;
                      section.appendChild(row);
                 }

                 // Add ZIP Code and County in a row
                 if(zipField || countyField) {
                     const row = document.createElement('div');
                     row.className = 'form-row';
                     if(zipField) row.innerHTML += `
                         <div class="form-col">
                             <div class="form-group">
                                 <label for="${zipField.id}">${zipField.label}</label>
                                 <input type="${zipField.type}" 
                                        class="form-control" 
                                        id="${zipField.id}" 
                                        name="${zipField.id}"
                                        ${zipField.required ? 'required' : ''}
                                        placeholder="Enter ${zipField.label.toLowerCase()}"
                                        value="${extractedData?.[zipField.addressType]?.[zipField.addressPart] || ''}">
                             </div>
                         </div>
                     `;
                     if(countyField) row.innerHTML += `
                         <div class="form-col">
                             <div class="form-group">
                                 <label for="${countyField.id}">${countyField.label}</label>
                                 <input type="${countyField.type}" 
                                        class="form-control" 
                                        id="${countyField.id}" 
                                        name="${countyField.id}"
                                        ${countyField.required ? 'required' : ''}
                                        placeholder="Enter ${countyField.label.toLowerCase()}"
                                        value="${extractedData?.[countyField.addressType]?.[countyField.addressPart] || ''}">
                             </div>
                         </div>
                     `;
                     section.appendChild(row);
                 }
             });

        } else { // Handle non-address fields
             fields.forEach(field => {
                const group = document.createElement('div');
                group.className = 'form-group';
                group.innerHTML = `
                    <label for="${field.id}">${field.label}</label>
                    <input type="${field.type}" 
                           class="form-control" 
                           id="${field.id}" 
                           name="${field.id}"
                           ${field.required ? 'required' : ''}
                           placeholder="Enter ${field.label.toLowerCase()}"
                           value="${extractedData?.[field.id] || ''}">
                `;
                section.appendChild(group);
            });
        }

        form.appendChild(section);
    });

    // Add submit button
    const submitBtn = document.createElement('button');
    submitBtn.type = 'submit';
    submitBtn.className = 'submit-btn';
    submitBtn.textContent = `Submit ${template.title}`;
    form.appendChild(submitBtn);

    // Add disclaimer
    const disclaimer = document.createElement('p');
    disclaimer.className = 'form-disclaimer';
    disclaimer.textContent = 'This is a demonstration form for a government hackathon. In a real application, sensitive information would be securely transmitted using encryption.';
    form.appendChild(disclaimer);

    // Add form submit handler
    form.onsubmit = (e) => {
        e.preventDefault();
        handleFormSubmission(formData.form_type);
    };
}

// Handle form submission
async function handleFormSubmission(formType) {
    const form = document.getElementById('dmv-form');
    const formData = new FormData(form);
    const data = { form_type: formType };

    // Collect data, handling nested address objects
    const template = FORM_TEMPLATES[formType];
    template.fields.forEach(field => {
        const value = formData.get(field.id);
        if (field.addressType && field.addressPart) {
            if (!data[field.addressType]) {
                data[field.addressType] = {};
            }
            data[field.addressType][field.addressPart] = value;
        } else {
            data[field.id] = value;
        }
    });

    // Add submitting animation
    const submitBtn = form.querySelector('.submit-btn');
    submitBtn.classList.add('form-submitting');
    submitBtn.disabled = true;

    try {
        const response = await fetch('/api/dmv/submit/', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            // Show success message
            const successMessage = document.createElement('div');
            successMessage.className = 'success-message';
            successMessage.textContent = result.message;
            formContent.insertBefore(successMessage, form);

            // Clear form fields
            form.reset();

            // Hide form after 3 seconds
            setTimeout(() => {
                formContainer.classList.remove('active');
                container.classList.remove('form-active');
                successMessage.remove();
            }, 3000);
        } else {
            addBotMessage(result.message || 'There was an error submitting your form. Please try again.');
        }
    } catch (error) {
        console.error('Error:', error);
        addBotMessage('There was an error submitting your form. Please try again.');
    } finally {
        submitBtn.classList.remove('form-submitting');
        submitBtn.disabled = false;
    }
}

// Add user message to chat
function addUserMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message user-message';
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Add bot message to chat
function addBotMessage(message) {
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message bot-message';
    messageDiv.innerHTML = `
        <div class="message-content">${message}</div>
    `;
    chatMessages.appendChild(messageDiv);
    scrollToBottom();
}

// Show typing indicator
function showTypingIndicator() {
    typingIndicator.style.display = 'flex';
    scrollToBottom();
}

// Hide typing indicator
function hideTypingIndicator() {
    typingIndicator.style.display = 'none';
}

// Scroll chat to bottom
function scrollToBottom() {
    chatMessages.scrollTop = chatMessages.scrollHeight;
}

// Initial bot message
addBotMessage('Hello! I\'m your California DMV assistant. I can help you with: address changes, license replacement, vehicle registration, vehicle transfer, license renewal, vehicle title, new resident services, REAL ID, or DMV appointments. How can I help you today?'); 