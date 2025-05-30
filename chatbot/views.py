from django.shortcuts import render
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.conf import settings
import openai
import json
import re
import os
from pathlib import Path

# Import the RAG system
from .rag_system import RAGSystem

# Configure OpenAI
openai.api_key = settings.OPENAI_API_KEY

# California DMV specific intents and their corresponding forms
CA_DMV_INTENTS = {
    'address_change': {
        'name': 'Change of Address Form',
        'fields': ['full_name', 'date_of_birth', 'driver_license', 'current_address', 'new_address', 'email', 'phone']
    },
    'license_replacement': {
        'name': 'Driver License Replacement Form',
        'fields': ['full_name', 'date_of_birth', 'ssn', 'current_address', 'email', 'phone']
    },
    'vehicle_registration': {
        'name': 'Vehicle Registration Form',
        'fields': ['full_name', 'date_of_birth', 'driver_license', 'vehicle_info', 'current_address', 'email', 'phone']
    },
    'vehicle_transfer': {
        'name': 'Vehicle Transfer Form',
        'fields': ['full_name', 'date_of_birth', 'driver_license', 'vehicle_info', 'buyer_info', 'current_address', 'email', 'phone']
    },
    'license_renewal': {
        'name': 'Driver License Renewal Form',
        'fields': ['full_name', 'date_of_birth', 'current_license', 'current_address', 'email', 'phone']
    },
    'vehicle_title': {
        'name': 'Vehicle Title Replacement Form',
        'fields': ['full_name', 'date_of_birth', 'driver_license', 'vehicle_info', 'current_address', 'email', 'phone']
    },
    'new_resident': {
        'name': 'New Resident License Application',
        'fields': ['full_name', 'date_of_birth', 'out_of_state_license', 'ssn', 'current_address', 'email', 'phone']
    },
    'real_id': {
        'name': 'REAL ID Application',
        'fields': ['full_name', 'date_of_birth', 'ssn', 'current_address', 'proof_of_residence', 'email', 'phone']
    },
    'dmv_appointment': {
        'name': 'DMV Appointment Request',
        'fields': ['full_name', 'date_of_birth', 'driver_license', 'service_type', 'preferred_date', 'email', 'phone']
    },
    'fix_it_ticket': {
        'name': 'Fix-It Ticket Information',
        'fields': []  # No form for this, just info
    },
    'speeding_ticket': {
        'name': 'Speeding Ticket Information',
        'fields': []  # No form for this, just info
    },
    'registration_expired': {
        'name': 'Expired Registration Information',
        'fields': []  # No form for this, just info
    },
    'smog_check': {
        'name': 'Smog Check Information',
        'fields': []  # No form for this, just info
    }
}

# Intent recognition patterns - Made more robust
INTENT_PATTERNS = {
    'address_change': r'(?:change|update|new|modify)\s+(?:my\s+)?address|(?:i\s+)?moved|moving|relocat(?:e|ing)|address\s+form',
    'license_replacement': r'(?:lost|replace|stolen|damaged|new)\s+(?:my\s+)?(?:driver\'?s?\s+)?license|license\s+replacement',
    'vehicle_registration': r'(?:register|registration|renew registration)\s+(?:my\s+)?(?:car|vehicle|auto|automobile)|vehicle\s+registration',
    'vehicle_transfer': r'(?:sell|sold|transfer|change ownership|title transfer)\s+(?:my\s+)?(?:car|vehicle|auto)|transfer\s+form',
    'license_renewal': r'(?:renew|extend|update)\s+(?:my\s+)?(?:driver\'?s?\s+)?license|license\s+renewal|license\s+expired',
    'vehicle_title': r'(?:new|replacement|duplicate)\s+(?:title|pink\s+slip)|title\s+(?:form|replacement)|car\s+title',
    'new_resident': r'new\s+(?:resident|to\s+california)|moved\s+to\s+california|from\s+(?:another|different)\s+state',
    'real_id': r'real\s+id|real\s+identification|enhanced\s+id|federal\s+id|travel\s+id',
    'dmv_appointment': r'(?:make|schedule|book|set\s+up)\s+(?:an\s+)?appointment|visit\s+(?:the\s+)?dmv|dmv\s+appointment',
    'fix_it_ticket': r'fix(?:-|\s+)it\s+ticket|repair\s+ticket|correction\s+ticket',
    'speeding_ticket': r'speed(?:ing)?\s+ticket|traffic\s+ticket|citation',
    'registration_expired': r'registration\s+(?:expired|lapsed|out\s+of\s+date)|expired\s+registration',
    'smog_check': r'smog\s+(?:check|test|certification)|emissions\s+test'
}


def extract_intent(message):
    message = message.lower()
    for intent, pattern in INTENT_PATTERNS.items():
        if re.search(pattern, message):
            return intent
    return None


