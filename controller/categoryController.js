const db=require('../DB_connection/db');

const getCategory=async (req,res)=>{
    try {
        const [categories]=await db.query("SELECT * FROM categories")
        res.status(200).json({success:true,message:"category fetched successfully",categories})

    } catch (error) {
        res.status(400).json({success:false,message:"category failed to fetch"})
    }
}

// productController.js



const getProductsByCategory = async (req, res) => {
  try {
    const { id } = req.params;

    const [products] = await db.query(
      "SELECT * FROM product WHERE categories_id = ?",
      [id]
    );

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

    const [result] = await db.query(
      "INSERT INTO categories (category_name, subcategory_name, description, image) VALUES (?, ?, ?, ?)",
      [category_name, subcategory_name, description, image]
    );
    res.status(201).json({ success: true, message: "Category added successfully", id: result.insertId });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to add category", error: error.message });
  }
};

const updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { category_name, subcategory_name, description } = req.body;

    let query = "UPDATE categories SET category_name=?, subcategory_name=?, description=?";
    let params = [category_name, subcategory_name, description];

    if (req.file) {
      query += ", image=?";
      params.push(req.file.filename);
    }

    query += " WHERE id=?";
    params.push(id);

    await db.query(query, params);
    res.status(200).json({ success: true, message: "Category updated successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to update category", error: error.message });
  }
};

const deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM categories WHERE id=?", [id]);
    res.status(200).json({ success: true, message: "Category deleted successfully" });
  } catch (error) {
    res.status(400).json({ success: false, message: "Failed to delete category", error: error.message });
  }
};

module.exports = { getCategory, addCategory, updateCategory, deleteCategory,getProductsByCategory };
