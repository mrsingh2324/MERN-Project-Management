const Project = require('../models/Project');
const Issue = require('../models/Issue');

// @desc  Create project
// @route POST /api/projects
const createProject = async (req, res) => {
  try {
    const { title, description, startDate, endDate, status, members } = req.body;

    if (!title || !startDate || !endDate) {
      return res.status(400).json({ message: 'Title, start date, and end date are required' });
    }

    const project = await Project.create({
      title,
      description,
      startDate,
      endDate,
      status,
      members: members || [],
      manager: req.user._id,
    });

    const populated = await project.populate(['manager', 'members']);
    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get all projects (admin sees all, member sees their own)
// @route GET /api/projects
const getProjects = async (req, res) => {
  try {
    let query = {};
    if (req.user.role !== 'admin') {
      query = { $or: [{ members: req.user._id }, { manager: req.user._id }] };
    }

    // Search by title
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }
    if (req.query.status) {
      query.status = req.query.status;
    }

    const projects = await Project.find(query)
      .populate('manager', 'name email')
      .populate('members', 'name email')
      .sort({ createdAt: -1 });

    res.json(projects);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single project
// @route GET /api/projects/:id
const getProjectById = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('manager', 'name email')
      .populate('members', 'name email');

    if (!project) {
      return res.status(404).json({ message: 'Project not found' });
    }

    // Check access
    if (
      req.user.role !== 'admin' &&
      project.manager._id.toString() !== req.user._id.toString() &&
      !project.members.some((m) => m._id.toString() === req.user._id.toString())
    ) {
      return res.status(403).json({ message: 'Access denied' });
    }

    res.json(project);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update project
// @route PUT /api/projects/:id
const updateProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (
      req.user.role !== 'admin' &&
      project.manager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Only admins or project manager can update' });
    }

    const updated = await Project.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('manager', 'name email')
      .populate('members', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete project
// @route DELETE /api/projects/:id
const deleteProject = async (req, res) => {
  try {
    const project = await Project.findById(req.params.id);
    if (!project) return res.status(404).json({ message: 'Project not found' });

    if (
      req.user.role !== 'admin' &&
      project.manager.toString() !== req.user._id.toString()
    ) {
      return res.status(403).json({ message: 'Only admins or project manager can delete' });
    }

    await Issue.deleteMany({ project: req.params.id });
    await project.deleteOne();
    res.json({ message: 'Project and related issues deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Dashboard stats
// @route GET /api/projects/dashboard
const getDashboardStats = async (req, res) => {
  try {
    const now = new Date();

    if (req.user.role === 'admin') {
      const totalProjects = await Project.countDocuments();
      const totalIssues = await Issue.countDocuments();
      const pendingIssues = await Issue.countDocuments({ status: { $in: ['open', 'in-progress'] } });
      const completedIssues = await Issue.countDocuments({ status: { $in: ['resolved', 'closed'] } });
      const overdueIssues = await Issue.countDocuments({
        dueDate: { $lt: now },
        status: { $nin: ['resolved', 'closed'] },
      });

      return res.json({ totalProjects, totalIssues, pendingIssues, completedIssues, overdueIssues });
    } else {
      const assignedIssues = await Issue.countDocuments({ assignedTo: req.user._id });
      const inProgressIssues = await Issue.countDocuments({ assignedTo: req.user._id, status: 'in-progress' });
      const completedIssues = await Issue.countDocuments({ assignedTo: req.user._id, status: { $in: ['resolved', 'closed'] } });
      const upcomingDeadlines = await Issue.countDocuments({
        assignedTo: req.user._id,
        dueDate: { $gte: now, $lte: new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000) },
        status: { $nin: ['resolved', 'closed'] },
      });

      return res.json({ assignedIssues, inProgressIssues, completedIssues, upcomingDeadlines });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createProject, getProjects, getProjectById, updateProject, deleteProject, getDashboardStats };