def get_form_template(intent):
    if intent not in CA_DMV_INTENTS:
        return None

    form_info = CA_DMV_INTENTS[intent]
    return {
        'form_type': intent,
        'form_name': form_info['name'],
        'required_fields': form_info['fields']
    }


def extract_form_data(message, intent):
    data = {}

    # Common patterns for all forms
    email_pattern = r'[\w\.-]+@[\w\.-]+\.\w+'
    phone_pattern = r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b'
    # More flexible address pattern
    address_pattern = r'\b\d+\s+[A-Za-z\s,#.-]+(?:Street|St|Ave(?:nue)?|Road|Rd|Blvd|Lane|Ln|Drive|Dr|Court|Ct|Circle|Cir|Way|Place|Pl)\b(?:[,.\s]+(?:Unit|Apt|Suite)\s*\S+)?(?:[,.\s]+[A-Za-z\s]+)?(?:[,.\s]+CA)?(?:[,.\s]+\d{5})?'

    # Extract common fields
    email_match = re.search(email_pattern, message)
    if email_match:
        data['email'] = email_match.group()

    phone_match = re.search(phone_pattern, message)
    if phone_match:
        data['phone'] = phone_match.group()

    # Extract addresses - need a more sophisticated approach for current vs new if not explicitly labeled
    # For simplicity with current regex, we'll just extract the first found address.
    # A more advanced approach might involve looking for preceding "current address" or "new address" markers.
    address_match = re.search(address_pattern, message, re.IGNORECASE)
    if address_match:
        # For address_change, try to differentiate current and new, otherwise just get one address
        if intent == 'address_change':
            # This is a very basic attempt to differentiate. More robust parsing is needed for complex inputs.
            current_match = re.search(
                r'(?:current|old)\s+address[:\s]+' + address_pattern, message, re.IGNORECASE)
            new_match = re.search(
                r'(?:new|mailing)\s+address[:\s]+' + address_pattern, message, re.IGNORECASE)

            if current_match:
                data['current_address'] = current_match.group(
                    0).split(':')[-1].strip()
            # Prioritize explicitly labeled new address if both are present
            if new_match:
                data['new_address'] = new_match.group(0).split(':')[-1].strip()

            # If no explicit labels, just use the first found address for 'new_address' as a fallback
            if not current_match and not new_match and address_match:
                data['new_address'] = address_match.group(0)

        else:
            # For other intents, just assume one address field
            data['current_address'] = address_match.group(0)

    # Intent-specific extractions
    if intent == 'vehicle_registration' or intent == 'vehicle_transfer' or intent == 'vehicle_title':
        vehicle_pattern = r'(?:(?:make|model|year)[:\s]+)?([A-Za-z0-9\s]+ car|[A-Za-z0-9\s]+ vehicle)'
        vehicle_match = re.search(vehicle_pattern, message, re.IGNORECASE)
        if vehicle_match:
            data['vehicle_info'] = vehicle_match.group(1).strip()

    if intent == 'vehicle_transfer':
        buyer_pattern = r'(?:buyer\'?s?\s+name[:\s]+)?([A-Za-z\s]+)'
        buyer_match = re.search(buyer_pattern, message, re.IGNORECASE)
        if buyer_match:
            data['buyer_info'] = buyer_match.group(1).strip()

    if intent == 'license_renewal':
        current_license_pattern = r'(?:current\s+)?(?:driver\'?s?\s+)?license\s+number[:\s]+([A-Za-z0-9]+)'
        current_license_match = re.search(
            current_license_pattern, message, re.IGNORECASE)
        if current_license_match:
            data['current_license'] = current_license_match.group(1).strip()

    if intent == 'new_resident':
        out_of_state_license_pattern = r'(?:out-of-state|out of state)\s+license\s+number[:\s]+([A-Za-z0-9]+)'
        out_of_state_license_match = re.search(
            out_of_state_license_pattern, message, re.IGNORECASE)
        if out_of_state_license_match:
            data['out_of_state_license'] = out_of_state_license_match.group(
                1).strip()
        ssn_pattern = r'(?:social\s+security\s+number|ssn)[:\s]+(\d{3}-\d{2}-\d{4}|\d{9})'
        ssn_match = re.search(ssn_pattern, message, re.IGNORECASE)
        if ssn_match:
            data['ssn'] = ssn_match.group(1).strip()

    if intent == 'real_id':
        ssn_pattern = r'(?:social\s+security\s+number|ssn)[:\s]+(\d{3}-\d{2}-\d{4}|\d{9})'
        ssn_match = re.search(ssn_pattern, message, re.IGNORECASE)
        if ssn_match:
            data['ssn'] = ssn_match.group(1).strip()
        proof_pattern = r'(?:proof\s+of\s+residence)[:\s]+([A-Za-z\s]+)'
        proof_match = re.search(proof_pattern, message, re.IGNORECASE)
        if proof_match:
            data['proof_of_residence'] = proof_match.group(1).strip()

    if intent == 'dmv_appointment':
        service_pattern = r'(?:service\s+type)[:\s]+([A-Za-z\s]+)'
        service_match = re.search(service_pattern, message, re.IGNORECASE)
        if service_match:
            data['service_type'] = service_match.group(1).strip()
        date_pattern = r'(?:preferred\s+date)[:\s]+(\d{1,2}/\d{1,2}/\d{4})'
        date_match = re.search(date_pattern, message)
        if date_match:
            data['preferred_date'] = date_match.group(1).strip()

    return data


