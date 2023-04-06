const express = require("express");
const { ExpressError } = require("../expressError.js");
const db = require("../db.js");

const slugify = require("slugify");

let router = new express.Router();

// GET /companies
// get companies as [{name: "Name1", code: "Code1"}, {name: "Name2", code: "Code2"}]
router.get("/", async function(req, res, next) {
    try {
        const data = await  db.query(`
                            SELECT name, code FROM companies
                            `)
        return res.status(200).json({
            companies: data.rows
        })
    } catch(e) {
        return next(e);
    }
})


// POST /companies
// Add new company => company data {name, description}
router.post("/", async function(req, res, next) {
    try {
        const {name, description} = req.body; 
        const code = slugify(name.toLowerCase());
        
        const companyCheck = await db.query(`
            SELECT * FROM companies WHERE code = $1
            `, [code]);
        
        if (companyCheck.rows.length === 0) {
            const newCompany =  await db.query(`
                                INSERT INTO companies (name, code, description) VALUES ($1, $2, $3) RETURNING name, code
                                `, [name, code, description]);
            return res.status(201).json({
                message: `Added new company ${newCompany.rows[0].name} [CODE: ${newCompany.rows[0].name}]`
            })
        } else {
            return res.json({ message: `Company ${name} [CODE: ${code}] already exists`})
        }

    } catch(e) {
        return next(e);
    }
})


// GET /companies/:code
// get full company data {name, code, description}
router.get("/:compCode", async function(req, res, next) {
    try {
        const data = await db.query(`SELECT * FROM companies WHERE code = $1`, 
                        [req.params.compCode]);
        if (data.rows.length === 0) return res.status(404).json({ message: "Company Not Found"})

        return res.json({
            companies: data.rows
        })
    } catch(e) {
        return next(e);
    }
})


// PUT /companies/:code
// updates company data : Form Input Data {name, description}
router.put("/:compCode", async function(req, res, next) {
    try {

        const data = await db.query(`SELECT * FROM companies WHERE code = $1`, 
                        [req.params.compCode]);
        if (data.rows.length === 0) return res.status(404).json({ message: "Company Not Found"})
        
        const { name = data.rows[0].name, description = data.rows[0].description } = req.body;

        const updateData = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3
                        RETURNING name, code, description`, 
                        [name, description, req.params.compCode]);
        
         return res.json({
            message: "Update Success",
            company: updateData.rows[0]
        })
    } catch(e) {
        return next(e);
    }
})


// DELETE /companies/:code
// Delete selected company
router.delete("/:compCode", async function(req, res, next) {
    try {
        const { compCode } = req.params;
        const data = await db.query(`SELECT * FROM companies WHERE code = $1`, 
                        [compCode]);
        if (data.rows.length === 0) return res.status(404).json({ message: `Company Not Found`})

        const deletedCompany = await db.query(`
                                DELETE FROM companies WHERE code = $1 RETURNING name, code`, [compCode]);
        return res.json({ message: `Company ${deletedCompany.rows[0].name} removed!`})

    } catch(e) {
        return next(e);
    }
})


module.exports = router;