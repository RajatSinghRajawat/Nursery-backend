const express = require("express");
const router = express.Router();
const { createLead } = require("../controllers/customerLeadController");

router.post("/submit", createLead);

module.exports = router;
