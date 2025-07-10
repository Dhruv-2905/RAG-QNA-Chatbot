import glob
import pandas as pd
import psycopg2
from psycopg2.extras import execute_batch
import google.generativeai as genai
from dotenv import load_dotenv
import os
# from Configuration.config import Api_key, db_host, db_name, db_password, db_port, db_user

load_dotenv()

Api_key = os.getenv("GOOGLE_API_KEY")
db_name= os.getenv("DB_NAME")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")

genai.configure(api_key=Api_key)
# === GET GEMINI EMBEDDING ===
def get_gemini_embedding(text):
    try:
        response = genai.embed_content(
            model="models/text-embedding-004",
            content=text,
            task_type="semantic_similarity"
        )
        return response["embedding"]
    except Exception as e:
        print(f"Embedding error: {e}")
        return [0.0] * 768  # fallback vector

# === STEP 1: READ EXCEL FILES ===
# all_files = glob.glob("../data/buyer_data/*.xlsx")
all_files = glob.glob("../data/supplier_data/*.xlsx")
print("Found Excel files:", all_files)

df_list = []
for file in all_files:
    try:
        xl = pd.ExcelFile(file)
        sheet_name = xl.sheet_names[0]
        df = xl.parse(sheet_name)
        print(f"Processing: {file}, Sheet: {sheet_name}")

        # Normalize column names
        df.columns = [col.strip().lower() for col in df.columns]
        if "questions" in df.columns and "chat bot reply" in df.columns:
            df_filtered = df[["questions", "chat bot reply"]].copy()
            df_filtered.columns = ["Questions", "Chat Bot Reply"]
            df_list.append(df_filtered)
        else:
            print(f"Skipped {file}: Required columns not found")
    except Exception as e:
        print(f"Error reading {file}: {e}")

# === STEP 2: CLEAN + SAVE CSV ===
if not df_list:
    raise Exception("No valid Excel files to process.")

combined_df = pd.concat(df_list, ignore_index=True)
combined_df["Questions"] = combined_df["Questions"].str.lower().str.strip()
combined_df.drop_duplicates(subset="Questions", inplace=True)
combined_df.to_csv("qna_dataset.csv", index=False)
print("Cleaned and saved as qna_dataset.csv")

# === STEP 3: GENERATE EMBEDDINGS ===
questions = combined_df["Questions"].tolist()
embeddings = []
print("Generating embeddings...")
for i in range(0, len(questions), 10):
    batch = questions[i:i+10]
    batch_embeddings = [get_gemini_embedding(q) for q in batch]
    embeddings.extend(batch_embeddings)
print("Embeddings generated successfully.")

# === STEP 4: LOAD INTO POSTGRES WITH PGVECTOR ===
print("Connecting to PostgreSQL...")
conn = psycopg2.connect(
    dbname=db_name,
    user=db_user,
    password=db_password,
    host=db_host,
    port=db_port
)
cursor = conn.cursor()

cursor.execute("""
    CREATE EXTENSION IF NOT EXISTS vector;
    CREATE TABLE IF NOT EXISTS supplier_qna (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL,
        answer TEXT NOT NULL,
        normalized_question TEXT NOT NULL,
        question_embedding vector(768)
    );
    CREATE INDEX IF NOT EXISTS idx_question_embedding ON supplier_qna USING hnsw (question_embedding vector_cosine_ops);
    CREATE TABLE IF NOT EXISTS supplier_search_counts (
        id SERIAL PRIMARY KEY,
        question TEXT NOT NULL UNIQUE,
        search_count INTEGER DEFAULT 1,
        normalized_question TEXT NOT NULL
    );
""")

# === STEP 5: BATCH INSERT ===
insert_query = """
    INSERT INTO supplier_qna (question, answer, normalized_question, question_embedding)
    VALUES (%s, %s, %s, %s)
"""
data = [
    (row.Questions, row._2, row.Questions.lower(), embedding)
    for row, embedding in zip(combined_df.itertuples(), embeddings)
]
execute_batch(cursor, insert_query, data)

conn.commit()
cursor.close()
conn.close()
print("✅ Data loaded into PostgreSQL successfully.")
