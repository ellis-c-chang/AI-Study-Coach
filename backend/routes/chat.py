from flask import Blueprint, request, jsonify
from openai import OpenAI
import os
from dotenv import load_dotenv
from backend.utils.error_handler import handle_error

load_dotenv()

chat_bp = Blueprint('chat', __name__)

# Initialize OpenAI API key from .env
#openai.api_key = os.getenv("OPENAI_API_KEY")

client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
USE_OPENAI_API = os.getenv("USE_OPENAI_API", "False") == "True"

#print("Loaded OpenAI API Key:", openai.api_key)

# Chat endpoint
@chat_bp.route('/', methods=['POST'])
def chat_with_ai():
    try:
        data = request.get_json()
        user_message = data.get('message', '')

        if not user_message:
            return handle_error('Message is required', 400)

        # mock response for development
        if not USE_OPENAI_API:
            mock_response = f"(Mock Response) You asked: '{user_message}'. Here's a helpful suggestion."
            return jsonify({'response': mock_response}), 200

        response = client.chat.completions.create(
            model="gpt-4o-mini",
            messages=[
                {"role": "system", "content": "You are a helpful study assistant."},
                {"role": "user", "content": user_message}
            ],
            max_tokens=150,
            temperature=0.7
        )
        answer = response['choices'][0]['message']['content'].strip()
        return jsonify({'response': answer}), 200
    except Exception as e:
        print(f"OpenAI Error: {str(e)}")
        return handle_error('Failed to get a response from OpenAI', 500)
    #except Exception as e:
    #    print(f"Chatbot Error: {str(e)}")
    #    return handle_error('An error occurred while processing your request', 500)