def home(request):
    return render(request, 'chatbot/index.html')


@api_view(['POST'])
def chat(request):
    # Parse request data
    data = request.data
    user_message = data.get('message', '')
    user_location = data.get('location', 'California')
    
    # Extract intent
    intent = extract_intent(user_message)
    
    # Get form template if an intent is detected
    form_template = None
    if intent:
        form_template = get_form_template(intent)
        
    # Extract form data if an intent is detected
    form_data = {}
    if intent:
        form_data = extract_form_data(user_message, intent)
    
    # Load the system prompt for the chatbot
    try:
        system_prompt_path = Path(__file__).resolve().parent.parent / 'mcp_location_prompt.txt'
        with open(system_prompt_path, 'r') as f:
            system_prompt = f.read()
    except FileNotFoundError:
        system_prompt = """You are a helpful government services assistant. You can help users with various government services and forms.
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
        # Initialize the RAG system
        knowledge_base_dir = os.path.join(Path(__file__).resolve().parent.parent, 'knowledge_base')
        rag_system = RAGSystem(knowledge_base_dir=knowledge_base_dir, openai_api_key=settings.OPENAI_API_KEY)
        
        # Generate response using RAG
        bot_response, sources = rag_system.generate_response(
            user_query=user_message,
            system_prompt=system_prompt,
            location=user_location
        )
        
        # If RAG fails, fall back to standard OpenAI completion
        if not bot_response:
            # Add location context to the system message
            system_message = f"{system_prompt}\n\nCurrent user location: {user_location}"
            
            # Prepare messages for the API call
            messages = [
                {"role": "system", "content": system_message}
            ]
            
            # Add message specifying the intent if detected
            if intent:
                intent_message = f"The user is asking about {intent.replace('_', ' ')}. "
                if form_template:
                    intent_message += f"This requires the {form_template['form_name']}. "
                    intent_message += f"Required fields: {', '.join(form_template['required_fields'])}"
                messages.append({"role": "system", "content": intent_message})
            
            # Add the user's message
            messages.append({"role": "user", "content": user_message})
            
            # Make the API call to OpenAI
            response = openai.ChatCompletion.create(
                model="gpt-4o-mini",
                messages=messages,
                temperature=0.7,
                max_tokens=1000
            )
            
            # Extract the response
            bot_response = response.choices[0].message.content
            sources = []
        
        # Return the response along with any form data and sources
        response_data = {
            'response': bot_response,
            'intent': intent,
            'form_template': form_template,
            'form_data': form_data,
            'location': user_location,
            'sources': sources
        }
        
        return Response(response_data)

    except Exception as e:
        return Response({'error': str(e)}, status=500)


@api_view(['POST'])
def submit_dmv_form(request):
    try:
        form_data = request.data
        form_type = form_data.get('form_type')

        if not form_type or form_type not in CA_DMV_INTENTS:
            return Response({'error': 'Invalid form type'}, status=400)

        # Check if the intent has fields defined before validating
        if CA_DMV_INTENTS[form_type].get('fields'):
            # Validate required fields
            required_fields = CA_DMV_INTENTS[form_type]['fields']
            missing_fields = [
                field for field in required_fields if not form_data.get(field)]

            # Handle nested address fields specifically for validation
            if form_type in ['address_change', 'license_replacement', 'vehicle_registration', 'vehicle_transfer', 'license_renewal', 'vehicle_title', 'new_resident', 'real_id']:
                address_types = ['current_address', 'new_address'] if form_type == 'address_change' else [
                    'current_address']
                for addr_type in address_types:
                    if addr_type in form_data:
                        # Check essential address fields within the nested object
                        # County is optional
                        for addr_part in ['street', 'city', 'state', 'zip']:
                            if not form_data[addr_type].get(addr_part):
                                missing_fields.append(
                                    f'{addr_type}.{addr_part}')
                    elif addr_type in [field['id'] for field in CA_DMV_INTENTS[form_type]['fields'] if 'addressType' in field]:
                        # If the entire address object is missing but fields are required
                        missing_fields.append(addr_type)

            if missing_fields:
                return Response({
                    'success': False,
                    'message': f'Missing required fields: {", ".join(missing_fields)}'
                })

        # In a real application, you would save this to a database
        # For now, we'll just return success
        return Response({
            'success': True,
            'message': f'Your {CA_DMV_INTENTS[form_type]["name"]} has been submitted successfully.'
        })

    except Exception as e:
        return Response({'error': str(e)}, status=500)
