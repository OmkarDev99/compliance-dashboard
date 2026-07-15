from sentence_transformers import SentenceTransformer

# First time this runs, it downloads the model (~440MB) to a local cache folder
# (~/.cache/huggingface by default). After that, it loads instantly from disk.
model = SentenceTransformer("BAAI/bge-base-en-v1.5")

text = "Companies must file XBRL returns within 30 days."
vector = model.encode(text)

print(type(vector))     # numpy array
print(vector.shape)     # (768,)  <- 768 numbers representing this sentence
print(vector[:5])       # first 5 numbers, just to peek