const University = require('../models/university.model');

// GET /api/universities — public, used by signup form to list universities
exports.list = async (req, res) => {
  try {
    const universities = await University.find({}, '_id name slug domain').sort('name');
    res.status(200).json(universities);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// GET /api/universities/:slug — resolve slug to university object
exports.getBySlug = async (req, res) => {
  try {
    const university = await University.findOne({ slug: req.params.slug }, '_id name slug domain address');
    if (!university) return res.status(404).json({ message: 'University not found.' });
    res.status(200).json(university);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};

// PATCH /api/universities/my — admin updates their own university info
exports.updateMyUniversity = async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admins only.' });
    const { name, domain, address } = req.body;
    const university = await University.findById(req.user.university);
    if (!university) return res.status(404).json({ message: 'University not found.' });
    if (name    !== undefined) university.name    = name;
    if (domain  !== undefined) university.domain  = domain;
    if (address !== undefined) university.address = address;
    await university.save();
    res.status(200).json(university);
  } catch (error) {
    res.status(500).json({ message: 'Server error.' });
  }
};
