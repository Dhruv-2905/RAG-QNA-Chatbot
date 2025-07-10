from queue import Queue
from typing import List
from psycopg2.extras import RealDictCursor
from Configuration.config import db_pool
from utils.nlp_utils import fetch_answers_from_db, analyze_results
from gemini_function.prompt import format_answer_with_gemini
import re
from utils.compute_text_similarity import compute_text_similarity
from utils.patterns import no_answer_patterns

def retrieve_answers(sub_questions: List[str], query_embeddings: List[List[float]], query_type: str, result_queue: Queue):
    """Retrieve and format answers from qna/supplier_qna, logging unanswered questions to error_logs with similarity check."""
    conn = db_pool.getconn()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        answers = []
        ambiguous_data = []

        for sub_query, query_embedding in zip(sub_questions, query_embeddings):
            results = fetch_answers_from_db(cursor, query_embedding, query_type)
            answer = analyze_results(sub_query, results)
            if answer["type"] == "ambiguous":
                ambiguous_data.extend([s["question"] for s in answer.get("suggestions", [])])
            answers.append(answer)

        formatted_response = format_answer_with_gemini(answers, " ".join(sub_questions))

        for sub_query, answer in zip(sub_questions, answers):
            if any(re.search(pattern, formatted_response, re.IGNORECASE) for pattern in no_answer_patterns):
                cursor.execute(
                    """
                    SELECT question
                    FROM error_logs
                    WHERE category = %s
                    """,
                    (query_type,)
                )
                existing_questions = [row["question"] for row in cursor.fetchall()]
                should_insert = True
                for existing_question in existing_questions:
                    similarity = compute_text_similarity(sub_query, existing_question)
                    if similarity >= 0.8:  # 80% threshold
                        should_insert = False
                        break
                
                if should_insert:
                    cursor.execute(
                        """
                        INSERT INTO error_logs (question, category)
                        VALUES (%s, %s)
                        """,
                        (sub_query, query_type)
                    )

        conn.commit()
        result_queue.put(("success", {"answers": formatted_response, "ambiguous_data": ambiguous_data}))
    except Exception as e:
        conn.rollback()
        result_queue.put(("error", str(e)))
    finally:
        cursor.close()
        db_pool.putconn(conn)