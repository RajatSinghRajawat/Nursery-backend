const Product = require("../models/Productsmodel");

const productadd = async (req, res) => {
  try {

    const {
      name,
      price,
      discount,
      soldBy,
      responseRate,
      categoryId,
      description,
      stock
    } = req.body;

    // images from multer
    const image = req.files ? req.files.map(file => file.path) : [];

    const product = await Product.create({
      user: req.user?.id,  // vendor id from token
      name,
      price,
      discount,
      soldBy,
      responseRate,
      categoryId,
      description,
      image,
      stock,
      reviews: [] // default empty
    });

    res.status(201).json({
      success: true,
      message: "Product added successfully",
      product
    });

  } catch (error) {
    console.error("Error adding product:", error);

    res.status(500).json({
      success: false,
      message: "Failed to add product",
      error: error.message
    });
  }
};

module.exports = productadd;