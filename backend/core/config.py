import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

_llm_instance = None

def get_llm():
    global _llm_instance
    if _llm_instance is None:
        if not os.getenv("GOOGLE_API_KEY"):
            print("GOOGLE_API_KEY not found in .env")
            # Return a dummy or raise error depending on needs.
            # For now, we return None or let it fail when initialized if key is missing.
            # But to allow import without key, we delay initialization.
            pass

        # Only initialize if we have a key or we want to let it fail at runtime, not import time.
        # However, ChatGoogleGenerativeAI might validate immediately.
        # Let's try to initialize it.
        try:
            _llm_instance = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5)
        except Exception as e:
            print(f"Failed to initialize LLM: {e}")
            raise

    return _llm_instance
