const Issue = require('../models/Issue');
const Project = require('../models/Project');

// @desc  Create issue
// @route POST /api/issues
const createIssue = async (req, res) => {
  try {
    const { title, description, project, assignedTo, priority, dueDate } = req.body;

    if (!title || !project) {
      return res.status(400).json({ message: 'Title and project are required' });
    }

    const projectExists = await Project.findById(project);
    if (!projectExists) return res.status(404).json({ message: 'Project not found' });

    const issue = await Issue.create({
      title,
      description,
      project,
      assignedTo: assignedTo || null,
      priority,
      dueDate,
      createdBy: req.user._id,
    });

    const populated = await issue.populate([
      { path: 'project', select: 'title' },
      { path: 'assignedTo', select: 'name email' },
      { path: 'createdBy', select: 'name email' },
    ]);

    res.status(201).json(populated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get issues with filters
// @route GET /api/issues
const getIssues = async (req, res) => {
  try {
    let query = {};

    if (req.user.role !== 'admin') {
      query.assignedTo = req.user._id;
    }

    if (req.query.status) query.status = req.query.status;
    if (req.query.priority) query.priority = req.query.priority;
    if (req.query.project) query.project = req.query.project;
    if (req.query.assignedTo) query.assignedTo = req.query.assignedTo;
    if (req.query.search) {
      query.title = { $regex: req.query.search, $options: 'i' };
    }

    const issues = await Issue.find(query)
      .populate('project', 'title')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 });

    res.json(issues);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Get single issue
// @route GET /api/issues/:id
const getIssueById = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id)
      .populate('project', 'title')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('comments.user', 'name');

    if (!issue) return res.status(404).json({ message: 'Issue not found' });
    res.json(issue);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Update issue
// @route PUT /api/issues/:id
const updateIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    const isMember = req.user.role !== 'admin';
    const isAssigned = issue.assignedTo && issue.assignedTo.toString() === req.user._id.toString();

    if (isMember && !isAssigned) {
      return res.status(403).json({ message: 'You can only update issues assigned to you' });
    }

    // Members can only update status and add comments
    if (isMember) {
      const allowedFields = ['status', 'comments'];
      Object.keys(req.body).forEach((key) => {
        if (!allowedFields.includes(key)) delete req.body[key];
      });
    }

    const updated = await Issue.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    })
      .populate('project', 'title')
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');

    res.json(updated);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Add comment to issue
// @route POST /api/issues/:id/comments
const addComment = async (req, res) => {
  try {
    const { text } = req.body;
    if (!text) return res.status(400).json({ message: 'Comment text is required' });

    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    issue.comments.push({ user: req.user._id, text });
    await issue.save();

    const updated = await Issue.findById(req.params.id).populate('comments.user', 'name');
    res.json(updated.comments);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc  Delete issue
// @route DELETE /api/issues/:id
const deleteIssue = async (req, res) => {
  try {
    const issue = await Issue.findById(req.params.id);
    if (!issue) return res.status(404).json({ message: 'Issue not found' });

    if (req.user.role !== 'admin') {
      return res.status(403).json({ message: 'Only admins can delete issues' });
    }

    await issue.deleteOne();
    res.json({ message: 'Issue deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = { createIssue, getIssues, getIssueById, updateIssue, addComment, deleteIssue };
