import React, { useState } from 'react';
import { X, Handshake } from 'lucide-react';

export default function SettleModal({ isOpen, onClose, group, initialSettlement, onSettle }) {
  const [payerId, setPayerId] = useState(initialSettlement?.payer_id || '');
  const [payeeId, setPayeeId] = useState(initialSettlement?.payee_id || '');
  const [amount, setAmount] = useState(initialSettlement?.amount || '');

  if (!isOpen || !group) return null;

  const participants = group.participants || [];

  const handleSubmit = (e) => {
    e.preventDefault();
    const parsedAmt = parseFloat(amount);
    if (!payerId || !payeeId || payerId === payeeId || isNaN(parsedAmt) || parsedAmt <= 0) return;

    onSettle({
      payer_id: payerId,
      payee_id: payeeId,
      amount: parsedAmt
    });

    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Handshake size={22} color="#10b981" />
            <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Settle Up</h2>
          </div>
          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Who paid?</label>
            <select
              className="form-control"
              value={payerId || (participants[0]?.id || '')}
              onChange={(e) => setPayerId(e.target.value)}
            >
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Who received?</label>
            <select
              className="form-control"
              value={payeeId || (participants[1]?.id || '')}
              onChange={(e) => setPayeeId(e.target.value)}
            >
              {participants.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
          </div>

          <div className="form-group">
            <label>Settlement Amount ($)</label>
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

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn btn-success" style={{ flex: 1, justifyContent: 'center' }}>
              Confirm Settlement
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
