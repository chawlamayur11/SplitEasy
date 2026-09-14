import os
import sys
import pytest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.pool import StaticPool

from app.main import app
from app.database import Base, get_db

SQLALCHEMY_TEST_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_TEST_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

@pytest.fixture(scope="function")
def db_session():
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)

@pytest.fixture(scope="function")
def client(db_session):
    def override_get_db():
        try:
            yield db_session
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as c:
        yield c
    app.dependency_overrides.clear()


def test_root(client):
    response = client.get("/")
    assert response.status_code == 200
    assert response.json() == {"message": "SplitEasy API Server is running!"}


def test_create_and_get_group(client):
    res = client.post("/api/groups", json={
        "name": "Trip to Goa",
        "description": "Vacation 2026",
        "participant_names": ["Alice", "Bob", "Charlie"]
    })
    assert res.status_code == 201
    data = res.json()
    assert data["name"] == "Trip to Goa"
    assert len(data["participants"]) == 3

    group_id = data["id"]
    get_res = client.get(f"/api/groups/{group_id}")
    assert get_res.status_code == 200
    assert get_res.json()["id"] == group_id


def test_validation_rejects_invalid_amount(client):
    # 1. Create Group
    grp_res = client.post("/api/groups", json={"name": "Test Group", "participant_names": ["Alice", "Bob"]})
    group_id = grp_res.json()["id"]
    alice_id = grp_res.json()["participants"][0]["id"]

    # 2. Reject negative amount
    res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Invalid Negative Expense",
        "amount": -50.0,
        "payer_id": alice_id
    })
    assert res.status_code == 422

    # 3. Reject split mismatch
    res_mismatch = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Mismatch Expense",
        "amount": 100.0,
        "payer_id": alice_id,
        "splits": [
            {"participant_id": alice_id, "amount": 40.0}
        ]
    })
    assert res_mismatch.status_code == 422


def test_expense_and_balance_calculation_and_deletion(client):
    # 1. Create group with 3 members
    grp_res = client.post("/api/groups", json={
        "name": "Housemates",
        "participant_names": ["Alice", "Bob", "Charlie"]
    })
    group = grp_res.json()
    group_id = group["id"]
    alice_id = group["participants"][0]["id"]
    bob_id = group["participants"][1]["id"]
    charlie_id = group["participants"][2]["id"]

    # 2. Alice pays $90 for Groceries (split equal $30 each)
    exp_res = client.post(f"/api/groups/{group_id}/expenses", json={
        "description": "Groceries",
        "amount": 90.0,
        "payer_id": alice_id,
        "splits": [
            {"participant_id": alice_id, "amount": 30.0},
            {"participant_id": bob_id, "amount": 30.0},
            {"participant_id": charlie_id, "amount": 30.0}
        ]
    })
    assert exp_res.status_code == 201
    expense_id = exp_res.json()["id"]

    # 3. Check balances
    bal_res = client.get(f"/api/groups/{group_id}/balances")
    assert bal_res.status_code == 200
    bal_data = bal_res.json()

    balances = {b["participant_id"]: b["net_balance"] for b in bal_data["balances"]}
    assert balances[alice_id] == 60.0   # Paid 90, owes 30 => +60
    assert balances[bob_id] == -30.0    # Paid 0, owes 30  => -30
    assert balances[charlie_id] == -30.0 # Paid 0, owes 30  => -30

    # 4. Delete Expense and verify balance resets to zero
    del_res = client.delete(f"/api/groups/{group_id}/expenses/{expense_id}")
    assert del_res.status_code == 204

    bal_after_del = client.get(f"/api/groups/{group_id}/balances").json()
    balances_after = {b["participant_id"]: b["net_balance"] for b in bal_after_del["balances"]}
    assert balances_after[alice_id] == 0.0
    assert balances_after[bob_id] == 0.0
    assert balances_after[charlie_id] == 0.0
