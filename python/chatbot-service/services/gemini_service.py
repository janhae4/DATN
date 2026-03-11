import google.generativeai as genai
from config import GEMINI_API_KEY, GEMINI_MODEL
from utils_retry import retry_sync

class GeminiService:
    def __init__(self):
        if not GEMINI_API_KEY:
            print("⚠️ Warning: GEMINI_API_KEY is not set.")
        genai.configure(api_key=GEMINI_API_KEY)
        self.default_model = genai.GenerativeModel(GEMINI_MODEL)

    def _convert_messages(self, messages):
        system_content = None
        history = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_content = msg["content"]
            else:
                role = "user" if msg["role"] == "user" else "model"
                history.append({"role": role, "parts": [msg["content"]]})
        
        return system_content, history

    @retry_sync(max_retries=3, delay=2, backoff=2)
    def chat(self, messages):
        system_content, history = self._convert_messages(messages)
        
        model = self.default_model
        if system_content:
            model = genai.GenerativeModel(GEMINI_MODEL, system_instruction=system_content)
        
        if not history:
             return
             
        last_msg = history.pop()
        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(last_msg["parts"][0], stream=True)
        
        for chunk in response:
            try:
                if chunk.text:
                    yield {'message': {'content': chunk.text}}
            except Exception as e:
                print(f"Error in Gemini chunk: {e}")
                continue

    @retry_sync(max_retries=3, delay=2, backoff=2)
    def chatWithOutStream(self, messages):
        system_content, history = self._convert_messages(messages)
        model = self.default_model
        if system_content:
            model = genai.GenerativeModel(GEMINI_MODEL, system_instruction=system_content)
            
        if not history:
            return {'message': {'content': ""}}

        last_msg = history.pop()
        chat_session = model.start_chat(history=history)
        response = chat_session.send_message(last_msg["parts"][0])
        return {'message': {'content': response.text}}
