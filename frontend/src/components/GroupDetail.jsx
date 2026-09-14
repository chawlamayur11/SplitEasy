import React, { useState, useEffect } from 'react';
import { fetchExpenses, fetchBalances, addExpense, recordSettlement, addParticipant, deleteExpense, deleteSettlement } from '../api';
import { Plus, Receipt, UserPlus, Handshake, DollarSign, TrendingUp, TrendingDown, Trash2 } from 'lucide-react';
import AddExpenseModal from './AddExpenseModal';
import SettleModal from './SettleModal';

export default function GroupDetail({ group, onGroupUpdated }) {
  const [expenses, setExpenses] = useState([]);
  const [balanceData, setBalanceData] = useState({ balances: [], settlements: [] });
  const [loading, setLoading] = useState(true);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [showSettle, setShowSettle] = useState(false);
  const [selectedSettlement, setSelectedSettlement] = useState(null);
  const [newMemberName, setNewMemberName] = useState('');
  const [showAddMember, setShowAddMember] = useState(false);

  const curr = group?.currency || '$';

  const loadData = async () => {
    setLoading(true);
    try {
      const [expList, balInfo] = await Promise.all([
        fetchExpenses(group.id),
        fetchBalances(group.id)
      ]);
      setExpenses(expList);
      setBalanceData(balInfo);
    } catch (e) {
      console.error("Error loading group details:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [group.id]);

  const handleCreateExpense = async (data) => {
    await addExpense(group.id, data);
    setShowAddExpense(false);
    loadData();
  };

  const handleDeleteExpense = async (expId, desc) => {
    if (window.confirm(`Are you sure you want to delete "${desc}"?`)) {
      await deleteExpense(group.id, expId);
      loadData();
    }
  };

  const handleSettle = async (data) => {
    await recordSettlement(group.id, data);
    setShowSettle(false);
    loadData();
  };

  const handleAddMember = async (e) => {
    e.preventDefault();
    if (!newMemberName.trim()) return;
    await addParticipant(group.id, newMemberName.trim());
    setNewMemberName('');
    setShowAddMember(false);
    if (onGroupUpdated) onGroupUpdated();
    loadData();
  };

  const totalSpent = expenses.reduce((acc, e) => acc + (e.amount || 0), 0);

  return (
    <div>
      {/* Header section */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <h1 style={{ fontSize: '1.75rem', fontWeight: '800', marginBottom: '0.25rem' }}>{group.name}</h1>
            <p style={{ color: 'var(--text-muted)' }}>{group.description || 'No description provided'}</p>
            <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }}>
              <span className="badge badge-indigo">{group.participants?.length || 0} Members</span>
              <span className="badge badge-emerald">Total Spent: {curr}{totalSpent.toFixed(2)}</span>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button className="btn btn-secondary" onClick={() => setShowAddMember(!showAddMember)}>
              <UserPlus size={18} />
              Add Member
            </button>
            <button className="btn btn-success" onClick={() => { setSelectedSettlement(null); setShowSettle(true); }}>
              <Handshake size={18} />
              Settle Up
            </button>
            <button className="btn" onClick={() => setShowAddExpense(true)}>
              <Plus size={18} />
              Add Expense
            </button>
          </div>
        </div>

        {showAddMember && (
          <form onSubmit={handleAddMember} style={{ display: 'flex', gap: '0.75rem', marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: 'var(--glass-border)' }}>
            <input
              type="text"
              className="form-control"
              placeholder="New member name..."
              value={newMemberName}
              onChange={(e) => setNewMemberName(e.target.value)}
              required
            />
            <button type="submit" className="btn">Add</button>
          </form>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '2rem' }}>
        {/* Balances & Settlement Summary */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <DollarSign size={20} color="#818cf8" />
            Balances & Settlements
          </h2>

          {/* Member Net Balances */}
          <div className="card" style={{ marginBottom: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Member Net Balances</h3>
            {balanceData.balances.map(b => {
              const isPositive = b.net_balance > 0.01;
              const isNegative = b.net_balance < -0.01;
              return (
                <div key={b.participant_id} className="balance-item">
                  <div style={{ fontWeight: '600' }}>{b.name}</div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    {isPositive && <TrendingUp size={16} color="#10b981" />}
                    {isNegative && <TrendingDown size={16} color="#f43f5e" />}
                    <span className={isPositive ? 'badge badge-emerald' : isNegative ? 'badge badge-rose' : 'badge'}>
                      {isPositive ? `+ ${curr}${b.net_balance.toFixed(2)}` : isNegative ? `- ${curr}${Math.abs(b.net_balance).toFixed(2)}` : `${curr}0.00`}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Optimized Debts (Who Owes Whom) */}
          <div className="card">
            <h3 style={{ fontSize: '0.95rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>Optimal Debt Settlement</h3>
            {balanceData.settlements.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', fontSize: '0.9rem' }}>All balances are settled up! 🎉</p>
            ) : (
              balanceData.settlements.map((s, idx) => (
                <div key={idx} className="balance-item" style={{ background: 'rgba(99, 102, 241, 0.1)', borderColor: 'rgba(99, 102, 241, 0.2)' }}>
                  <div>
                    <span style={{ fontWeight: '700', color: '#f43f5e' }}>{s.payer_name}</span>
                    <span style={{ color: 'var(--text-muted)', margin: '0 0.4rem' }}>owes</span>
                    <span style={{ fontWeight: '700', color: '#10b981' }}>{s.payee_name}</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <span style={{ fontWeight: '800', fontSize: '1.05rem', color: 'white' }}>{curr}{s.amount.toFixed(2)}</span>
                    <button
                      className="btn btn-success"
                      style={{ padding: '0.35rem 0.65rem', fontSize: '0.8rem' }}
                      onClick={() => {
                        setSelectedSettlement(s);
                        setShowSettle(true);
                      }}
                    >
                      Settle
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Expenses List */}
        <div>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={20} color="#818cf8" />
            Expense History
          </h2>

          <div className="card">
            {expenses.length === 0 ? (
              <p style={{ color: 'var(--text-dim)', fontStyle: 'italic', textAlign: 'center', padding: '2rem 0' }}>
                No expenses added yet. Click "Add Expense" to start!
              </p>
            ) : (
              expenses.map(exp => {
                const payerName = group.participants?.find(p => p.id === exp.payer_id)?.name || 'Unknown';
                return (
                  <div key={exp.id} style={{ padding: '1rem', borderBottom: 'var(--glass-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <div style={{ fontWeight: '700', fontSize: '1rem' }}>{exp.description}</div>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Paid by <strong style={{ color: '#818cf8' }}>{payerName}</strong> ({exp.splits?.length || 0} participants)
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                      <div style={{ textAlign: 'right' }}>
                        <div style={{ fontWeight: '800', fontSize: '1.15rem', color: '#10b981' }}>
                          {curr}{exp.amount.toFixed(2)}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>
                          {new Date(exp.created_at).toLocaleDateString()}
                        </div>
                      </div>
                      <button
                        style={{ background: 'none', border: 'none', color: '#f43f5e', cursor: 'pointer', opacity: 0.8, padding: '0.25rem' }}
                        title="Delete expense"
                        onClick={() => handleDeleteExpense(exp.id, exp.description)}
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>

      {/* Modals */}
      <AddExpenseModal
        isOpen={showAddExpense}
        onClose={() => setShowAddExpense(false)}
        group={group}
        onAddExpense={handleCreateExpense}
      />

      <SettleModal
        isOpen={showSettle}
        onClose={() => setShowSettle(false)}
        group={group}
        initialSettlement={selectedSettlement}
        onSettle={handleSettle}
      />
    </div>
  );
}
