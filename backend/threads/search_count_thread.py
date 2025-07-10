from queue import Queue
from typing import List
from psycopg2.extras import RealDictCursor
from Configuration.config import db_pool

def update_search_counts(sub_questions: List[str], query_embeddings: List[List[float]], query_type: str, result_queue: Queue):
    """Update search counts in popular_question table."""
    conn = db_pool.getconn()
    try:
        cursor = conn.cursor(cursor_factory=RealDictCursor)
        for sub_query, query_embedding in zip(sub_questions, query_embeddings):
            vector_str = f'[{",".join(map(str, query_embedding))}]'
            # Check for similar questions (80% similarity, cosine distance < 0.2)
            cursor.execute(
                """
                SELECT id, question
                FROM popular_question
                WHERE category = %s
                AND question_embedding IS NOT NULL
                AND question_embedding <=> %s::vector < 0.2
                ORDER BY question_embedding <=> %s::vector ASC
                LIMIT 1
                """,
                (query_type, vector_str, vector_str)
            )
            similar_question = cursor.fetchone()

            if similar_question:
                cursor.execute(
                    """
                    UPDATE popular_question
                    SET search_count = search_count + 1
                    WHERE id = %s
                    """,
                    (similar_question["id"],)
                )
            else:
                cursor.execute(
                    """
                    INSERT INTO popular_question (question, category, search_count, question_embedding)
                    VALUES (%s, %s, 1, %s::vector)
                    ON CONFLICT ON CONSTRAINT unique_question_category
                    DO UPDATE SET search_count = popular_question.search_count + 1
                    """,
                    (sub_query, query_type, vector_str)
                )
        conn.commit()
        result_queue.put("success")
    except Exception as e:
        result_queue.put(("error", str(e)))
        conn.rollback()
    finally:
        cursor.close()
        db_pool.putconn(conn)