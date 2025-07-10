from typing import List, Dict, Any
import spacy

nlp = spacy.load("en_core_web_sm")

def extract_sub_questions(query: str) -> List[str]:
    doc = nlp(query)
    sub_questions = []

    sentences = [sent.text.strip() for sent in doc.sents]

    for sent in sentences:
        sent_doc = nlp(sent)
        clauses = []
        current_clause = []

        for token in sent_doc:
            if token.lower_ in ["and"]:
                if current_clause:
                    clauses.append(" ".join(current_clause).strip())
                    current_clause = []
            else:
                current_clause.append(token.text)

        if current_clause:
            clauses.append(" ".join(current_clause).strip())

        for clause in clauses:
            clause = clause.lower().strip()
            if clause and clause not in sub_questions:
                sub_questions.append(clause)

    return sub_questions if sub_questions else [query.lower().strip()]


def fetch_answers_from_db(cursor, embedding: List[float], query_type: str) -> List[Dict[str, Any]]:
    vector_str = f'[{",".join(map(str, embedding))}]'
    if query_type == "buyer":
        cursor.execute(
        """
        SELECT question, answer, question_embedding <=> %s::vector AS distance
        FROM qna
        ORDER BY distance ASC
        LIMIT 5
        """,
        (vector_str,)
    )
    elif query_type == "supplier":
        cursor.execute(
        """
        SELECT question, answer, question_embedding <=> %s::vector AS distance
        FROM supplier_qna
        ORDER BY distance ASC
        LIMIT 5
        """,
        (vector_str,)
    )
    return cursor.fetchall()

def analyze_results(sub_query: str, results: List[Dict[str, Any]]) -> Dict[str, Any]:
    if results:
        best_result = results[0]
        if best_result["distance"] < 0.3:
            return {
                "question": sub_query,
                "answer": best_result["answer"],
                "type": "exact"
            }
        else:
            possible_questions = [
                {"question": r["question"], "distance": r["distance"]}
                for r in results if r["distance"] < 0.5
            ]
            if possible_questions:
                return {
                    "question": sub_query,
                    "answer": "Multiple possible matches found. Please select or rephrase your question.",
                    "type": "ambiguous",
                    "suggestions": possible_questions
                }
    print(best_result)
    return {
        "question": sub_query,
        "answer": "Sorry, I couldn't find an answer for this question.",
        "type": "no_match"
    }


