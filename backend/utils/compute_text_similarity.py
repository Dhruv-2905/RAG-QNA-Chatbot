import logging
from Levenshtein import distance as levenshtein_distance

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def compute_text_similarity(text1: str, text2: str) -> float:
    if not text1 or not text2:
        return 0.0
    max_len = max(len(text1), len(text2))
    edit_distance = levenshtein_distance(text1.lower(), text2.lower())
    return 1.0 - (edit_distance / max_len)