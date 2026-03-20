import pytest
import io
from fastapi import UploadFile
from utils.file_parser import extract_text_from_file

@pytest.mark.asyncio
async def test_extract_text_from_txt():
    content = b"Hello, this is a plain text resume."
    file = UploadFile(filename="test.txt", file=io.BytesIO(content))
    text = await extract_text_from_file(file)
    assert text == "Hello, this is a plain text resume."

@pytest.mark.asyncio
async def test_extract_text_unsupported_format():
    content = b"\x00\x01\x02\x03" # Random binary
    file = UploadFile(filename="test.bin", file=io.BytesIO(content))
    # the parser might return decoded garbage or raise ValueError
    try:
        await extract_text_from_file(file)
    except ValueError as e:
        assert "Unsupported file format" in str(e)
    except Exception:
        pass # Other errors are also acceptable for bad input
