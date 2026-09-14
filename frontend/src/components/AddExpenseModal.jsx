import React, { useState, useEffect } from 'react';
import { X, Receipt, Users, Calculator } from 'lucide-react';

export default function AddExpenseModal({ isOpen, onClose, group, onAddExpense }) {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState('');
  const [payerId, setPayerId] = useState('');
  const [splitType, setSplitType] = useState('EQUAL'); // EQUAL, EXACT, PERCENTAGE
  const [selectedMembers, setSelectedMembers] = useState({});
  const [customSplits, setCustomSplits] = useState({}); // participant_id -> value (amount or percentage)
  const [errorMsg, setErrorMsg] = useState('');

  const curr = group?.currency || '$';
  const participants = group?.participants || [];

  useEffect(() => {
    if (participants.length > 0) {
      const initialSelected = {};
      const initialSplits = {};
      participants.forEach(p => {
        initialSelected[p.id] = true;
        initialSplits[p.id] = '';
      });
      setSelectedMembers(initialSelected);
      setCustomSplits(initialSplits);
      if (!payerId) setPayerId(participants[0].id);
    }
  }, [group, isOpen]);

  if (!isOpen || !group) return null;

  const toggleMember = (id) => {
    setSelectedMembers(prev => {
      const updated = { ...prev, [id]: !prev[id] };
      // Ensure at least 1 member is selected
      const count = Object.values(updated).filter(Boolean).length;
      if (count === 0) return prev;
      return updated;
    });
  };

  const handleCustomSplitChange = (id, val) => {
    setCustomSplits(prev => ({ ...prev, [id]: val }));
  };

  const activeMembers = participants.filter(p => selectedMembers[p.id]);

  const handleSubmit = (e) => {
    e.preventDefault();
    setErrorMsg('');
    const parsedAmt = parseFloat(amount);
    if (!description.trim() || isNaN(parsedAmt) || parsedAmt <= 0) {
      setErrorMsg('Please enter a valid description and positive amount.');
      return;
    }

    if (activeMembers.length === 0) {
      setErrorMsg('Select at least one member to split the expense with.');
      return;
    }

    let splits = [];

    if (splitType === 'EQUAL') {
      const perPerson = Math.round((parsedAmt / activeMembers.length) * 100) / 100;
      splits = activeMembers.map(p => ({
        participant_id: p.id,
        amount: perPerson
      }));
    } else if (splitType === 'EXACT') {
      let sum = 0;
      for (const p of activeMembers) {
        const val = parseFloat(customSplits[p.id]);
        if (isNaN(val) || val <= 0) {
          setErrorMsg(`Please enter a valid split amount for ${p.name}`);
          return;
        }
        sum += val;
        splits.push({ participant_id: p.id, amount: val });
      }
      if (Math.abs(sum - parsedAmt) > 0.02) {
        setErrorMsg(`Sum of split amounts (${curr}${sum.toFixed(2)}) must equal total expense amount (${curr}${parsedAmt.toFixed(2)}).`);
        return;
      }
    } else if (splitType === 'PERCENTAGE') {
      let percentSum = 0;
      for (const p of activeMembers) {
        const pct = parseFloat(customSplits[p.id]);
        if (isNaN(pct) || pct <= 0) {
          setErrorMsg(`Please enter a valid percentage for ${p.name}`);
          return;
        }
        percentSum += pct;
      }
      if (Math.abs(percentSum - 100) > 0.1) {
        setErrorMsg(`Percentages must sum to 100% (currently ${percentSum}%).`);
        return;
      }

      splits = activeMembers.map(p => ({
        participant_id: p.id,
        amount: Math.round(((parseFloat(customSplits[p.id]) / 100) * parsedAmt) * 100) / 100
      }));
    }

    onAddExpense({
      description: description.trim(),
      amount: parsedAmt,
      payer_id: payerId || activeMembers[0].id,
      splits
    });

    setDescription('');
    setAmount('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content" style={{ maxWidth: '540px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.25rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Receipt size={22} color="#818cf8" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Add Expense</h2>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {errorMsg && (
          <div style={{ background: 'rgba(244, 63, 94, 0.15)', border: '1px solid rgba(244, 63, 94, 0.3)', color: '#f43f5e', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
            {errorMsg}
          </div>
        )}

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

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Amount ({curr}) *</label>
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
                value={payerId}
                onChange={(e) => setPayerId(e.target.value)}
              >
                {participants.map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Member Selection (Subset) */}
          <div className="form-group">
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span>Split Between ({activeMembers.length} members)</span>
            </label>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', marginTop: '0.5rem' }}>
              {participants.map(p => {
                const isSelected = selectedMembers[p.id];
                return (
                  <button
                    type="button"
                    key={p.id}
                    className={`btn ${isSelected ? 'btn-secondary' : ''}`}
                    style={{
                      padding: '0.35rem 0.75rem',
                      fontSize: '0.85rem',
                      background: isSelected ? 'rgba(99, 102, 241, 0.25)' : 'rgba(15, 23, 42, 0.6)',
                      borderColor: isSelected ? '#818cf8' : 'rgba(255, 255, 255, 0.1)',
                      color: isSelected ? '#ffffff' : '#94a3b8'
                    }}
                    onClick={() => toggleMember(p.id)}
                  >
                    {isSelected ? '✓ ' : '+ '}{p.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Split Method Selection */}
          <div className="form-group">
            <label>Split Method</label>
            <select
              className="form-control"
              value={splitType}
              onChange={(e) => setSplitType(e.target.value)}
            >
              <option value="EQUAL">Split Equally</option>
              <option value="EXACT">Exact Amounts ({curr})</option>
              <option value="PERCENTAGE">Percentage (%)</option>
            </select>
          </div>

          {/* Custom Split Inputs */}
          {splitType !== 'EQUAL' && (
            <div className="form-group" style={{ background: 'rgba(15, 23, 42, 0.5)', padding: '1rem', borderRadius: '8px', border: 'var(--glass-border)' }}>
              <label style={{ marginBottom: '0.75rem', color: '#818cf8', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calculator size={16} /> Specify {splitType === 'EXACT' ? `Amounts (${curr})` : 'Percentages (%)'}
              </label>
              {activeMembers.map(p => (
                <div key={p.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                  <span style={{ fontSize: '0.9rem' }}>{p.name}</span>
                  <input
                    type="number"
                    step={splitType === 'EXACT' ? '0.01' : '1'}
                    className="form-control"
                    style={{ width: '120px', padding: '0.4rem 0.6rem' }}
                    placeholder={splitType === 'EXACT' ? `${curr}0.00` : '0%'}
                    value={customSplits[p.id] || ''}
                    onChange={(e) => handleCustomSplitChange(p.id, e.target.value)}
                    required
                  />
                </div>
              ))}
            </div>
          )}

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
