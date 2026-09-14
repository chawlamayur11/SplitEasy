import React from 'react';
import { Wallet, Plus, ArrowLeft } from 'lucide-react';

export default function Navbar({ activeGroup, onBack, onCreateGroup }) {
  return (
    <header className="header">
      <div className="logo" style={{ cursor: 'pointer' }} onClick={onBack}>
        <Wallet size={32} color="#818cf8" />
        <span>SplitEasy</span>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
        {activeGroup && (
          <button className="btn btn-secondary" onClick={onBack}>
            <ArrowLeft size={18} />
            Back to Groups
          </button>
        )}
        <button className="btn" onClick={onCreateGroup}>
          <Plus size={18} />
          New Group
        </button>
      </div>
    </header>
  );
}
