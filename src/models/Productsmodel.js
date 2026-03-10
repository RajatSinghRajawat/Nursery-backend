const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.ObjectId,
        ref: "User",
    },
    name: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    discount:{
        type: Number,
         required: true
    },
    soldBy: {
        type: String,
        required: true
    },
     responseRate: {
        type: Number,
        min: 0,
        max: 100
    },
     Categories_id: {
        type: Number,

    },
    productCategoryName: {
        type: String
    },

     category: {
        type: String,
        required: true
    },
    description: {
        type: String,
        required: true
    },
    reviews: [
        {
            name: {
                type: String,
                required: true
            },
            rating: {
                type: Number,
                required: true
            },
            comment: {
                type: String,
                required: true
            }
        }
    ],
    image: {
        type: [String],
        required: true
    },
   
    stock: {
        type: Number,
        required: true
    }
});

const Product = mongoose.model('Product', productSchema);
module.exports = Product;