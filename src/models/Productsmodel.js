const mongoose = require('mongoose');

const productSchema = new mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
        },
        name: {
            type: String,
            required: true,
            trim: true,
        },
        price: {
            type: Number,
            required: true,
        },
        discount: {
            type: Number,
            required: true,
            default: 0,
        },
        soldBy: {
            type: String,
            required: true,
            trim: true,
        },
        responseRate: {
            type: Number,
            min: 0,
            max: 100,
        },
        // // Old numeric category id (kept for backward compatibility)
        // Categories_id: {
        //     type: Number,
        // },
        // Proper relation with Category model
        categoryId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Category',
        },
   
        description: {
            type: String,
            required: true,
            trim: true,
        },
        reviews: [
            {
                name: {
                    type: String,
                    required: true,
                },
                rating: {
                    type: Number,
                    required: true,
                },
                comment: {
                    type: String,
                    required: true,
                },
            },
        ],
        image: {
            type: [String],
            required: true,
        },
        stock: {
            type: Number,
            required: true,
        },
        isActive: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
    }
);

const Product = mongoose.model('Product', productSchema);

module.exports = Product;