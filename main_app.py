from flask import Flask, request, jsonify, render_template
from flask_cors import CORS
import os
from dotenv import load_dotenv
import openai
import requests

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)

# Configure OpenAI
openai.api_key = os.getenv('OPENAI_API_KEY')

# DMV API endpoint
DMV_API_URL = "http://localhost:5001/api"


@app.route('/')
def home():
    return render_template('main_index.html')


@app.route('/api/chat', methods=['POST'])
def chat():
    data = request.json
    user_message = data.get('message', '')

    # Create a system message that includes DMV form context
    system_message = """You are a helpful DMV assistant. You can help users fill out DMV forms.
    When users want to update their address or get a new license, guide them through the process.
    Extract relevant information from their messages and use it to fill out the forms."""

    try:
        response = openai.ChatCompletion.create(
            model="gpt-3.5-turbo",
            messages=[
                {"role": "system", "content": system_message},
                {"role": "user", "content": user_message}
            ]
        )

        bot_response = response.choices[0].message.content

        # Extract information from user message and send to DMV API
        extracted_info = extract_info(user_message)
        if extracted_info:
            dmv_response = requests.post(
                f"{DMV_API_URL}/update-form", json=extracted_info)
            form_data = dmv_response.json()
        else:
            form_data = {}

        return jsonify({
            'response': bot_response,
            'form_data': form_data
        })

    except Exception as e:
        return jsonify({'error': str(e)}), 500


def extract_info(message):
    # Simple information extraction (you can make this more sophisticated)
    info = {}

    # Look for name
    if "name is" in message.lower():
        name_start = message.lower().find("name is") + 8
        name_end = message.find(".", name_start)
        if name_end == -1:
            name_end = len(message)
        info['name'] = message[name_start:name_end].strip()

    # Look for address
    if "address is" in message.lower():
        addr_start = message.lower().find("address is") + 10
        addr_end = message.find(".", addr_start)
        if addr_end == -1:
            addr_end = len(message)
        info['address'] = message[addr_start:addr_end].strip()

    # Look for license number
    if "license" in message.lower():
        for word in message.split():
            if word.isalnum() and len(word) == 8:  # Assuming license numbers are 8 characters
                info['license_number'] = word

    return info


if __name__ == '__main__':
    app.run(port=5000, debug=True)
