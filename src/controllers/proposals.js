const Proposal = require('../models/proposals');
const sendEmail = require('../common/otpsend');
const User = require('../models/User');

const createProposal = async (req, res) => {
    try {
        const {
            user,
            clientName,
            contactNumber,
            emailId,
            address,
            shipToAddress,
            description,
            items,
            hsnCode,
            gst,
            termsAndConditions,
            note
        } = req.body;

        const proposal = await Proposal.create({
            user,
            clientName,
            contactNumber,
            emailId,
            address,
            shipToAddress,
            description,
            items,
            hsnCode,
            gst,
            termsAndConditions,
            note
        });

        // ✅ FIX: single user
        const selectedUser = await User.findById(user);

        if (!selectedUser || !selectedUser.email) {
            return res.status(400).json({ message: "User email not found" });
        }

        const emails = [selectedUser.email.trim()];
        const itemsHtml = items.map((item, index) => `
    <tr>
        <td>${index + 1}</td>
        <td>${item.itemName}</td>
        <td>${item.itemDescription}</td>
        <td>${item.quantity}</td>
        <td>₹${item.rate}</td>
        <td>₹${item.quantity * item.rate}</td>
    </tr>
`).join('');

        await sendEmail(
            emails,
            "New Proposal Created",
            `Proposal for ${clientName}`,
            `
    <div style="font-family: Arial; padding: 20px;">
        <h2 style="color:#2c3e50;">📄 New Proposal</h2>

        <p><strong>Client Name:</strong> ${clientName}</p>
        <p><strong>Contact Number:</strong> ${contactNumber}</p>
        <p><strong>Email:</strong> ${emailId}</p>
        <p><strong>Address:</strong> ${address}</p>
        <p><strong>Ship To:</strong> ${shipToAddress}</p>
        <p><strong>Description:</strong> ${description}</p>

        <h3 style="margin-top:20px;">🛒 Items</h3>

        <table border="1" cellpadding="10" cellspacing="0" style="border-collapse: collapse; width:100%;">
            <thead style="background-color:#f2f2f2;">
                <tr>
                    <th>#</th>
                    <th>Item Name</th>
                    <th>Description</th>
                    <th>Qty</th>
                    <th>Rate</th>
                    <th>Amount</th>
                </tr>
            </thead>
            <tbody>
                ${itemsHtml}
            </tbody>
        </table>

        <p style="margin-top:20px;"><strong>HSN Code:</strong> ${hsnCode}</p>
        <p><strong>GST:</strong> ${gst ? "18% Applied" : "Not Applied"}</p>

        <h4 style="margin-top:20px;">📜 Terms & Conditions</h4>
        <p>${termsAndConditions}</p>

        <h4>📝 Note</h4>
        <p>${note}</p>

        <hr/>

        <p style="color:gray; font-size:12px;">
            This is an auto-generated proposal. Please review and respond accordingly.
        </p>
    </div>
    `
        );
        res.status(201).json({
            message: "Proposal created & sent successfully",
            proposal
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const getAllProposals = async (req, res) => {
    try {
        const { page = 1, limit = 10, search = "" } = req.query;

        const query = {
            clientName: { $regex: search, $options: "i" }
        };

        const proposals = await Proposal.find(query)
            .populate("user")
            .skip((page - 1) * limit)
            .limit(Number(limit))
            .sort({ createdAt: -1 });

        const total = await Proposal.countDocuments(query);

        res.json({
            total,
            page: Number(page),
            totalPages: Math.ceil(total / limit),
            proposals
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
    }
};

const getProposalById = async (req, res) => {
    try {
        const proposal = await Proposal.findById(req.params.id)
            .populate('user', 'name email')
            .populate('product', 'name price');

        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        res.status(200).json(proposal);

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
const updateProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findByIdAndUpdate(
            req.params.id,
            req.body,
            { new: true, runValidators: true }
        );

        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        res.status(200).json({
            message: "Updated successfully",
            proposal
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

const deleteProposal = async (req, res) => {
    try {
        const proposal = await Proposal.findByIdAndDelete(req.params.id);

        if (!proposal) {
            return res.status(404).json({ message: "Proposal not found" });
        }

        res.status(200).json({
            message: "Deleted successfully"
        });

    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

module.exports = {
    createProposal,
    getAllProposals,
    getProposalById,
    updateProposal,
    deleteProposal,


};