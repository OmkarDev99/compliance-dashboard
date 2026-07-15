from sentence_transformers import SentenceTransformer
import numpy as np

model = SentenceTransformer("BAAI/bge-base-en-v1.5")

sentence1 = "Companies must file XBRL returns within 30 days."
sentence2 = "XBRL filing deadline is 30 days for firms."       # similar meaning
sentence3 = "The weather in Mumbai is humid today."             # unrelated

v1 = model.encode(sentence1, normalize_embeddings=True)
v2 = model.encode(sentence2, normalize_embeddings=True)
v3 = model.encode(sentence3, normalize_embeddings=True)

def cosine_similarity(a, b):
    return np.dot(a, b)   # since vectors are normalized, dot product = cosine similarity

print("similar sentences  :", cosine_similarity(v1, v2))
print("unrelated sentences:", cosine_similarity(v1, v3))