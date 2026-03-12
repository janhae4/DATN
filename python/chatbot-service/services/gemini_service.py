from google import genai
from config import AI_GEMINI_API_KEY, GEMINI_MODEL, GEMINI_EMBEDDING_MODEL
from utils_retry import retry_sync

class GeminiService:
    def __init__(self):
        if not AI_GEMINI_API_KEY:
            print("⚠️ Warning: AI_GEMINI_API_KEY is not set.")
        # SDK mới sử dụng Client object thay vì configure
        self.client = genai.Client(api_key=AI_GEMINI_API_KEY)
        self.model_name = GEMINI_MODEL

    def _convert_messages(self, messages):
        """
        Chuyển đổi sang format của google-genai SDK v1
        """
        system_instruction = None
        contents = []
        
        for msg in messages:
            if msg["role"] == "system":
                system_instruction = msg["content"]
            else:
                role = "user" if msg["role"] == "user" else "model"
                contents.append({"role": role, "parts": [{"text": msg["content"]}]})
        
        return system_instruction, contents

    @retry_sync(max_retries=3, delay=1, backoff=2)
    def get_embedding(self, text: str):
        result = self.client.models.embed_content(
            model=GEMINI_EMBEDDING_MODEL,
            contents=text,
            config={
                "task_type": "RETRIEVAL_DOCUMENT",
                "output_dimensionality": 768
            }
        )
        return result.embeddings[0].values

    @retry_sync(max_retries=3, delay=2, backoff=2)
    def chat(self, messages):
        system_instruction, contents = self._convert_messages(messages)
        
        config = {}
        if system_instruction:
            config['system_instruction'] = system_instruction

        response = self.client.models.generate_content_stream(
            model=self.model_name,
            contents=contents,
            config=config
        )
        
        for chunk in response:
            try:
                if chunk.text:
                    yield {'message': {'content': chunk.text}}
            except Exception as e:
                print(f"Error in Gemini chunk: {e}")
                continue

    @retry_sync(max_retries=3, delay=2, backoff=2)
    def chatWithOutStream(self, messages):
        system_instruction, contents = self._convert_messages(messages)
        
        config = {}
        if system_instruction:
            config['system_instruction'] = system_instruction
            
        response = self.client.models.generate_content(
            model=self.model_name,
            contents=contents,
            config=config
        )
        return {'message': {'content': response.text}}
