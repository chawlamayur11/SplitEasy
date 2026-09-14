from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict

class ParticipantBase(BaseModel):
    name: str
    email: Optional[str] = None

class ParticipantCreate(ParticipantBase):
    pass

class ParticipantResponse(ParticipantBase):
    id: str
    group_id: str
    model_config = ConfigDict(from_attributes=True)


class GroupBase(BaseModel):
    name: str
    description: Optional[str] = None
    currency: Optional[str] = "$"

class GroupCreate(GroupBase):
    participant_names: Optional[List[str]] = []

class GroupResponse(GroupBase):
    id: str
    created_at: datetime
    participants: List[ParticipantResponse] = []
    model_config = ConfigDict(from_attributes=True)


class ExpenseSplitBase(BaseModel):
    participant_id: str
    amount: float

class ExpenseSplitCreate(ExpenseSplitBase):
    pass

class ExpenseSplitResponse(ExpenseSplitBase):
    id: str
    expense_id: str
    model_config = ConfigDict(from_attributes=True)


class ExpenseBase(BaseModel):
    description: str
    amount: float
    payer_id: str

class ExpenseCreate(ExpenseBase):
    splits: Optional[List[ExpenseSplitCreate]] = []

class ExpenseResponse(ExpenseBase):
    id: str
    group_id: str
    created_at: datetime
    splits: List[ExpenseSplitResponse] = []
    model_config = ConfigDict(from_attributes=True)


class SettlementBase(BaseModel):
    payer_id: str
    payee_id: str
    amount: float

class SettlementCreate(SettlementBase):
    pass

class SettlementResponse(SettlementBase):
    id: str
    group_id: str
    created_at: datetime
    model_config = ConfigDict(from_attributes=True)


class ParticipantBalance(BaseModel):
    participant_id: str
    name: str
    net_balance: float

class DebtSettlementItem(BaseModel):
    payer_id: str
    payer_name: str
    payee_id: str
    payee_name: str
    amount: float

class GroupBalancesResponse(BaseModel):
    balances: List[ParticipantBalance]
    settlements: List[DebtSettlementItem]
