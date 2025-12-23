import os
from langchain_google_genai import ChatGoogleGenerativeAI
from dotenv import load_dotenv

load_dotenv()

if not os.getenv("GOOGLE_API_KEY"):
    print("GOOGLE_API_KEY not found in .env")

llm = ChatGoogleGenerativeAI(model="gemini-2.5-flash", temperature=0.5)

def get_llm():
    return llm
