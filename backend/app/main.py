from typing import List
from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from . import models, schemas, crud, database

# Initialize Database tables
models.Base.metadata.create_all(bind=database.engine)

app = FastAPI(
    title="SplitEasy API",
    description="FastAPI Backend for SplitEasy Expense Splitter",
    version="1.0.0"
)

# Enable CORS for Frontend communication
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
def read_root():
    return {"message": "SplitEasy API Server is running!"}

@app.get("/api/groups", response_model=List[schemas.GroupResponse])
def get_groups(db: Session = Depends(database.get_db)):
    return crud.get_groups(db)

@app.post("/api/groups", response_model=schemas.GroupResponse, status_code=status.HTTP_201_CREATED)
def create_group(group: schemas.GroupCreate, db: Session = Depends(database.get_db)):
    return crud.create_group(db, group)

@app.get("/api/groups/{group_id}", response_model=schemas.GroupResponse)
def get_group(group_id: str, db: Session = Depends(database.get_db)):
    db_group = crud.get_group(db, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return db_group

@app.post("/api/groups/{group_id}/participants", response_model=schemas.ParticipantResponse, status_code=status.HTTP_201_CREATED)
def add_participant(group_id: str, participant: schemas.ParticipantCreate, db: Session = Depends(database.get_db)):
    db_group = crud.get_group(db, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return crud.add_participant(db, group_id, participant)

@app.get("/api/groups/{group_id}/expenses", response_model=List[schemas.ExpenseResponse])
def get_expenses(group_id: str, db: Session = Depends(database.get_db)):
    return crud.get_expenses(db, group_id)

@app.post("/api/groups/{group_id}/expenses", response_model=schemas.ExpenseResponse, status_code=status.HTTP_201_CREATED)
def create_expense(group_id: str, expense: schemas.ExpenseCreate, db: Session = Depends(database.get_db)):
    db_group = crud.get_group(db, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return crud.create_expense(db, group_id, expense)

@app.get("/api/groups/{group_id}/balances", response_model=schemas.GroupBalancesResponse)
def get_group_balances(group_id: str, db: Session = Depends(database.get_db)):
    db_group = crud.get_group(db, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return crud.calculate_group_balances(db, group_id)

@app.post("/api/groups/{group_id}/settle", response_model=schemas.SettlementResponse, status_code=status.HTTP_201_CREATED)
def create_settlement(group_id: str, settlement: schemas.SettlementCreate, db: Session = Depends(database.get_db)):
    db_group = crud.get_group(db, group_id)
    if not db_group:
        raise HTTPException(status_code=404, detail="Group not found")
    return crud.create_settlement(db, group_id, settlement)
