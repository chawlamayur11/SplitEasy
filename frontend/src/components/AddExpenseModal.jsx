import React, { useState } from 'react';
import { X, Receipt } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, group, onAddExpense }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState('EQUAL');

  if (!isOpen || !group) return null;

  const participants = group.participants || [];
  const selectedPayer = payerId || (participants[0]?.id || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmt) || parsedAmt <= 0) return;

    // Default split equally among all members
    const perPerson = Math.round((parsedAmt / participants.length) * 100) / 100;
    const splits = participants.map(p => ({
      participant_id: p.id,
      amount: perPerson
    }));

    onAddExpense({
      description: description.trim(),
      amount: parsedAmt,
      payer_id: selectedPayer,
      splits
    });

    setDescription('');
    setAmount('');
    setPayerId('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={22} color="#818cf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Add Expense</h2>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Dinner, Taxi, Grocery"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Amount ($) *</label>
            <input
              type="number"
              step="0.01"
              className="form-control"
              placeholder="0.00"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Paid by *</label>
            <select
              className="form-control"
              value={selectedPayer}
              onChange={(e) => setPayerId(e.target.value)}
            >
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Split Method</label>
            <select
              className="form-control"
              value={splitType}
              onChange={(e) => setSplitType(e.target.value)}
            >
              <option value="EQUAL">Split Equally ({participants.length} members)</option>
            </select>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" style={{ flex: 1, justifyContent: 'center' }}>
              Save Expense
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
