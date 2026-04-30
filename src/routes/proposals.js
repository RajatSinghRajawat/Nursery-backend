const router = require('express').Router();

const {
    createProposal,
    getAllProposals,
    getProposalById,
    updateProposal,
    deleteProposal
} = require('../controllers/proposals');


router.post('/createProposals', createProposal);
router.get('/', getAllProposals);
router.get('/getproposalById/:id', getProposalById);
router.get('/:id', getProposalById);
router.put('/:id', updateProposal);
router.delete('/:id', deleteProposal);


module.exports = router;