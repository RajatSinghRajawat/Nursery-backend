const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema(
    {
        Id: {
            type: String,
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        description: {
            type: String,
            trim: true,
        },
        subcategories: [
            {
                Id: {
                    type: String,
                },
                name: {
                    type: String,
                    required: true,
                    trim: true,
                },
            },
        ],
    },
    {
        timestamps: true,
    }
);

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
