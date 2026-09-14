import React, { useState } from 'react';
import { X, UserPlus, DollarSign } from 'lucide-react';

export default function CreateGroupModal({ isOpen, onClose, onCreate }) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [currency, setCurrency] = useState('$');
  const [participants, setParticipants] = useState(['Alice', 'Bob']);

  if (!isOpen) return null;

  const handleAddParticipant = () => {
    setParticipants([...participants, '']);
  };

  const handleParticipantChange = (index, value) => {
    const updated = [...participants];
    updated[index] = value;
    setParticipants(updated);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!name.trim()) return;

    const filteredParticipants = participants
      .map(p => p.trim())
      .filter(p => p.length > 0);

    onCreate({
      name: name.trim(),
      description: description.trim(),
      currency,
      participant_names: filteredParticipants.length > 0 ? filteredParticipants : ['Alice', 'Bob']
    });

    setName('');
    setDescription('');
    setCurrency('$');
    setParticipants(['Alice', 'Bob']);
    onClose();
  };

  return (
    <div className="modal-overlay">
      <div className="modal-content">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: '700' }}>Create New Group</h2>
          <button style={{ background: 'none', border: 'none', color: '#94a3b8', cursor: 'pointer' }} onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Group Name *</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Goa Trip 2026 or Housemates"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label>Description</label>
              <input
                type="text"
                className="form-control"
                placeholder="Short description..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>
            <div className="form-group">
              <label>Currency</label>
              <select
                className="form-control"
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                <option value="$">$ (USD)</option>
                <option value="€">€ (EUR)</option>
                <option value="£">£ (GBP)</option>
                <option value="₹">₹ (INR)</option>
                <option value="C$">C$ (CAD)</option>
                <option value="A$">A$ (AUD)</option>
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Initial Members</label>
            {participants.map((p, idx) => (
              <input
                key={idx}
                type="text"
                className="form-control"
                style={{ marginBottom: '0.5rem' }}
                placeholder={`Member ${idx + 1} Name`}
                value={p}
                onChange={(e) => handleParticipantChange(idx, e.target.value)}
              />
            ))}
            <button
              type="button"
              className="btn btn-secondary"
              style={{ width: '100%', marginTop: '0.5rem', justifyContent: 'center' }}
              onClick={handleAddParticipant}
            >
              <UserPlus size={16} /> Add Member
            </button>
          </div>

          <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
            <button type="button" className="btn btn-secondary" style={{ flex: 1, justifyContent: 'center' }} onClick={onClose}>
              Cancel
            </button>
            <button type="submit" className="btn" style={{ flex: 1, justifyContent: 'center' }}>
              Create Group
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
