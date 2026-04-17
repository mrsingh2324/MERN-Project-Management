import React, { useEffect, useState, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function IssueList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [issues, setIssues] = useState([]);
  const [projects, setProjects] = useState([]);
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    project: sessionStorage.getItem('projectFilter') || '',
    assignedTo: '',
  });

  useEffect(() => {
    sessionStorage.removeItem('projectFilter');
    api.get('/projects').then(({ data }) => setProjects(data)).catch(() => {});
    if (user?.role === 'admin') {
      api.get('/auth/users').then(({ data }) => setUsers(data)).catch(() => {});
    }
  }, [user]);

  const fetchIssues = useCallback(async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      Object.entries(filters).forEach(([k, v]) => { if (v) params.append(k, v); });
      const { data } = await api.get(`/issues?${params}`);
      setIssues(data);
    } catch (err) {
      setError('Failed to load issues');
    } finally {
      setLoading(false);
    }
  }, [filters]);

  useEffect(() => { fetchIssues(); }, [fetchIssues]);

  const handleFilterChange = (e) => {
    setFilters((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this issue?')) return;
    try {
      await api.delete(`/issues/${id}`);
      setIssues((prev) => prev.filter((i) => i._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const handleQuickStatus = async (issueId, newStatus) => {
    try {
      await api.put(`/issues/${issueId}`, { status: newStatus });
      setIssues((prev) => prev.map((i) => i._id === issueId ? { ...i, status: newStatus } : i));
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed');
    }
  };

  const isOverdue = (issue) => issue.dueDate && new Date(issue.dueDate) < new Date() && !['resolved', 'closed'].includes(issue.status);
  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="page">
      <div className="page-header">
        <h1>🐛 {user?.role === 'admin' ? 'All Issues' : 'My Tasks'}</h1>
        {user?.role === 'admin' && (
          <Link to="/issues/new" className="btn btn-primary">+ New Issue</Link>
        )}
      </div>

      <div className="filter-bar">
        <input
          name="search"
          placeholder="🔍 Search by title..."
          value={filters.search}
          onChange={handleFilterChange}
          style={{ flex: 1, minWidth: 180 }}
        />
        <select name="status" value={filters.status} onChange={handleFilterChange}>
          <option value="">All Statuses</option>
          <option value="open">Open</option>
          <option value="in-progress">In Progress</option>
          <option value="resolved">Resolved</option>
          <option value="closed">Closed</option>
        </select>
        <select name="priority" value={filters.priority} onChange={handleFilterChange}>
          <option value="">All Priorities</option>
          <option value="low">Low</option>
          <option value="medium">Medium</option>
          <option value="high">High</option>
          <option value="critical">Critical</option>
        </select>
        <select name="project" value={filters.project} onChange={handleFilterChange}>
          <option value="">All Projects</option>
          {projects.map((p) => <option key={p._id} value={p._id}>{p.title}</option>)}
        </select>
        {user?.role === 'admin' && (
          <select name="assignedTo" value={filters.assignedTo} onChange={handleFilterChange}>
            <option value="">All Members</option>
            {users.map((u) => <option key={u._id} value={u._id}>{u.name}</option>)}
          </select>
        )}
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading issues...</div>
      ) : issues.length === 0 ? (
        <div className="card empty-state">
          <div className="icon">📋</div>
          <p>No issues found matching your filters.</p>
        </div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Project</th>
                <th>Assigned To</th>
                <th>Priority</th>
                <th>Status</th>
                <th>Due Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {issues.map((issue) => (
                <tr key={issue._id} style={isOverdue(issue) ? { background: '#fff1f0' } : {}}>
                  <td>
                    <strong>{issue.title}</strong>
                    {isOverdue(issue) && <span style={{ marginLeft: 6, color: '#ff4d4f', fontSize: 11 }}>⚠ OVERDUE</span>}
                    {issue.description && (
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {issue.description.slice(0, 50)}{issue.description.length > 50 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td style={{ fontSize: 13 }}>{issue.project?.title || '—'}</td>
                  <td style={{ fontSize: 13 }}>{issue.assignedTo?.name || <span style={{ color: '#ccc' }}>Unassigned</span>}</td>
                  <td><span className={`badge badge-${issue.priority}`}>{issue.priority}</span></td>
                  <td>
                    <select
                      value={issue.status}
                      onChange={(e) => handleQuickStatus(issue._id, e.target.value)}
                      disabled={user?.role !== 'admin' && issue.assignedTo?._id !== user?._id}
                      style={{
                        border: 'none', background: 'transparent', fontWeight: 600,
                        fontSize: 12, cursor: 'pointer', color:
                          issue.status === 'open' ? '#1890ff' :
                          issue.status === 'in-progress' ? '#fa8c16' :
                          issue.status === 'resolved' ? '#52c41a' : '#999'
                      }}
                    >
                      <option value="open">Open</option>
                      <option value="in-progress">In Progress</option>
                      <option value="resolved">Resolved</option>
                      <option value="closed">Closed</option>
                    </select>
                  </td>
                  <td style={{ fontSize: 13, color: isOverdue(issue) ? '#ff4d4f' : 'inherit' }}>
                    {formatDate(issue.dueDate)}
                  </td>
                  <td>
                    <div className="actions">
                      <button
                        className="btn btn-secondary btn-sm"
                        onClick={() => navigate(`/issues/${issue._id}/edit`)}
                      >View</button>
                      {user?.role === 'admin' && (
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => handleDelete(issue._id)}
                        >Del</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
