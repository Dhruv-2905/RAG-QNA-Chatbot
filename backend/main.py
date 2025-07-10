from fastapi import FastAPI, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from psycopg2.extras import RealDictCursor
import google.generativeai as genai
import re
from gemini_function.prompt import format_answer_with_gemini, get_gemini_embeddings
from utils.nlp_utils import extract_sub_questions
from models.pydantic import QueryRequest
from Configuration.config import db_pool, Api_key
import threading
from queue import Queue
from threads.search_count_thread import update_search_counts
from threads.answer_retrieval_thread import retrieve_answers
from pydantic import ValidationError
from utils.patterns import GRATITUDE_PATTERNS, GREETING_PATTERNS, FILLER_PHRASES
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
genai.configure(api_key=Api_key)

router = APIRouter()
@router.post("/chat/")
async def ask_question(request: QueryRequest):
    try:
        query = request.question
        query_type = request.type

        query_lower = query.lower().strip()
        if any(re.search(pattern, query_lower) for pattern in GREETING_PATTERNS):
            return {
                "answers": "Welcome! How can I assist you today?",
                "ambiguous_data": []
            }
        if any(re.search(pattern, query_lower) for pattern in GRATITUDE_PATTERNS):
            return {
                "answers": "Happy to help! Please let me know if you need further assistance.",
                "ambiguous_data": []
            }

        sub_questions = extract_sub_questions(query)

        query_embeddings = get_gemini_embeddings(sub_questions)

        search_count_queue = Queue()
        answer_queue = Queue()

        search_thread = threading.Thread(
            target=update_search_counts,
            args=(sub_questions, query_embeddings, query_type, search_count_queue)
        )
        answer_thread = threading.Thread(
            target=retrieve_answers,
            args=(sub_questions, query_embeddings, query_type, answer_queue)
        )

        search_thread.start()
        answer_thread.start()

        search_thread.join()
        answer_thread.join()

        search_result = search_count_queue.get()
        if isinstance(search_result, tuple) and search_result[0] == "error":
            raise HTTPException(status_code=500, detail=f"Search count update error: {search_result[1]}")
        
        answer_result = answer_queue.get()
        if isinstance(answer_result, tuple) and answer_result[0] == "error":
            raise HTTPException(status_code=500, detail=f"Answer retrieval error: {answer_result[1]}")

        return answer_result[1]

    except ValidationError:
        raise HTTPException(status_code=400, detail="Type can only be buyer or supplier")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")

@router.post("/popular-questions/")
async def get_popular_questions(request: QueryRequest):
    try:
        query_type = request.type

        conn = db_pool.getconn()
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            cursor.execute(
                """
                SELECT question
                FROM popular_question
                WHERE category = %s
                ORDER BY search_count DESC
                LIMIT 10
                """,
                (query_type,)
            )
            results = cursor.fetchall()
            questions = [row["question"] for row in results]
            return {
                "popular_questions": questions,
            }
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            cursor.close()
            db_pool.putconn(conn)
    except ValidationError:
        raise HTTPException(status_code=400, detail="Type can only be buyer or supplier")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
@router.post("/search/")
async def search_question(request: QueryRequest):
    try:
        query = request.question.strip()
        query_type = request.type
        from_idx = request.from_idx
        to_idx = request.to_idx

        logger.info(f"Searching for query: '{query}' with type: '{query_type}' from: {from_idx} to: {to_idx}")

        # Validate pagination parameters
        if from_idx < 0 or to_idx < from_idx:
            raise HTTPException(status_code=400, detail="Invalid pagination parameters")

        table_name = "qna" if query_type.lower() == "buyer" else "supplier_qna" if query_type.lower() == "supplier" else None
        if not table_name:
            raise HTTPException(status_code=400, detail="Invalid table name")

        query_lower = query.lower()
        for filler in FILLER_PHRASES:
            query_lower = re.sub(filler, " ", query_lower, flags=re.IGNORECASE)
        query_lower = re.sub(r"\s+", " ", query_lower).strip()

        keywords = []
        known_phrases = ["basic sourcing", "payment terms", "request for quotation", "rfq"]
        query_words = query_lower.split()
        i = 0
        while i < len(query_words):
            found_phrase = False
            for phrase in known_phrases:
                phrase_words = phrase.split()
                if i + len(phrase_words) <= len(query_words):
                    if " ".join(query_words[i:i + len(phrase_words)]) == phrase:
                        keywords.append(phrase)
                        i += len(phrase_words)
                        found_phrase = True
                        break
            if not found_phrase:
                keywords.append(query_words[i])
                i += 1

        keywords = [k.strip() for k in keywords if k.strip() and k not in ["some", "questions"]]
        if not keywords:
            logger.info("No valid keywords in query")
            return {"matching_questions": [], "totalNumbers": 0}

        conn = db_pool.getconn()
        try:
            cursor = conn.cursor(cursor_factory=RealDictCursor)
            where_conditions = " AND ".join(["question ILIKE %s" for _ in keywords])
            query_params = [f"%{keyword}%" for keyword in keywords]
            limit = to_idx - from_idx
            sql_query = f"""
                SELECT question
                FROM {table_name}
                WHERE {where_conditions}
                LIMIT %s OFFSET %s
            """
            paginated_params = query_params + [limit, from_idx]
            logger.info(f"Executing SQL for results: {sql_query} with params: {paginated_params}")
            cursor.execute(sql_query, paginated_params)
            results = cursor.fetchall()
            questions = [row["question"] for row in results]

            count_query = f"""
                SELECT COUNT(*) as total
                FROM {table_name}
                WHERE {where_conditions}
            """
            logger.info(f"Executing SQL for count: {count_query} with params: {query_params}")
            cursor.execute(count_query, query_params)
            total_count = cursor.fetchone()["total"]

            logger.info(f"Found {len(questions)} matching questions, total count: {total_count}")

            return {
                "matching_questions": questions,
                "totalNumbers": total_count
            }
        except Exception as e:
            logger.error(f"Error executing SQL query: {str(e)}")
            raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
        finally:
            cursor.close()
            db_pool.putconn(conn)

    except ValidationError as e:
        logger.error(f"Validation error: {str(e)}")
        raise HTTPException(status_code=400, detail="Invalid query type: must be either 'buyer' or 'supplier'")
    except Exception as e:
        logger.error(f"Error processing query: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error: {str(e)}")
    
app.include_router(router, prefix="/api")