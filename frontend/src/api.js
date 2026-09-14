// Centralized API handler for SplitEasy
// Environment configured to target local FastAPI backend, with fallback mock implementation

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL || 'http://localhost:8000';
let useMock = false; // Will switch dynamically if backend is unreachable

// Initial Mock Data
let mockGroups = [
  {
    id: 'grp-1',
    name: 'Goa Trip 2026 🌴',
    description: 'Beach vacation with college friends',
    currency: '$',
    participants: [
      { id: 'usr-1', name: 'Alice' },
      { id: 'usr-2', name: 'Bob' },
      { id: 'usr-3', name: 'Charlie' }
    ]
  },
  {
    id: 'grp-2',
    name: 'Roommates 🏠',
    description: 'Monthly apartment utilities and groceries',
    currency: '$',
    participants: [
      { id: 'usr-1', name: 'Alice' },
      { id: 'usr-4', name: 'David' }
    ]
  }
];

let mockExpenses = [
  {
    id: 'exp-1',
    group_id: 'grp-1',
    description: 'Villa Resort Stay',
    amount: 300,
    payer_id: 'usr-1',
    created_at: new Date(Date.now() - 86400000 * 2).toISOString(),
    splits: [
      { participant_id: 'usr-1', amount: 100 },
      { participant_id: 'usr-2', amount: 100 },
      { participant_id: 'usr-3', amount: 100 }
    ]
  },
  {
    id: 'exp-2',
    group_id: 'grp-1',
    description: 'Seafood Dinner',
    amount: 90,
    payer_id: 'usr-2',
    created_at: new Date(Date.now() - 86400000).toISOString(),
    splits: [
      { participant_id: 'usr-1', amount: 30 },
      { participant_id: 'usr-2', amount: 30 },
      { participant_id: 'usr-3', amount: 30 }
    ]
  }
];

let mockSettlements = [];

export async function fetchGroups() {
  if (!useMock) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/groups`);
      if (res.ok) return await res.json();
    } catch (e) {
      console.warn("Backend unavailable, using mock API layer:", e.message);
      useMock = true;
    }
  }
  return mockGroups;
}

export async function createGroup(groupData) {
  if (!useMock) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/groups`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(groupData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      useMock = true;
    }
  }

  const newGroup = {
    id: `grp-${Date.now()}`,
    name: groupData.name,
    description: groupData.description || '',
    currency: '$',
    participants: (groupData.participant_names || []).map((name, idx) => ({
      id: `usr-${Date.now()}-${idx}`,
      name
    }))
  };
  mockGroups.push(newGroup);
  return newGroup;
}

export async function addParticipant(groupId, name) {
  if (!useMock) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/groups/${groupId}/participants`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name })
      });
      if (res.ok) return await res.json();
    } catch (e) {
      useMock = true;
    }
  }

  const group = mockGroups.find(g => g.id === groupId);
  if (group) {
    const newParticipant = { id: `usr-${Date.now()}`, name };
    group.participants.push(newParticipant);
    return newParticipant;
  }
}

export async function fetchExpenses(groupId) {
  if (!useMock) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/groups/${groupId}/expenses`);
      if (res.ok) return await res.json();
    } catch (e) {
      useMock = true;
    }
  }
  return mockExpenses.filter(e => e.group_id === groupId);
}

export async function addExpense(groupId, expenseData) {
  if (!useMock) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/groups/${groupId}/expenses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(expenseData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      useMock = true;
    }
  }

  const newExpense = {
    id: `exp-${Date.now()}`,
    group_id: groupId,
    description: expenseData.description,
    amount: parseFloat(expenseData.amount),
    payer_id: expenseData.payer_id,
    created_at: new Date().toISOString(),
    splits: expenseData.splits || []
  };
  mockExpenses.push(newExpense);
  return newExpense;
}

export async function fetchBalances(groupId) {
  if (!useMock) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/groups/${groupId}/balances`);
      if (res.ok) return await res.json();
    } catch (e) {
      useMock = true;
    }
  }

  // Fallback Mock balance calculation
  const group = mockGroups.find(g => g.id === groupId);
  if (!group) return { balances: [], settlements: [] };

  const net = {};
  group.participants.forEach(p => net[p.id] = 0);

  // Add expenses
  const groupExpenses = mockExpenses.filter(e => e.group_id === groupId);
  groupExpenses.forEach(exp => {
    net[exp.payer_id] = (net[exp.payer_id] || 0) + exp.amount;
    (exp.splits || []).forEach(sp => {
      net[sp.participant_id] = (net[sp.participant_id] || 0) - sp.amount;
    });
  });

  // Account for settlements
  mockSettlements.filter(s => s.group_id === groupId).forEach(s => {
    net[s.payer_id] = (net[s.payer_id] || 0) + s.amount;
    net[s.payee_id] = (net[s.payee_id] || 0) - s.amount;
  });

  const balances = group.participants.map(p => ({
    participant_id: p.id,
    name: p.name,
    net_balance: net[p.id] || 0
  }));

  // Debt minimization calculation
  const creditors = [];
  const debtors = [];

  balances.forEach(b => {
    if (b.net_balance > 0.01) creditors.push({ ...b, amount: b.net_balance });
    else if (b.net_balance < -0.01) debtors.push({ ...b, amount: -b.net_balance });
  });

  const settlements = [];
  let i = 0, j = 0;

  while (i < debtors.length && j < creditors.length) {
    const minAmt = Math.min(debtors[i].amount, creditors[j].amount);
    settlements.push({
      payer_id: debtors[i].participant_id,
      payer_name: debtors[i].name,
      payee_id: creditors[j].participant_id,
      payee_name: creditors[j].name,
      amount: Math.round(minAmt * 100) / 100
    });

    debtors[i].amount -= minAmt;
    creditors[j].amount -= minAmt;

    if (debtors[i].amount < 0.01) i++;
    if (creditors[j].amount < 0.01) j++;
  }

  return { balances, settlements };
}

export async function recordSettlement(groupId, settlementData) {
  if (!useMock) {
    try {
      const res = await fetch(`${BACKEND_URL}/api/groups/${groupId}/settle`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settlementData)
      });
      if (res.ok) return await res.json();
    } catch (e) {
      useMock = true;
    }
  }

  const settlement = {
    id: `stl-${Date.now()}`,
    group_id: groupId,
    payer_id: settlementData.payer_id,
    payee_id: settlementData.payee_id,
    amount: parseFloat(settlementData.amount),
    created_at: new Date().toISOString()
  };
  mockSettlements.push(settlement);
  return settlement;
}

export { BACKEND_URL };
