from flask import Flask, request, jsonify, render_template
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Store form data (in a real application, this would be a database)
form_data = {
    'name': '',
    'address': '',
    'license_number': '',
    'phone': '',
    'email': '',
    'dob': '',
    'ssn_last_4': '',
    'id_type': ''
}


@app.route('/')
def home():
    return render_template('dmv_index.html', form_data=form_data)


@app.route('/api/update-form', methods=['POST'])
def update_form():
    data = request.json
    # Update form data with new information
    for key, value in data.items():
        if key in form_data:
            form_data[key] = value
    return jsonify(form_data)


@app.route('/api/submit-form', methods=['POST'])
def submit_form():
    data = request.json
    # Update all form fields
    for key, value in data.items():
        if key in form_data:
            form_data[key] = value

    # In a real application, this would save to a database
    return jsonify({
        'status': 'success',
        'message': 'Form submitted successfully',
        'data': form_data
    })


@app.route('/api/get-form-data', methods=['GET'])
def get_form_data():
    return jsonify(form_data)


if __name__ == '__main__':
    app.run(port=5001, debug=True)
