 # Retrieval-Augmented Generation (RAG)


## Definition
RAG augments a generative LLM with a retrieval step: given a query, relevant
documents are fetched from a corpus and prepended to the prompt, giving the
model grounded context beyond its training data.


## Architecture
1. **Indexing Phase** — Documents are chunked, embedded via a bi-encoder
    (e.g. text-embedding-3-large), and stored in a vector database (e.g.
    Faiss, Pinecone, Weaviate).
2. **Retrieval Phase** — The user query is embedded; approximate nearest-
    neighbour (ANN) search returns the top-k chunks.
3. **Generation Phase** — Retrieved chunks + query are passed to the LLM
    which synthesises a final answer.


## Variants
- **Dense Retrieval**: DPR, Contriever — queries and docs in the same space.
- **Sparse Retrieval**: BM25 — term frequency-based, no embeddings needed.
- **Hybrid Retrieval**: Reciprocal Rank Fusion (RRF) combines dense + sparse.
- **Re-ranking**: A cross-encoder re-scores the top-k before the LLM sees them.


## Challenges
- Context window limits: long retrieved passages may not fit.
- Retrieval quality is a hard ceiling on generation quality.
- Chunking strategy significantly affects recall.
- Multi-hop questions require iterative retrieval (IRCoT, ReAct).


## Relationship to Transformers
RAG systems rely on transformer-based encoders for embedding and decoder
models for generation. The quality of the embedding model directly determines
retrieval precision and recall.


## References
Lewis et al. (2020). RAG for Knowledge-Intensive NLP Tasks. NeurIPS.
Gao et al. (2023). RAG for Large Language Models. arXiv:2312.10997.