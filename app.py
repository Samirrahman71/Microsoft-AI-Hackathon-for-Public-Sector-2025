from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from dotenv import load_dotenv
import openai
import json
import re

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# Store conversation history
conversation_history = []

# DMV form data structure
dmv_forms = {
    'address_update': {
        'current_address': '',
        'new_address': '',
        'license_number': '',
        'phone_number': '',
        'email': ''
    }
}


def extract_form_data(message):
    data = {}

    # Extract email
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    email_match = re.search(email_pattern, message)
    if email_match:
        data['email'] = email_match.group(0)

    # Extract phone number
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    phone_match = re.search(phone_pattern, message)
    if phone_match:
        data['phone_number'] = phone_match.group(0)

    # Extract license number (assuming format like "DL1234567")
    license_pattern = r'DL\d{7}'
    license_match = re.search(license_pattern, message)
    if license_match:
        data['license_number'] = license_match.group(0)

    # Extract addresses (simple pattern, can be enhanced)
    address_patterns = [
        r'current address[:\s]+([^,]+(?:,\s*[^,]+){2,})',
        r'new address[:\s]+([^,]+(?:,\s*[^,]+){2,})'
    ]

    for pattern in address_patterns:
        match = re.search(pattern, message, re.IGNORECASE)
        if match:
            if 'current' in pattern:
                data['current_address'] = match.group(1).strip()
            else:
                data['new_address'] = match.group(1).strip()

    return data


@app.route('/')
def home():
    return render_template('index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')

    # Add user message to conversation history
    conversation_history.append({"role": "user", "content": user_message})

    # Create a system message that includes DMV form context
    system_message = """You are a helpful DMV assistant. You can help users fill out DMV forms.
    When users want to update their address, collect the following information:
    - Current address
    - New address
    - License number (format: DL1234567)
    - Phone number
    - Email address
    
    Guide users through the process by asking for one piece of information at a time.
    If you receive multiple pieces of information, acknowledge them all.
    Once you have all the information, inform the user that they can submit the form."""

    try:
        # Prepare messages for the API call
        messages = [{"role": "system", "content": system_message}
                    ] + conversation_history[-5:]  # Keep last 5 messages

        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=messages
        )

        bot_response = response.choices[0].message.content

        # Add bot response to conversation history
        conversation_history.append(
            {"role": "assistant", "content": bot_response})

        # Extract form data from the conversation
        form_data = extract_form_data(user_message)
        if form_data:
            dmv_forms['address_update'].update(form_data)

        return jsonify({
            'response': bot_response,
            'form_data': dmv_forms['address_update']
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/api/dmv/submit', methods=['POST'])
def submit_dmv_form():
    data = request.json
    form_type = data.get('form_type')

    if form_type == 'address_update':
        # Validate the form data
        form_data = dmv_forms['address_update']
        if all(form_data.values()):
            # In a real application, you would submit this to a real DMV system
            return jsonify({
                'status': 'success',
                'message': 'Address update form submitted successfully. You will receive a confirmation email shortly.'
            })
        else:
            missing_fields = [k for k, v in form_data.items() if not v]
            return jsonify({
                'status': 'error',
                'message': f'Please fill out the following required fields: {", ".join(missing_fields)}'
            }), 400

    return jsonify({
        'status': 'error',
        'message': 'Invalid form type'
    }), 400


if __name__ == '__main__':
    app.run(debug=True)
