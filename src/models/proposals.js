const mongoose = require("mongoose")



const proposalSchema = new mongoose.Schema(
    {
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
        date: { type: Date, default: Date.now },
        clientName: { type: String, required: true },
        contactNumber: { type: String, required: true },
        emailId: { type: String, required: true },
        address: { type: String, required: true },
        shipToAddress: { type: String, required: true },
        description: { type: String, required: true },
        items: [
            {
                product: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'Product'
                },
                description: String,
                quantity: Number,
                rate: Number
            }
        ],

        hsnCode: { type: String, required: true },
        gst: { type: Boolean, required: true },
        termsAndConditions: { type: String, required: true },
        note: { type: String, required: true },
    }, { timestamps: true }
);

const Proposal = mongoose.model('Proposal', proposalSchema);


module.exports = Proposal;