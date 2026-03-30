const Category = require("../models/Category");
const Product = require("../models/Product");

const getCategory = async (req, res) => {
  try {
    const categories = await Category.find();
    res.status(200).json({ success: true, message: "category fetched successfully", categories });
  } catch (error) {
    res.status(400).json({ success: false, message: "category failed to fetch" });
  }
};

const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const products = await Product.find({ categories_id: id });
    res.status(200).json({
      success: true,
      products,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Failed to fetch products by category",
      error: error.message,
    });
  }
};

const addCategory = async (req, res) => {
  try {
    const { category_name, subcategory_name, description } = req.body;
    const image = req.file ? req.file.filename : null;

    const newCategory = await Category.create({
      category_name,
      subcategory_name,
      description,
      image
    });
    res.status(201).json({ success: true, message: "Category added successfully", id: newCategory._id });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to add category", error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, subcategory_name, description } = req.body;

    const updateData = { category_name, subcategory_name, description };

    if (req.file) {
      updateData.image = req.file.filename;
    }

    const updatedCategory = await Category.findByIdAndUpdate(id, updateData, { new: true });
    
    if (!updatedCategory) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to update category", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const result = await Category.findByIdAndDelete(id);
    
    if (!result) {
      return res.status(404).json({ success: false, message: "Category not found" });
    }

    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to delete category", error: error.message });
  }
};

module.exports = { getCategory, addCategory, updateCategory, deleteCategory, getProductsByCategory };
