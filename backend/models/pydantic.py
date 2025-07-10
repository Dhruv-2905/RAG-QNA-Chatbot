from pydantic import BaseModel, Field
from enum import Enum

class QueryType(str, Enum):
    BUYER = "buyer"
    SUPPLIER = "supplier"

class QueryRequest(BaseModel):
    question: str = None
    type: QueryType = Field(..., description="Type of query, either 'buyer' or 'supplier'")
    from_idx: int = Field(default=0, description="Starting index for pagination", ge=0)
    to_idx: int = Field(default=20, description="Ending index for pagination", gt=0)