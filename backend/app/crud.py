from sqlalchemy.orm import Session
from . import models, schemas

def get_groups(db: Session):
    return db.query(models.Group).all()

def get_group(db: Session, group_id: str):
    return db.query(models.Group).filter(models.Group.id == group_id).first()

def create_group(db: Session, group: schemas.GroupCreate):
    db_group = models.Group(
        name=group.name,
        description=group.description,
        currency=group.currency or "$"
    )
    db.add(db_group)
    db.commit()
    db.refresh(db_group)

    p_names = group.participant_names if group.participant_names else ["Alice", "Bob"]
    for name in p_names:
        if name.strip():
            db_participant = models.Participant(
                group_id=db_group.id,
                name=name.strip()
            )
            db.add(db_participant)

    db.commit()
    db.refresh(db_group)
    return db_group

def delete_group(db: Session, group_id: str):
    db_group = get_group(db, group_id)
    if db_group:
        db.delete(db_group)
        db.commit()
        return True
    return False

def add_participant(db: Session, group_id: str, participant: schemas.ParticipantCreate):
    db_participant = models.Participant(
        group_id=group_id,
        name=participant.name,
        email=participant.email
    )
    db.add(db_participant)
    db.commit()
    db.refresh(db_participant)
    return db_participant

def get_expenses(db: Session, group_id: str):
    return db.query(models.Expense).filter(models.Expense.group_id == group_id).order_by(models.Expense.created_at.desc()).all()

def create_expense(db: Session, group_id: str, expense: schemas.ExpenseCreate):
    db_expense = models.Expense(
        group_id=group_id,
        description=expense.description,
        amount=expense.amount,
        payer_id=expense.payer_id
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)

    # Process splits
    if expense.splits and len(expense.splits) > 0:
        for sp in expense.splits:
            db_split = models.ExpenseSplit(
                expense_id=db_expense.id,
                participant_id=sp.participant_id,
                amount=sp.amount
            )
            db.add(db_split)
    else:
        # Equal split fallback across all group participants
        participants = db.query(models.Participant).filter(models.Participant.group_id == group_id).all()
        if len(participants) > 0:
            per_person = round(expense.amount / len(participants), 2)
            for p in participants:
                db_split = models.ExpenseSplit(
                    expense_id=db_expense.id,
                    participant_id=p.id,
                    amount=per_person
                )
                db.add(db_split)

    db.commit()
    db.refresh(db_expense)
    return db_expense

def delete_expense(db: Session, expense_id: str):
    db_expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if db_expense:
        db.delete(db_expense)
        db.commit()
        return True
    return False

def calculate_group_balances(db: Session, group_id: str):
    group = get_group(db, group_id)
    if not group:
        return {"balances": [], "settlements": []}

    participants = group.participants
    p_map = {p.id: p.name for p in participants}
    net_balances = {p.id: 0.0 for p in participants}

    # Add expense contributions & owed splits
    expenses = get_expenses(db, group_id)
    for exp in expenses:
        if exp.payer_id in net_balances:
            net_balances[exp.payer_id] += exp.amount
        for sp in exp.splits:
            if sp.participant_id in net_balances:
                net_balances[sp.participant_id] -= sp.amount

    # Account for recorded settlements
    settlements = db.query(models.Settlement).filter(models.Settlement.group_id == group_id).all()
    for st in settlements:
        if st.payer_id in net_balances:
            net_balances[st.payer_id] += st.amount
        if st.payee_id in net_balances:
            net_balances[st.payee_id] -= st.amount

    balance_list = [
        schemas.ParticipantBalance(
            participant_id=pid,
            name=p_map.get(pid, "Unknown"),
            net_balance=round(net_balances[pid], 2)
        )
        for pid in net_balances
    ]

    # Calculate minimal debt settlements using greedy algorithm
    creditors = []
    debtors = []

    for b in balance_list:
        if b.net_balance > 0.01:
            creditors.append({'id': b.participant_id, 'name': b.name, 'amount': b.net_balance})
        elif b.net_balance < -0.01:
            debtors.append({'id': b.participant_id, 'name': b.name, 'amount': -b.net_balance})

    debt_settlements = []
    i, j = 0, 0
    while i < len(debtors) and j < len(creditors):
        settle_amt = min(debtors[i]['amount'], creditors[j]['amount'])
        debt_settlements.append(schemas.DebtSettlementItem(
            payer_id=debtors[i]['id'],
            payer_name=debtors[i]['name'],
            payee_id=creditors[j]['id'],
            payee_name=creditors[j]['name'],
            amount=round(settle_amt, 2)
        ))

        debtors[i]['amount'] -= settle_amt
        creditors[j]['amount'] -= settle_amt

        if debtors[i]['amount'] < 0.01:
            i += 1
        if creditors[j]['amount'] < 0.01:
            j += 1

    return {"balances": balance_list, "settlements": debt_settlements}

def create_settlement(db: Session, group_id: str, settlement: schemas.SettlementCreate):
    db_settlement = models.Settlement(
        group_id=group_id,
        payer_id=settlement.payer_id,
        payee_id=settlement.payee_id,
        amount=settlement.amount
    )
    db.add(db_settlement)
    db.commit()
    db.refresh(db_settlement)
    return db_settlement

def delete_settlement(db: Session, settlement_id: str):
    db_settlement = db.query(models.Settlement).filter(models.Settlement.id == settlement_id).first()
    if db_settlement:
        db.delete(db_settlement)
        db.commit()
        return True
    return False
