import React, { useState, useEffect } from 'react';
import Navbar from './components/Navbar';
import CreateGroupModal from './components/CreateGroupModal';
import GroupDetail from './components/GroupDetail';
import { fetchGroups, createGroup } from './api';
import { Users, Plus, ArrowRight, Sparkles } from 'lucide-react';

export default function App() {
  const [groups, setGroups] = useState([]);
  const [activeGroupId, setActiveGroupId] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadGroups = async () => {
    setLoading(true);
    try {
      const data = await fetchGroups();
      setGroups(data);
    } catch (e) {
      console.error("Failed to load groups:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadGroups();
  }, []);

  const handleCreateGroup = async (newGroupData) => {
    const created = await createGroup(newGroupData);
    await loadGroups();
    if (created && created.id) {
      setActiveGroupId(created.id);
    }
  };

  const activeGroup = groups.find(g => g.id === activeGroupId);

  return (
    <div className="app-container">
      <Navbar
        activeGroup={activeGroup}
        onBack={() => setActiveGroupId(null)}
        onCreateGroup={() => setShowCreateModal(true)}
      />

      {activeGroup ? (
        <GroupDetail
          group={activeGroup}
          onGroupUpdated={loadGroups}
        />
      ) : (
        <div>
          {/* Hero Banner */}
          <div className="card" style={{ marginBottom: '2.5rem', background: 'linear-gradient(135deg, rgba(30, 27, 75, 0.8) 0%, rgba(30, 41, 59, 0.7) 100%)', textAlign: 'center', padding: '3rem 1.5rem' }}>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', padding: '0.35rem 1rem', borderRadius: '9999px', background: 'rgba(129, 140, 248, 0.15)', color: '#818cf8', fontSize: '0.85rem', fontWeight: '700', marginBottom: '1rem' }}>
              <Sparkles size={16} /> AI-Powered Expense Splitting
            </div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: '800', marginBottom: '0.75rem' }}>
              Split Bills Effortlessly With Friends
            </h1>
            <p style={{ color: 'var(--text-muted)', maxWidth: '600px', margin: '0 auto 1.5rem auto', fontSize: '1.05rem' }}>
              Track shared trips, house utilities, and group dinners. Automatically calculate who owes whom with minimal payments.
            </p>
            <button className="btn" style={{ padding: '0.8rem 1.75rem', fontSize: '1rem' }} onClick={() => setShowCreateModal(true)}>
              <Plus size={20} /> Create New Group
            </button>
          </div>

          {/* Groups List */}
          <h2 style={{ fontSize: '1.35rem', fontWeight: '700', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Users size={22} color="#818cf8" />
            Your Groups
          </h2>

          {loading ? (
            <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--text-muted)' }}>
              Loading your groups...
            </div>
          ) : groups.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', padding: '3rem 1.5rem' }}>
              <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>No expense groups found.</p>
              <button className="btn" onClick={() => setShowCreateModal(true)}>
                <Plus size={18} /> Create Your First Group
              </button>
            </div>
          ) : (
            <div className="grid-groups">
              {groups.map(group => (
                <div
                  key={group.id}
                  className="card group-card"
                  onClick={() => setActiveGroupId(group.id)}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                    <h3 style={{ fontSize: '1.2rem', fontWeight: '700', color: 'white' }}>{group.name}</h3>
                    <ArrowRight size={18} color="#818cf8" />
                  </div>
                  <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1.25rem', minHeight: '2.7rem' }}>
                    {group.description || 'No description'}
                  </p>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: 'var(--glass-border)', paddingTop: '0.85rem' }}>
                    <span className="badge badge-indigo">
                      {group.participants?.length || 0} Members
                    </span>
                    <span style={{ fontSize: '0.85rem', color: '#818cf8', fontWeight: '600' }}>
                      View Details &rarr;
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onCreate={handleCreateGroup}
      />
    </div>
  );
}
