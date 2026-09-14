import uuid
from datetime import datetime
from sqlalchemy import Column, String, Float, DateTime, ForeignKey, Table
from sqlalchemy.orm import relationship
from .database import Base

def generate_uuid():
    return str(uuid.uuid4())

class Group(Base):
    __tablename__ = "groups"

    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    description = Column(String, nullable=True)
    currency = Column(String, default="$")
    created_at = Column(DateTime, default=datetime.utcnow)

    participants = relationship("Participant", back_populates="group", cascade="all, delete-orphan")
    expenses = relationship("Expense", back_populates="group", cascade="all, delete-orphan")
    settlements = relationship("Settlement", back_populates="group", cascade="all, delete-orphan")


class Participant(Base):
    __tablename__ = "participants"

    id = Column(String, primary_key=True, default=generate_uuid)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    name = Column(String, nullable=False)
    email = Column(String, nullable=True)

    group = relationship("Group", back_populates="participants")
    expense_splits = relationship("ExpenseSplit", back_populates="participant", cascade="all, delete-orphan")


class Expense(Base):
    __tablename__ = "expenses"

    id = Column(String, primary_key=True, default=generate_uuid)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    description = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    payer_id = Column(String, ForeignKey("participants.id"), nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="expenses")
    payer = relationship("Participant", foreign_keys=[payer_id])
    splits = relationship("ExpenseSplit", back_populates="expense", cascade="all, delete-orphan")


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id = Column(String, primary_key=True, default=generate_uuid)
    expense_id = Column(String, ForeignKey("expenses.id"), nullable=False)
    participant_id = Column(String, ForeignKey("participants.id"), nullable=False)
    amount = Column(Float, nullable=False)

    expense = relationship("Expense", back_populates="splits")
    participant = relationship("Participant", back_populates="expense_splits")


class Settlement(Base):
    __tablename__ = "settlements"

    id = Column(String, primary_key=True, default=generate_uuid)
    group_id = Column(String, ForeignKey("groups.id"), nullable=False)
    payer_id = Column(String, ForeignKey("participants.id"), nullable=False)
    payee_id = Column(String, ForeignKey("participants.id"), nullable=False)
    amount = Column(Float, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)

    group = relationship("Group", back_populates="settlements")
    payer = relationship("Participant", foreign_keys=[payer_id])
    payee = relationship("Participant", foreign_keys=[payee_id])
