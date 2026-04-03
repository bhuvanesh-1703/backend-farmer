const Product = require("../models/Product");
const Category = require("../models/Category");
const Vendor = require("../models/Vendor");
const mongoose = require("mongoose");

const getProduct = async (req, res) => {
  try {
    const { status, vendorId } = req.query;

    let filter = {};
    if (status) filter.status = status;
    if (vendorId) filter.vendor_id = vendorId;

    const products = await Product.find(filter)
      .populate("categories_id")
      .sort({ created_at: -1 });

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      product: products,
    });
  } catch (error) {
    console.error("Database error in getProduct:", error);
    res.status(400).json({
      success: false,
      message: "Failed to get product",
      error: error.message,
    });
  }
};

const addProduct = async (req, res) => {
  try {
    let imageArr = [];
    if (req.files && Array.isArray(req.files)) {
      imageArr = req.files.map((file) => file.filename);
    } else if (req.file) {
      imageArr = [req.file.filename];
    }

    if (imageArr.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "At least one image is required" });
    }

    const { name, price, stock, category, description, vendor_id, added_by } =
      req.body;
    const productStatus = added_by === "admin" ? "approved" : "pending";

    // Validate category is not empty and is a valid ObjectId
    if (!category) {
      return res
        .status(400)
        .json({ success: false, message: "Category ID is required" });
    }

    // Check if category is a valid MongoDB ObjectId
    if (!mongoose.Types.ObjectId.isValid(category)) {
      return res.status(400).json({
        success: false,
        message: `Invalid category ID: "${category}". Please select a valid category.`,
      });
    }

    // Verify category exists
    const categoryExists = await Category.findById(category);
    if (!categoryExists) {
      return res
        .status(404)
        .json({ success: false, message: "Selected category does not exist" });
    }

    // check if vendor is approved
    if (added_by === "vendor" && vendor_id) {
      const vendor = await Vendor.findById(vendor_id);
      if (!vendor) {
        return res
          .status(404)
          .json({ success: false, message: "Vendor not found" });
      }
      if (vendor.status !== "approved") {
        return res.status(403).json({
          success: false,
          message: `Cannot add products. Your vendor account status is "${vendor.status}". Please wait for admin approval.`,
          vendorStatus: vendor.status,
        });
      }
    }

    const newProduct = await Product.create({
      name,
      price,
      stock,
      categories_id: category,
      description,
      image: imageArr,
      vendor_id: vendor_id || null,
      added_by: added_by || "admin",
      status: productStatus,
    });

    res.status(201).json({
      success: true,
      message:
        added_by === "admin"
          ? "Product added successfully"
          : "Product submitted for approval",
      id: newProduct._id,
    });
  } catch (error) {
    console.error("Add Product Error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to add product",
      error: error.message,
    });
  }
};

const updateProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, price, stock, category, description } = req.body;

    const updateData = {
      name,
      price,
      stock,
      categories_id: category,
      description,
    };

    let imageArr = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imageArr = req.files.map((file) => file.filename);
    } else if (req.file) {
      imageArr = [req.file.filename];
    }

    if (imageArr.length > 0) {
      updateData.image = imageArr;
    }

    const updatedProduct = await Product.findByIdAndUpdate(id, updateData, {
      new: true,
    });

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update Product Error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update product",
      error: error.message,
    });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Product.findByIdAndDelete(id);
    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res.status(400).json({
      success: false,
      message: "Failed to delete product",
      error: error.message,
    });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const product = await Product.findById(id)
      .populate("categories_id")
      .populate("vendor_id", "shop_name");

    if (!product) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    // Flattening for compatibility with frontend if necessary
    const productData = product.toObject();
    if (productData.categories_id) {
      productData.category_name = productData.categories_id.category_name;
      productData.subcategory_name = productData.categories_id.subcategory_name;
    }
    if (productData.vendor_id) {
      productData.vendor_name = productData.vendor_id.shop_name;
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: productData,
    });
  } catch (error) {
    console.error("Database error in getProductById:", error);
    res.status(400).json({
      success: false,
      message: "Failed to get product",
      error: error.message,
    });
  }
};

const updateProductStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!["pending", "approved", "rejected"].includes(status)) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid status value" });
    }

    const updatedProduct = await Product.findByIdAndUpdate(
      id,
      { status },
      { new: true },
    );

    if (!updatedProduct) {
      return res
        .status(404)
        .json({ success: false, message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, message: `Product status updated to ${status}` });
  } catch (error) {
    console.error("Update Product Status Error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update product status",
      error: error.message,
    });
  }
};

module.exports = {
  getProduct,
  addProduct,
  updateProduct,
  deleteProduct,
  getProductById,
  updateProductStatus,
};
