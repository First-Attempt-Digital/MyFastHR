const express = require('express');
const router = express.Router();
const db = require('../config/db');
const { authenticate } = require('../middlewares/authMiddleware');
const tenantFilter = require('../middlewares/tenantMiddleware');

// router.use(authenticate, tenantFilter); // Handled by app.js

// Get all categories for a company (including global ones)
router.get('/', async (req, res) => {
    try {
        const companyId = req.company_id;
        const categories = await db('document_categories')
            .where('company_id', companyId)
            .orWhereNull('company_id')
            .orderBy('created_at', 'asc');
        
        res.json(categories);
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Create a new category
router.post('/', async (req, res) => {
    try {
        const { name } = req.body;
        const companyId = req.company_id;

        console.log(`>>> [CATEGORIES]: Create Request - Name: ${name}, CompanyID: ${companyId}`);

        if (!name) return res.status(400).json({ message: 'Name is required' });

        const [id] = await db('document_categories').insert({
            name,
            company_id: companyId
        });

        const newCategory = await db('document_categories').where('id', id).first();
        console.log(`>>> [CATEGORIES]: Created successfully with ID: ${id}`);
        res.status(201).json(newCategory);
    } catch (err) {
        console.error('>>> [CATEGORIES-POST-ERROR]:', err);
        res.status(400).json({ message: err.message });
    }
});

// Update a category
router.patch('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const companyId = req.company_id;

        const category = await db('document_categories')
            .where('id', id)
            .andWhere('company_id', companyId)
            .first();

        if (!category) {
            return res.status(403).json({ message: 'Forbidden: You cannot edit global or other company categories' });
        }

        await db('document_categories').where('id', id).update({ name });
        res.json({ message: 'Category updated successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

// Delete a category
router.delete('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const companyId = req.company_id;

        const category = await db('document_categories')
            .where('id', id)
            .andWhere('company_id', companyId)
            .first();

        if (!category) {
            return res.status(403).json({ message: 'Forbidden: You cannot delete global categories' });
        }

        await db('document_categories').where('id', id).del();
        res.json({ message: 'Category deleted successfully' });
    } catch (err) {
        res.status(400).json({ message: err.message });
    }
});

module.exports = router;
