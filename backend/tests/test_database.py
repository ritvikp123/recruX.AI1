import pytest
import sqlite3
import os
import json
from utils.database import init_db, save_profile, get_profile, DB_PATH

@pytest.fixture(autouse=True)
def setup_test_db(monkeypatch, tmp_path):
    # Use a temporary database for testing
    test_db = tmp_path / "test_recrux.db"
    monkeypatch.setattr("utils.database.DB_PATH", str(test_db))
    init_db()
    yield

def test_save_and_get_profile():
    profile_id = "test_user_123"
    profile_data = {
        "id": profile_id,
        "full_name": "Test User",
        "email": "test@example.com",
        "professional_summary": "Expert dev",
        "skills": ["Python", "Docker"],
        "ats_score": 85,
        "raw_text": "Sample resume content"
    }
    role_name = "Backend Engineer"
    
    save_profile(profile_data, role_name)
    
    profile = get_profile(profile_id)
    assert profile is not None
    assert profile["id"] == profile_id
    assert profile["full_name"] == "Test User"
    assert profile["skills"] == ["Python", "Docker"]
    assert profile["ats_score"] == 85
    assert profile["role_name"] == role_name
    assert profile["raw_text"] == "Sample resume content"

def test_get_nonexistent_profile():
    profile = get_profile("nonexistent")
    assert profile is None
