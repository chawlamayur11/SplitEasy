# SplitEasy - Product & Technical Specification

## Overview
**SplitEasy** is an AI-assisted full-stack expense splitting application built for group expense tracking, balance calculation, and debt settlement.

- **App Name**: SplitEasy
- **Project Category**: Expense Splitter
- **Target Audience**: Friends, roommates, and trip groups who share expenses.

---

## Core User Flows & Features

### 1. Group Management
- Create a group with a name, description, and currency symbol (default `$`).
- Add/manage group participants (e.g. Alice, Bob, Charlie).

### 2. Expense Logging
- Add a new expense specifying:
  - Description (e.g., "Dinner at Beach Shack")
  - Total amount
  - Payer (who paid)
  - Split type (`EQUAL` or `EXACT`)
  - Participants involved in the expense.
- View list of recorded expenses for a group.

### 3. Balance Calculation & Debt Optimization
- Calculate net balance for each participant (`Total Paid - Total Owed`).
- Compute simplified debt transfers ("Who Owes Whom") using greedy debt minimization:
  - e.g. Bob owes Alice $35.00, Charlie owes Alice $15.00.

### 4. Settlement
- Record a settlement payment (e.g., Bob pays Alice $35.00).
- Update balances dynamically.

---

## Architecture & Data Schema

### Entities

#### Group
- `id`: string (UUID)
- `name`: string
- `description`: string
- `created_at`: datetime

#### Participant
- `id`: string (UUID)
- `group_id`: string (UUID)
- `name`: string
- `email`: optional string

#### Expense
- `id`: string (UUID)
- `group_id`: string (UUID)
- `description`: string
- `amount`: float
- `payer_id`: string (UUID)
- `created_at`: datetime

#### ExpenseSplit
- `id`: string (UUID)
- `expense_id`: string (UUID)
- `participant_id`: string (UUID)
- `amount`: float

#### Settlement
- `id`: string (UUID)
- `group_id`: string (UUID)
- `payer_id`: string (UUID)
- `payee_id`: string (UUID)
- `amount`: float
- `created_at`: datetime

---

## API Endpoints Specification (OpenAPI Target)

- `GET /api/groups` - List all groups
- `POST /api/groups` - Create a group
- `GET /api/groups/{id}` - Get group details with participants
- `POST /api/groups/{id}/participants` - Add participant to group
- `GET /api/groups/{id}/expenses` - List expenses for a group
- `POST /api/groups/{id}/expenses` - Log a new expense
- `GET /api/groups/{id}/balances` - Get participant balances and debt settlements
- `POST /api/groups/{id}/settle` - Record debt settlement
