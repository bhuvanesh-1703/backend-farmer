const db = require("../DB_connection/db");

const getProduct = async (req, res) => {
  try {
    const { status, vendorId } = req.query;
    
    let query = "SELECT products.*, categories.category_name, categories.subcategory_name FROM products INNER JOIN categories ON products.categories_id = categories.id";
    let params = [];

    if (status || vendorId) {
      query += " WHERE";
      const conditions = [];
      if (status) {
        conditions.push(" products.status = ?");
        params.push(status);
      }
      if (vendorId) {
        conditions.push(" products.vendor_id = ?");
        params.push(vendorId);
      }
      query += conditions.join(" AND");
    }

    // Add sorting to show newest products first
    query += " ORDER BY products.created_at DESC";

    const [product] = await db.query(query, params);

    res.status(200).json({
      success: true,
      message: "Products fetched successfully",
      product,
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
        return res.status(400).json({ success: false, message: "At least one image is required" });
    }

    const { name, price, stock, category, description, vendor_id, added_by } = req.body;
    const image = imageArr.join(",");
    const productStatus = added_by === 'admin' ? 'approved' : 'pending';

    const [result] = await db.query(
      "INSERT INTO products (name, price, stock, categories_id, description, image, vendor_id, added_by, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [name, price, stock, category, description, image, vendor_id || null, added_by || 'admin', productStatus],
    );
    res
      .status(201)
      .json({
        success: true,
        message: added_by === 'admin' ? "Product added successfully" : "Product submitted for approval",
        id: result.insertId,
      });
  } catch (error) {
    console.error("Add Product Error:", error);
    res
      .status(400)
      .json({
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

    let query =
      "UPDATE products SET name=?, price=?, stock=?, categories_id=?, description=?";
    let params = [name, price, stock, category, description];

   
    let imageArr = [];
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      imageArr = req.files.map((file) => file.filename);
    } else if (req.file) {
      imageArr = [req.file.filename];
    }

    if (imageArr.length > 0) {
      query += ", image=?";
      params.push(imageArr.join(","));
    }

    query += " WHERE id=?";
    params.push(id);

    const [result] = await db.query(query, params);

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res
      .status(200)
      .json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update Product Error:", error);
    res
      .status(400)
      .json({
        success: false,
        message: "Failed to update product",
        error: error.message,
      });
  }
};

const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    await db.query("DELETE FROM products WHERE id=?", [id]);
    res
      .status(200)
      .json({ success: true, message: "Product deleted successfully" });
  } catch (error) {
    res
      .status(400)
      .json({
        success: false,
        message: "Failed to delete product",
        error: error.message,
      });
  }
};

const getProductById = async (req, res) => {
  try {
    const { id } = req.params;
    const [product] = await db.query(
      "SELECT products.*, categories.category_name, categories.subcategory_name, vendors.shop_name as vendor_name FROM products INNER JOIN categories ON products.categories_id = categories.id LEFT JOIN vendors ON products.vendor_id = vendors.id WHERE products.id = ?",
      [id],
    );

    if (product.length === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({
      success: true,
      message: "Product fetched successfully",
      product: product[0],
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
      return res.status(400).json({ success: false, message: "Invalid status value" });
    }

    const [result] = await db.query(
      "UPDATE products SET status=? WHERE id=?",
      [status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    res.status(200).json({ success: true, message: `Product status updated to ${status}` });
  } catch (error) {
    console.error("Update Product Status Error:", error);
    res.status(400).json({
      success: false,
      message: "Failed to update product status",
      error: error.message,
    });
  }
};

module.exports = { getProduct, addProduct, updateProduct, deleteProduct, getProductById, updateProductStatus };
