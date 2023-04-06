const express = require("express");

const db = require("../db.js");

let router = new express.Router();

// GET /invoices
// get invoices as {invoices: [{id, comp_code}, ...]}
router.get("/", async function(req, res, next) {
    try {

        const data = await db.query(`SELECT id, comp_code FROM invoices ORDER BY id`)

        return res.json({
            invoices: data.rows
        })

    } catch(e) {
        return next(e);
    }
})


// GET /invoices/:id
// get full invoice data {invoice: {id, amt, paid, add_date, paid_date, company: {code, name, description}}}
router.get("/:id", async function(req, res, next) {
    try {
        const data = await db.query(`SELECT * FROM invoices WHERE id = $1`, 
                        [req.params.id]);
        if (data.rows.length === 0) return res.status(404).json({ message: "Invoice Not Found"})

        return res.json({
            invoice: data.rows
        })
    } catch(e) {
        return next(e);
    }
})


// POST /invoices
// Add new invoice => invoice data {compCode, amount} 
// returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.post("/", async function(req, res, next) {
    try {
        const {compCode, amount} = req.body; 
        
        const newCompany =  await db.query(`
                            INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) 
                            RETURNING id, comp_code, amt, paid, add_date, paid_date
                            `, [compCode, amount]);

        return res.status(201).json({
            invoice: newCompany.rows[0]
        })

    } catch(e) {
        return next(e);
    }
})


// PUT /invoices/:id
// updates invoice data : {amt, paid (BOOL)}
// Returns {invoice: {id, comp_code, amt, paid, add_date, paid_date}}
router.put("/:id", async function(req, res, next) {
    try {

        let newPaymentDate = null;

        const data = await db.query(`SELECT * FROM invoices WHERE id = $1`, 
                        [req.params.id]);
        if (data.rows.length === 0) return res.status(404).json({ message: `Invoice ${id} Not Found`})


               
        let { amount:updatedAmount=data.rows[0].amt, paid:updatedPaid=data.rows[0].paid } = req.body;

        if ( !updatedPaid ) {
            newPaymentDate = null;
        } else if (updatedPaid && !data.rows[0].paid_date) {
            newPaymentDate = new Date();
        } else {
            newPaymentDate = data.rows[0].paid_date
        }

        const updateData = await db.query(`
                            UPDATE invoices SET paid = $1, amt = $2, paid_date = $3 
                            WHERE id = $4
                            RETURNING id, comp_code, amt, paid, add_date, paid_date`, 
                            [updatedPaid, updatedAmount, newPaymentDate, req.params.id]);
        
         return res.json({
            message: "Update Success",
            invoice: updateData.rows[0]
        })
    } catch(e) {
        return next(e);
    }
})

// DELETE /invoices/:id
// Delete selected invoice
router.delete("/:id", async function(req, res, next) {
    try {
        const { id } = req.params;
        const data = await db.query(`SELECT * FROM invoices WHERE id = $1`, 
                        [id]);
        if (data.rows.length === 0) return res.status(404).json({ message: `Invoice Not Found`})

        const deletedInvoice = await db.query(`
                                DELETE FROM invoices WHERE id = $1 RETURNING comp_code, id`, [id]);
        return res.json({ message: `Invoice ${deletedInvoice.rows[0].id} with ${deletedInvoice.rows[0].comp_code} removed!`})

    } catch(e) {
        return next(e);
    }
})


module.exports = router;