from typing import List, Optional
from datetime import datetime
from pydantic import BaseModel, ConfigDict, Field, model_validator

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
    amount: float = Field(gt=0, description="Amount owed by participant must be positive")

class ExpenseSplitCreate(ExpenseSplitBase):
    pass

class ExpenseSplitResponse(ExpenseSplitBase):
    id: str
    expense_id: str
    model_config = ConfigDict(from_attributes=True)


class ExpenseBase(BaseModel):
    description: str
    amount: float = Field(gt=0, description="Expense amount must be greater than zero")
    payer_id: str

class ExpenseCreate(ExpenseBase):
    splits: Optional[List[ExpenseSplitCreate]] = []

    @model_validator(mode="after")
    def validate_splits_total(self):
        if self.splits and len(self.splits) > 0:
            total_splits = sum(s.amount for s in self.splits)
            if abs(total_splits - self.amount) > 0.02:
                raise ValueError(
                    f"Sum of expense splits ({total_splits:.2f}) must equal total expense amount ({self.amount:.2f})"
                )
        return self

class ExpenseResponse(ExpenseBase):
    id: str
    group_id: str
    created_at: datetime
    splits: List[ExpenseSplitResponse] = []
    model_config = ConfigDict(from_attributes=True)


class SettlementBase(BaseModel):
    payer_id: str
    payee_id: str
    amount: float = Field(gt=0, description="Settlement amount must be greater than zero")

class SettlementCreate(SettlementBase):
    @model_validator(mode="after")
    def validate_payer_payee(self):
        if self.payer_id == self.payee_id:
            raise ValueError("Payer and Payee cannot be the same person")
        return self

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
