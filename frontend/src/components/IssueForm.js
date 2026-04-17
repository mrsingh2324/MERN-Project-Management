import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

const DEFAULT_FORM = {
  title: '',
  description: '',
  project: '',
  assignedTo: '',
  priority: 'medium',
  status: 'open',
  dueDate: '',
};

export default function IssueForm() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isEdit = Boolean(id);

  const [form, setForm] = useState(DEFAULT_FORM);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isOwner, setIsOwner] = useState(false);

  useEffect(() => {
    if (user?.role === 'admin') {
      api.get('/projects').then(({ data }) => setProjects(data)).catch(() => {});
      api.get('/auth/users').then(({ data }) => setUsers(data)).catch(() => {});
    }

    if (isEdit) {
      api.get(`/issues/${id}`).then(({ data }) => {
        setForm({
          title: data.title || '',
          description: data.description || '',
          project: data.project?._id || '',
          assignedTo: data.assignedTo?._id || '',
          priority: data.priority || 'medium',
          status: data.status || 'open',
          dueDate: data.dueDate ? data.dueDate.split('T')[0] : '',
        });
        setComments(data.comments || []);
        setIsOwner(data.assignedTo?._id === user?._id || user?.role === 'admin');
      }).catch(() => setError('Failed to load issue'));
    }
  }, [id, isEdit, user]);

  const handleChange = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (!form.title) return setError('Title is required');
    if (!isEdit && !form.project) return setError('Project is required');

    try {
      setLoading(true);
      if (isEdit) {
        await api.put(`/issues/${id}`, form);
        setSuccess('Issue updated!');
      } else {
        await api.post('/issues', form);
        setSuccess('Issue created!');
        setTimeout(() => navigate('/issues'), 1000);
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  const handleAddComment = async (e) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    try {
      const { data } = await api.post(`/issues/${id}/comments`, { text: newComment });
      setComments(data);
      setNewComment('');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to add comment');
    }
  };

  const canEdit = user?.role === 'admin' || isOwner;

  return (
    <div className="page">
      <div className="page-header">
        <h1>{isEdit ? '🐛 Issue Detail' : '➕ New Issue'}</h1>
        <button className="btn btn-secondary" onClick={() => navigate('/issues')}>← Back</button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: isEdit ? '1fr 1fr' : '1fr', gap: 20, maxWidth: isEdit ? '100%' : 640 }}>
        <div className="card">
          <h3 style={{ marginBottom: 16 }}>{isEdit ? 'Edit Issue' : 'Issue Details'}</h3>

          {error && <div className="alert alert-error">{error}</div>}
          {success && <div className="alert alert-success">{success}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label>Issue Title *</label>
              <input
                name="title"
                placeholder="e.g. Login button not working"
                value={form.title}
                onChange={handleChange}
                disabled={!canEdit}
              />
            </div>

            <div className="form-group">
              <label>Description</label>
              <textarea
                name="description"
                placeholder="Describe the issue in detail..."
                value={form.description}
                onChange={handleChange}
                disabled={!canEdit}
              />
            </div>

            {user?.role === 'admin' && (
              <>
                <div className="form-group">
                  <label>Project *</label>
                  <select name="project" value={form.project} onChange={handleChange}>
                    <option value="">— Select Project —</option>
                    {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
                  </select>
                </div>

                <div className="form-group">
                  <label>Assign To</label>
                  <select name="assignedTo" value={form.assignedTo} onChange={handleChange}>
                    <option value="">— Unassigned —</option>
                    {users.map((u) => <option key={u._id} value={u._id}>{u.name} ({u.role})</option>)}
                  </select>
                </div>
              </>
            )}

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div className="form-group">
                <label>Priority</label>
                <select name="priority" value={form.priority} onChange={handleChange} disabled={user?.role !== 'admin'}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                  <option value="critical">Critical</option>
                </select>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select name="status" value={form.status} onChange={handleChange} disabled={!canEdit}>
                  <option value="open">Open</option>
                  <option value="in-progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="closed">Closed</option>
                </select>
              </div>
            </div>

            <div className="form-group">
              <label>Due Date</label>
              <input type="date" name="dueDate" value={form.dueDate} onChange={handleChange} disabled={user?.role !== 'admin'} />
            </div>

            {canEdit && (
              <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
                <button type="button" className="btn btn-secondary" onClick={() => navigate('/issues')}>Cancel</button>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? 'Saving...' : isEdit ? 'Update Issue' : 'Create Issue'}
                </button>
              </div>
            )}
          </form>
        </div>

        {isEdit && (
          <div className="card">
            <h3 style={{ marginBottom: 16 }}>💬 Comments & Notes</h3>

            {comments.length === 0 ? (
              <div style={{ color: '#bbb', fontSize: 14, marginBottom: 16 }}>No comments yet. Be the first!</div>
            ) : (
              <div className="comments-section" style={{ marginTop: 0 }}>
                {comments.map((c, i) => (
                  <div key={i} className="comment">
                    <div>
                      <span className="comment-author">{c.user?.name || 'Unknown'}</span>
                      <span className="comment-time">{new Date(c.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="comment-text">{c.text}</div>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAddComment} style={{ marginTop: 16 }}>
              <div className="form-group">
                <label>Add a comment</label>
                <textarea
                  placeholder="Type your note or work update..."
                  value={newComment}
                  onChange={(e) => setNewComment(e.target.value)}
                  rows={3}
                />
              </div>
              <button type="submit" className="btn btn-primary btn-sm">Post Comment</button>
            </form>
          </div>
        )}
      </div>
    </div>
  );
}
