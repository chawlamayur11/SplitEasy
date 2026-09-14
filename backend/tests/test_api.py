import os
import sys
import pytest
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..")))

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.database import Base, get_db


from sqlalchemy.pool import StaticPool

# In-memory SQLite for testing with StaticPool to retain tables across connections
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


def test_expense_and_balance_calculation(client):
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

    # 3. Check balances
    bal_res = client.get(f"/api/groups/{group_id}/balances")
    assert bal_res.status_code == 200
    bal_data = bal_res.json()

    balances = {b["participant_id"]: b["net_balance"] for b in bal_data["balances"]}
    assert balances[alice_id] == 60.0   # Paid 90, owes 30 => +60
    assert balances[bob_id] == -30.0    # Paid 0, owes 30  => -30
    assert balances[charlie_id] == -30.0 # Paid 0, owes 30  => -30

    assert len(bal_data["settlements"]) == 2

    # 4. Settle Bob's debt to Alice ($30)
    stl_res = client.post(f"/api/groups/{group_id}/settle", json={
        "payer_id": bob_id,
        "payee_id": alice_id,
        "amount": 30.0
    })
    assert stl_res.status_code == 201

    # 5. Check updated balances
    bal_res_after = client.get(f"/api/groups/{group_id}/balances")
    bal_data_after = bal_res_after.json()
    balances_after = {b["participant_id"]: b["net_balance"] for b in bal_data_after["balances"]}

    assert balances_after[bob_id] == 0.0
    assert balances_after[alice_id] == 30.0
    assert balances_after[charlie_id] == -30.0
