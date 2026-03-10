const mongoose = require('mongoose');
const categorySchema = new mongoose.Schema({
    Id: {
        type: String,
    },
    name: {
        type: String,
    },
    subcategories: [
        {
            Id: {
                type: String,
            },
            name: {
                type: String,
            },
        },
    ],
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
