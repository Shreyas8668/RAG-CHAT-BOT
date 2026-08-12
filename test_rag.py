import unittest
from rag.types import DocumentItem, RAGConfig
from rag.loader import get_preset_documents, load_text_content
from rag.chunker import chunk_document, estimate_token_count
from rag.embeddings import generate_embedding, calculate_cosine_similarity, extract_matched_terms
from rag.vector_store import VectorStore
from rag.llm_engine import generate_rag_response

class TestPythonRAGEngine(unittest.TestCase):

    def test_token_estimator(self):
        text = "Artificial intelligence and machine learning empower intelligent systems."
        tokens = estimate_token_count(text)
        self.assertGreater(tokens, 0)
        self.assertLessEqual(tokens, 20)

    def test_chunking_strategies(self):
        doc = DocumentItem(
            id="doc-test-1",
            name="test.txt",
            type="txt",
            content="Sentence one is clear. Sentence two describes RAG. Sentence three concludes the overview.",
            sizeBytes=100,
            uploadedAt="2026-08-13T00:00:00Z"
        )

        fixed_chunks = chunk_document(doc, chunk_size=40, chunk_overlap=10, strategy="fixed-size")
        self.assertGreater(len(fixed_chunks), 0)

        sentence_chunks = chunk_document(doc, chunk_size=40, chunk_overlap=10, strategy="sentence")
        self.assertGreater(len(sentence_chunks), 0)

    def test_embeddings_and_cosine_similarity(self):
        vec_a = generate_embedding("machine learning algorithms")
        vec_b = generate_embedding("deep learning neural networks")
        vec_c = generate_embedding("baking chocolate cake recipes")

        sim_ab = calculate_cosine_similarity(vec_a, vec_b)
        sim_ac = calculate_cosine_similarity(vec_a, vec_c)

        self.assertEqual(len(vec_a), 64)
        self.assertGreater(sim_ab, sim_ac)

    def test_vector_store_retrieval(self):
        store = VectorStore()
        doc = load_text_content(
            "Quantum computers process qubits using superposition and entanglement.",
            "quantum.txt"
        )
        chunks = chunk_document(doc, chunk_size=200, chunk_overlap=0)
        store.add_chunks(chunks)

        results, query_vec = store.search("Tell me about quantum qubits and superposition", top_k=1)
        self.assertEqual(len(results), 1)
        self.assertGreater(results[0].score, 0.2)
        self.assertIn("qubits", results[0].matched_terms)

    def test_llm_synthesis(self):
        store = VectorStore()
        doc = load_text_content(
            "Company PTO policy provides 20 vacation days annually and 10 sick leave days.",
            "hr.txt"
        )
        chunks = chunk_document(doc, chunk_size=200, chunk_overlap=0)
        store.add_chunks(chunks)

        results, query_vec = store.search("How many PTO vacation days do employees get?", top_k=1)
        config = RAGConfig()
        msg, trace = generate_rag_response("How many PTO vacation days do employees get?", results, query_vec, config)

        self.assertIn("20 vacation days", msg.text)
        self.assertIn("[Source 1]", msg.text)
        self.assertEqual(trace.step2_retrieved_chunks_count, 1)

if __name__ == "__main__":
    unittest.main()
