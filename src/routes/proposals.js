const router = require('express').Router();

const { createProposal , getAllProposals , getProposalById } = require('../controllers/proposals');


router.post('/createProposals', createProposal);
router.get('/', getAllProposals);
router.get('/getproposalById/:id', getProposalById);


module.exports = router;