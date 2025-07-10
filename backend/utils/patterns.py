no_answer_patterns = [
    r"No Match Found",
    r"Sorry, I couldn.?t find an answer",
    r"No information available"
]

GRATITUDE_PATTERNS = [
    r"\bthanks?\b",
    r"\bthank you\b",
    r"\bappreciate\b",
    r"\bgrateful\b",
    r"\bcheers\b",
    r"\bty\b",
]

# List of greeting patterns (case-insensitive)
GREETING_PATTERNS = [
    r"\bhi\b",
    r"\bhii\b",
    r"\bhello\b",
    r"\bhey\b",
    r"\bhowdy\b",
    r"\bgreetings?\b",
    r"\bheya?\b",
    r"\bwhat'\b",
    r"\bsup\b",
]

# List of filler phrases to remove (case-insensitive)
FILLER_PHRASES = [
    r"help me with",
    r"suggest me",
    r"some questions",
    r"what is",
    r"what do you",
    r"meant by",
    r"mean by",
    r"questions",
    r"related to",
    r"about",
    r"on",
    r"for",
    r"give me",
    r"provide",
    r"provide me",
]