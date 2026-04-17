import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { useAuth } from '../context/AuthContext';

export default function ProjectList() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);
      const { data } = await api.get(`/projects?${params}`);
      setProjects(Array.isArray(data) ? data : data.projects || []);
    } catch (err) {
      setError('Failed to load projects');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchProjects(); }, [search, statusFilter]);

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this project and all its issues?')) return;
    try {
      await api.delete(`/projects/${id}`);
      setProjects((prev) => prev.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.response?.data?.message || 'Delete failed');
    }
  };

  const formatDate = (d) => d ? new Date(d).toLocaleDateString() : '—';

  return (
    <div className="page">
      <div className="page-header">
        <h1>📁 Projects</h1>
        {user?.role === 'admin' && (
          <Link to="/projects/new" className="btn btn-primary">+ New Project</Link>
        )}
      </div>

      <div className="filter-bar">
        <input
          placeholder="🔍 Search by title..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
          <option value="">All Statuses</option>
          <option value="planning">Planning</option>
          <option value="active">Active</option>
          <option value="on-hold">On Hold</option>
          <option value="completed">Completed</option>
        </select>
        <button className="btn btn-secondary btn-sm" onClick={fetchProjects}>Refresh</button>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      {loading ? (
        <div className="loading">Loading projects...</div>
      ) : projects.length === 0 ? (
        <div className="card empty-state">
          <div className="icon">📂</div>
          <p>No projects found. {user?.role === 'admin' && 'Create one to get started!'}</p>
        </div>
      ) : (
        <div className="card table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Manager</th>
                <th>Members</th>
                <th>Start Date</th>
                <th>End Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {projects.map((p) => (
                <tr key={p._id}>
                  <td>
                    <strong>{p.title}</strong>
                    {p.description && (
                      <div style={{ fontSize: 12, color: '#999', marginTop: 2 }}>
                        {p.description.slice(0, 60)}{p.description.length > 60 ? '...' : ''}
                      </div>
                    )}
                  </td>
                  <td><span className={`badge badge-${p.status}`}>{p.status}</span></td>
                  <td>{p.manager?.name || '—'}</td>
                  <td>{p.members?.length || 0} member{p.members?.length !== 1 ? 's' : ''}</td>
                  <td>{formatDate(p.startDate)}</td>
                  <td>{formatDate(p.endDate)}</td>
                  <td>
                    <div className="actions">
                      <Link
                        to="/issues"
                        onClick={() => sessionStorage.setItem('projectFilter', p._id)}
                        className="btn btn-secondary btn-sm"
                      >Issues</Link>
                      {user?.role === 'admin' && (
                        <>
                          <button
                            className="btn btn-secondary btn-sm"
                            onClick={() => navigate(`/projects/${p._id}/edit`)}
                          >Edit</button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => handleDelete(p._id)}
                          >Delete</button>
                        </>
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
