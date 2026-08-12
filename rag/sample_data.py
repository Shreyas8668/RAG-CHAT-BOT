import datetime
from typing import List
from .types import DocumentItem

PRESET_DOCUMENTS: List[DocumentItem] = [
    DocumentItem(
        id="doc-preset-ai",
        name="Artificial_Intelligence_Primer.md",
        type="md",
        content="""# Artificial Intelligence & Machine Learning Overview

Artificial Intelligence (AI) refers to computer systems engineered to simulate human intelligence tasks such as learning, reasoning, problem-solving, and perception.

## Core Branches of AI
1. **Machine Learning (ML)**: Statistical algorithms that enable computers to learn from data patterns without explicit rule programming.
2. **Deep Learning (DL)**: Multi-layered artificial neural networks (ANNs) inspired by biological brain architectures. Deep learning excels at image recognition, audio processing, and natural language processing.
3. **Retrieval-Augmented Generation (RAG)**: A modern AI technique that combines vector database retrieval with Generative Large Language Models (LLMs). RAG grounds AI responses in real-time verified knowledge sources, preventing hallucinations.

## Key Principles of RAG
- **Ingestion & Chunking**: Documents are split into semantic fragments or passages.
- **Vector Embedding**: Text chunks are mapped into high-dimensional vector spaces using embedding models.
- **Cosine Similarity Lookup**: Incoming user queries are converted to vectors and compared against stored chunk vectors using cosine similarity math: $\\text{sim}(A,B) = \\frac{A \\cdot B}{\\|A\\| \\|B\\|}$.
- **Contextual Synthesis**: Top matching chunks are retrieved and injected into the LLM system prompt for verified context-grounded response generation.
""",
        sizeBytes=1240,
        uploadedAt=datetime.datetime.now().isoformat(),
        tags=["AI", "RAG", "Machine Learning", "LLM"],
        isPreset=True
    ),
    DocumentItem(
        id="doc-preset-quantum",
        name="Quantum_Computing_Fundamentals.txt",
        type="txt",
        content="""Quantum Computing Fundamentals & Architectures

Quantum computing leverages quantum mechanical phenomena such as superposition, entanglement, and quantum interference to process complex computations exponentially faster than classical computers.

1. Superposition: Unlike classical binary bits (0 or 1), quantum bits (qubits) can exist simultaneously in a linear combination of states |0⟩ and |1⟩.
2. Quantum Entanglement: Qubits become linked such that the quantum state of one instantly dictates the state of another, regardless of physical separation distance.
3. Quantum Algorithms: Shor's algorithm provides exponential speedup for integer factorization, while Grover's algorithm offers quadratic speedup for unstructured database searches.

Applications:
- Molecular simulation & drug discovery
- Financial risk portfolio optimization
- Post-quantum cryptography & lattice security
- Logistics & supply chain route optimization
""",
        sizeBytes=980,
        uploadedAt=datetime.datetime.now().isoformat(),
        tags=["Quantum", "Physics", "Computing"],
        isPreset=True
    ),
    DocumentItem(
        id="doc-preset-hr",
        name="Enterprise_HR_Policy_2026.md",
        type="md",
        content="""# Enterprise Employee Handbook & HR Policy

Welcome to our organization! This guide outlines key working guidelines, remote policies, and benefits.

## Remote Work Policy
Employees are eligible for a flexible hybrid schedule with 3 days in office and 2 remote days per week. Remote equipment stipend of up to $500 per year is available for home office setup.

## Paid Time Off (PTO)
- Full-time staff receive 20 days of paid vacation per calendar year.
- Sick leave: 10 days of fully paid medical leave per year.
- Parental leave: 16 weeks of fully paid parental leave for primary caregivers.

## Professional Development Stipend
Each employee is entitled to $1,500 annually for attending conferences, enrolling in courses, or purchasing technical certification vouchers.
""",
        sizeBytes=850,
        uploadedAt=datetime.datetime.now().isoformat(),
        tags=["HR", "Company", "Benefits", "Policy"],
        isPreset=True
    )
]
