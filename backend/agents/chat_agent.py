from langchain_core.prompts import ChatPromptTemplate
from utils.vector_db import query_similar_jobs

from utils.llm_factory import get_llm

# Global placeholders for lazy loading
_llm = None
_prompt = None

def get_chat_chain():
    global _llm, _prompt
    if _llm is None:
        # Initialize model via factory
        _llm = get_llm(temperature=0.7)
        _prompt = ChatPromptTemplate.from_messages([
            ("system", system_prompt),
            ("human", "{question}"),
        ])
    return _prompt | _llm

system_prompt = """
You are the Recrux.AI Career Assistant. 
Provide crisp, professional, 1-2 sentence maximum answers.
Use the provided Context to give specific advice. If you don't know, say you don't know.

Context:
{context}
"""


async def ask_assistant(question: str, user_context: str = None) -> str:
    """
    Asks the Gemini assistant a question, using RAG context if available.
    """
    # 1. Try to get semantic context from Vector DB (recent jobs)
    semantic_context = ""
    try:
        # We query for similar jobs based on the question itself to see if they are asking about roles
        similar_jobs = query_similar_jobs(question, n_results=3)
        if similar_jobs:
            semantic_context = "\nRelevant Jobs found in Vector DB:\n" + "\n".join([doc.page_content for doc in similar_jobs])
    except Exception:
        pass # Fallback if Vector DB is empty or fails
        
    # 2. Combine with user provided context (like their resume text)
    full_context = f"{user_context or ''}\n{semantic_context}"
    
    # 3. Fire the LLM
    chain = get_chat_chain()
    response = await chain.ainvoke({"context": full_context, "question": question})
    
    # Ensure response content is always a string (some models return a list of blocks)
    content = response.content
    if isinstance(content, list):
        # Extract text components from content blocks if necessary
        content = "".join([
            block.get("text", "") if isinstance(block, dict) and block.get("type") == "text" else str(block)
            for block in content
        ])
    
    return str(content)
