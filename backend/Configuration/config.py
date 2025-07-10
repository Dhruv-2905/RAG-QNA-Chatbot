from dotenv import load_dotenv
from psycopg2.pool import SimpleConnectionPool
import os

load_dotenv()


Api_key = os.getenv("GOOGLE_API_KEY")
db_name= os.getenv("DB_NAME")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")
db_host = os.getenv("DB_HOST")
db_port = os.getenv("DB_PORT")

db_pool = SimpleConnectionPool(
    minconn=1,
    maxconn=10,
    dbname=db_name,
    user=db_user,
    password=db_password,
    host=db_host,
    port=db_port
)