import cloudinary from "../utils/cloudinary.utils.js";
import uploadToCloudinary from "../utils/uploadToCloudinary.utils.js";
import { db } from "../db/connectToDB.js";

//get all products
export async function getProducts(req, res) {
  try {
    // get all products with their category name
    const [products] = await db.execute(
      `SELECT p.*, c.name AS category_name
             FROM products p
             JOIN categories c ON c.id = p.category_id`
    );

    // get all images
    const [images] = await db.execute(
      "SELECT id, product_id, image_url, is_primary FROM product_images"
    );

    // put each product's images inside the product
    const result = products.map((product) => ({
      ...product,
      images: images.filter((img) => img.product_id === product.id),
    }));

    return res.status(200).json({ products: result });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

//get product by id
export async function getProductById(req, res) {
  try {
    const { id } = req.params;

    const [productRows] = await db.execute(
      `SELECT p.*, c.name AS category_name
       FROM products p
       JOIN categories c ON c.id = p.category_id
       WHERE p.id = ?`,
      [id]
    );

    const selectedProduct = productRows[0];
    if (!selectedProduct) {
      return res.status(404).json({ message: "Product not found" });
    }

    const [imageRows] = await db.execute(
      "SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?",
      [id]
    );

    const product = { ...selectedProduct, images: imageRows };

    return res.status(200).json({ product });
  } catch (error) {
    return res.status(500).json({ message: error.message });
  }
}

//Create Product by Admin
export async function createProduct(req, res) {
  let uploadedImages = [];

  try {
    const {
      category_id,
      name,
      description,
      price,
      stock_quantity,
      gender,
      color,
      style,
      primary_image_index,
    } = req.body;

    const files = req.files || [];

    if (!category_id || !name || !price) {
      return res
        .status(400)
        .json({ message: "category_id, name and price are required" });
    }

    if (Number(price) <= 0) {
      return res.status(400).json({ message: "Price must be greater than 0" });
    }

    if (gender && !["men", "women", "unisex"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    if (files.length === 0) {
      return res
        .status(400)
        .json({ message: "At least one image is required" });
    }

    const [category] = await db.execute(
      "SELECT id FROM categories WHERE id = ?",
      [category_id]
    );

    if (category.length === 0) {
      return res.status(400).json({ message: "Category does not exist" });
    }

    const primaryIndex = Number(primary_image_index) || 0;

    if (
      !Number.isInteger(primaryIndex) ||
      primaryIndex < 0 ||
      primaryIndex >= files.length
    ) {
      return res.status(400).json({ message: "Invalid primary image index" });
    }

    uploadedImages = await Promise.all(
      files.map((file) => uploadToCloudinary(file.buffer))
    );

    await db.beginTransaction();

    const [result] = await db.execute(
      `INSERT INTO products
       (category_id, name, description, price, stock_quantity, gender, color, style)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        category_id,
        name.trim(),
        description || null,
        price,
        stock_quantity || 0,
        gender || "unisex",
        color || null,
        style || null,
      ]
    );

    const productId = result.insertId;

    for (let i = 0; i < uploadedImages.length; i++) {
      await db.execute(
        "INSERT INTO product_images (product_id, image_url, public_id, is_primary) VALUES (?, ?, ?, ?)",
        [
          productId,
          uploadedImages[i].secure_url,
          uploadedImages[i].public_id,
          i === primaryIndex,
        ]
      );
    }

    await db.commit();

    let product = null;

    try {
      const [productRows] = await db.execute(
        `SELECT p.*, c.name AS category_name
         FROM products p
         JOIN categories c ON c.id = p.category_id
         WHERE p.id = ?`,
        [productId]
      );

      const [imageRows] = await db.execute(
        "SELECT id, image_url, is_primary FROM product_images WHERE product_id = ?",
        [productId]
      );

      product = { ...productRows[0], images: imageRows };
    } catch (err) {
      product = null;
    }

    return res.status(201).json({
      message: "Product created successfully",
      product_id: productId,
      product,
    });
  } catch (error) {
    await db.rollback();

    await Promise.all(
      uploadedImages.map((img) =>
        cloudinary.uploader.destroy(img.public_id).catch(() => {})
      )
    );

    return res.status(500).json({ message: error.message });
  }
}

// Update product by Admin
export async function updateProduct(req, res) {
  const uploadedImages = [];
  let transactionStarted = false;

  try {
    const { id } = req.params;

    const {
      category_id,
      name,
      description,
      price,
      stock_quantity,
      gender,
      color,
      style,
      primary_image_index,
    } = req.body;

    const files = req.files || [];

    const [rows] = await db.execute("SELECT id FROM products WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    if (!category_id || !name || !price || Number(price) <= 0) {
      return res.status(400).json({ message: "Invalid product details" });
    }

    const [category] = await db.execute(
      "SELECT id FROM categories WHERE id = ?",
      [category_id]
    );

    if (category.length === 0) {
      return res.status(400).json({ message: "Category does not exist" });
    }

    if (gender && !["men", "women", "unisex"].includes(gender)) {
      return res.status(400).json({ message: "Invalid gender" });
    }

    let newImages = [];
    let oldImages = [];

    if (files.length > 0) {
      const primaryIndex = Number(primary_image_index) || 0;

      if (
        !Number.isInteger(primaryIndex) ||
        primaryIndex < 0 ||
        primaryIndex >= files.length
      ) {
        return res.status(400).json({ message: "Invalid primary image index" });
      }

      const [imageRows] = await db.execute(
        "SELECT public_id FROM product_images WHERE product_id = ?",
        [id]
      );

      oldImages = imageRows;

      for (const file of files) {
        const result = await uploadToCloudinary(file.buffer);
        newImages.push(result);
        uploadedImages.push(result.public_id);
      }
    }

    await db.beginTransaction();
    transactionStarted = true;

    await db.execute(
      `UPDATE products
       SET category_id = ?, name = ?, description = ?, price = ?,
           stock_quantity = ?, gender = ?, color = ?, style = ?,
           embedding_synced = FALSE
       WHERE id = ?`,
      [
        category_id,
        name.trim(),
        description || null,
        price,
        stock_quantity || 0,
        gender || "unisex",
        color || null,
        style || null,
        id,
      ]
    );

    if (files.length > 0) {
      await db.execute("DELETE FROM product_images WHERE product_id = ?", [id]);

      const primaryIndex = Number(primary_image_index) || 0;

      for (let i = 0; i < newImages.length; i++) {
        await db.execute(
          `INSERT INTO product_images
           (product_id, image_url, public_id, is_primary)
           VALUES (?, ?, ?, ?)`,
          [
            id,
            newImages[i].secure_url,
            newImages[i].public_id,
            i === primaryIndex,
          ]
        );
      }
    }

    await db.commit();
    transactionStarted = false;

    for (const img of oldImages) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id).catch(() => {});
      }
    }

    return res.status(200).json({
      message: "Product updated successfully",
    });
  } catch (error) {
    if (transactionStarted) {
      await db.rollback();
    }

    for (const publicId of uploadedImages) {
      await cloudinary.uploader.destroy(publicId).catch(() => {});
    }

    return res.status(500).json({ message: error.message });
  }
}

// Delete product by Admin
export async function deleteProduct(req, res) {
  let transactionStarted = false;

  try {
    const { id } = req.params;

    // 1. Check the product exists
    const [rows] = await db.execute("SELECT id FROM products WHERE id = ?", [
      id,
    ]);

    if (rows.length === 0) {
      return res.status(404).json({ message: "Product not found" });
    }

    // 2. Get the product's images
    const [images] = await db.execute(
      "SELECT public_id FROM product_images WHERE product_id = ?",
      [id]
    );

    // 3. Delete from the database
    await db.beginTransaction();
    transactionStarted = true;

    await db.execute("DELETE FROM product_images WHERE product_id = ?", [id]);

    await db.execute("DELETE FROM products WHERE id = ?", [id]);

    await db.commit();
    transactionStarted = false;

    // 4. Delete images from Cloudinary
    for (const img of images) {
      if (img.public_id) {
        await cloudinary.uploader.destroy(img.public_id).catch(() => {});
      }
    }

    return res.status(200).json({
      message: "Product deleted successfully",
    });
  } catch (error) {
    if (transactionStarted) {
      await db.rollback();
    }

    // Product is used in orders
    if (error.code === "ER_ROW_IS_REFERENCED_2") {
      return res.status(409).json({
        message: "Product cannot be deleted because it is used in orders",
      });
    }

    return res.status(500).json({
      message: "Failed to delete product",
    });
  }
}
