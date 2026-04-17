import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';

const DEFAULT_FORM = {
  title: '',
  description: '',
  startDate: '',
  endDate: '',
  status: 'planning',
  members: [],
};

export default function ProjectForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    api.get('/auth/users').then(({ data }) => setUsers(data)).catch(() => {});
    if (isEdit) {
      api.get(`/projects/${id}`).then(({ data }) => {
        setForm({
          title: data.title || '',
          description: data.description || '',
          startDate: data.startDate ? data.startDate.split('T')[0] : '',
          endDate: data.endDate ? data.endDate.split('T')[0] : '',
          status: data.status || 'planning',
          members: data.members?.map((m) => m._id) || [],
        });
      }).catch(() => setError('Failed to load project'));
    }
  }, [id, isEdit]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleMemberToggle = (userId) => {
    setForm((prev) => ({
      ...prev,
      members: prev.members.includes(userId)
        ? prev.members.filter((m) => m !== userId)
        : [...prev.members, userId],
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title || !form.startDate || !form.endDate) {
      return setError('Title, start date, and end date are required');
    }
    if (new Date(form.endDate) < new Date(form.startDate)) {
      return setError('End date must be after start date');
    }

    try {
      setLoading(true);
      if (isEdit) {
        await api.put(`/projects/${id}`, form);
        setSuccess('Project updated successfully!');
      } else {
        await api.post('/projects', form);
        setSuccess('Project created successfully!');
        setTimeout(() => navigate('/projects'), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? '✏️ Edit Project' : '➕ New Project'}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/projects')}>← Back</button>
      </div>

      <div className="card" style={{ maxWidth: 640 }}>
        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Project Title *</label>
            <input name="title" placeholder="e.g. Website Redesign" value={form.title} onChange={handleChange} />
          </div>

          <div className="form-group">
            <label>Description</label>
            <textarea name="description" placeholder="Brief project overview..." value={form.description} onChange={handleChange} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <div className="form-group">
              <label>Start Date *</label>
              <input type="date" name="startDate" value={form.startDate} onChange={handleChange} />
            </div>
            <div className="form-group">
              <label>End Date *</label>
              <input type="date" name="endDate" value={form.endDate} onChange={handleChange} />
            </div>
          </div>

          <div className="form-group">
            <label>Status</label>
            <select name="status" value={form.status} onChange={handleChange}>
              <option value="planning">Planning</option>
              <option value="active">Active</option>
              <option value="on-hold">On Hold</option>
              <option value="completed">Completed</option>
            </select>
          </div>

          <div className="form-group">
            <label>Team Members</label>
            {users.length === 0 ? (
              <p style={{ color: '#999', fontSize: 13 }}>No users available</p>
            ) : (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginTop: 4 }}>
                {users.map((u) => (
                  <label key={u._id} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '6px 12px', borderRadius: 20, cursor: 'pointer',
                    background: form.members.includes(u._id) ? '#e94560' : '#f0f2f5',
                    color: form.members.includes(u._id) ? 'white' : '#444',
                    fontSize: 13, fontWeight: 500, transition: 'all 0.2s',
                  }}>
                    <input
                      type="checkbox"
                      checked={form.members.includes(u._id)}
                      onChange={() => handleMemberToggle(u._id)}
                      style={{ display: 'none' }}
                    />
                    {u.name} <span style={{ opacity: 0.7, fontSize: 11 }}>({u.role})</span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn btn-secondary" onClick={() => navigate('/projects')}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? 'Update Project' : 'Create Project'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
