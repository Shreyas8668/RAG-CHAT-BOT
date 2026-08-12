import json
import csv
import io
import datetime
from typing import List, Optional
from .types import DocumentItem
from .sample_data import PRESET_DOCUMENTS

def load_text_content(content: str, filename: str, tags: Optional[List[str]] = None) -> DocumentItem:
    """
    Constructs a DocumentItem from raw text content and filename.
    """
    ext = filename.split('.')[-1].lower() if '.' in filename else 'txt'
    doc_id = f"doc-{hash(filename) & 0xffffffff}"
    
    return DocumentItem(
        id=doc_id,
        name=filename,
        type=ext,
        content=content,
        sizeBytes=len(content.encode('utf-8')),
        uploadedAt=datetime.datetime.now().isoformat(),
        tags=tags or ["uploaded"],
        isPreset=False
    )

def parse_json_content(content: str) -> str:
    """
    Parses JSON data into readable text passages for RAG chunking.
    """
    try:
        data = json.loads(content)
        if isinstance(data, list):
            items = [json.dumps(item, indent=2) for item in data]
            return "\n\n".join(items)
        elif isinstance(data, dict):
            return "\n".join([f"{k}: {v}" for k, v in data.items()])
        return str(data)
    except Exception:
        return content

def parse_csv_content(content: str) -> str:
    """
    Parses CSV data into formatted row descriptions.
    """
    try:
        reader = csv.reader(io.StringIO(content))
        rows = list(reader)
        if not rows:
            return content
        header = rows[0]
        passages = []
        for i, row in enumerate(rows[1:], start=1):
            row_str = ", ".join([f"{header[j]}: {val}" for j, val in enumerate(row) if j < len(header)])
            passages.append(f"Row {i} - {row_str}")
        return "\n".join(passages)
    except Exception:
        return content

def get_preset_documents() -> List[DocumentItem]:
    """
    Returns pre-configured sample document items.
    """
    return PRESET_DOCUMENTS
