from sentence_transformers import SentenceTransformer
import os

def download_model():
    print("Downloading sentence transformer model...")
    model = SentenceTransformer('sentence-transformers/all-MiniLM-L6-v2')
    print("Model downloaded successfully!")

if __name__ == "__main__":
    download_model()