from fastapi import HTTPException
import google.generativeai as genai
from Configuration.config import Api_key

genai.configure(api_key=Api_key)

def get_gemini_embeddings(texts):
    try:
        embeddings = []
        for text in texts:
            response = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )
            embedding = response["embedding"]
            if len(embedding) != 768:
                raise ValueError(f"Embedding for '{text}' has length {len(embedding)}, expected 768")
            embeddings.append(embedding)
        return embeddings
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API error: {str(e)}")

def format_answer_with_gemini(answers, original_query):
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"""
You are given a list of answers to sub-questions related to a user query: '{original_query}'.

Your task is to format these answers into a clear and well-structured markdown response with the following rules:

1. **General Formatting**:
   - Use **bold headings** for different topics or sections, except as specified below.
   - Use **bullet points** to list out key information or steps.
   - Use proper **markdown syntax** (e.g., `**` for bold text).
   - Do not use bullet points if there is only a single point under a bold heading.

2. **Single Answer Handling**:
   - If there is only one answer and it is **ambiguous**, return **exactly** this message without any heading: "Please provide more clarity or select from the options below."
   - If there is only one answer and it is **non-ambiguous**, add a relevant heading and format the content with bullet points if applicable.
   - If there is only one answer and it is **no_match**, add a relevant heading (e.g., "No Match Found") and state the message.

3. **Multiple Answer Handling**:
   - If multiple sub-questions have related **non-ambiguous** answers, combine them into a single cohesive section with a bold heading.
   - **Ambiguous answers must be treated as separate sections** with a relevant heading (e.g., "Basic Sourcing") and return **exactly** this message: "Please provide more clarity or select from the options below." **Do not modify, truncate, or combine this message with other answers.**
   - If an answer contains `"no_match"`, create a separate section with a heading and explicitly state the message.

4. **Special Cases**:
   - For ambiguous answers, **do not include** the suggestions (possible questions) in the response, as they will be handled separately.
   - For `"no_match"`, explicitly state the message (e.g., "No match found for this query.").

5. **Important Notes**:
   - Do **not** use the original query as a heading.
   - Do **not** add or infer any content on your own—only format the provided data.
   - Keep the structure clean, readable, and concise.
   - Ensure each sub-question's answer has its own section with a relevant heading for multiple answers, except for a single ambiguous answer.

Answers:
{answers}

Return the final result in **markdown format** only.
"""

        response = model.generate_content(prompt)
        return response.text
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini formatting error: {str(e)}")