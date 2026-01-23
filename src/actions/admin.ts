import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import dbConnect from '../lib/db';
import Admin from '../models/adminModel';
import Product from '../models/productModel';
import User from '../models/userModel';
import bcrypt from 'bcryptjs';
// import fs from 'node:fs/promises'; // Removed static import
// import path from 'node:path';      // Removed static import

// Helper to save file (Note: This only works in Node/Local env, not Edge/Workers without R2/S3)
async function saveFile(file: File, filename: string) {
    if (import.meta.env.PROD) {
        // In Cloudflare/Prod, filesystem writing is not possible.
        // We'd need R2 or similar. For now, logging warning.
        console.warn("Skipping file save in production (readonly fs).");
        return;
    }

    try {
        const fs = (await import('node:fs/promises')).default;
        const path = (await import('node:path')).default;

        const publicDir = path.resolve('./public/images');
        // Ensure dir exists
        try {
            await fs.access(publicDir);
        } catch {
            await fs.mkdir(publicDir, { recursive: true });
        }

        const buffer = Buffer.from(await file.arrayBuffer());
        await fs.writeFile(path.join(publicDir, filename), buffer);
    } catch (e) {
        console.error("Dynamic import or save error:", e);
    }
}

export const server = {
    login: defineAction({
        accept: 'form',
        input: z.object({
            username: z.string(),
            password: z.string(),
        }),
        handler: async ({ username, password }, context) => {
            await dbConnect();
            const admin = await Admin.findOne({ username });
            if (!admin) return { success: false, error: "Incorrect username" };

            const isMatch = await bcrypt.compare(password, admin.password);
            if (!isMatch) return { success: false, error: "Incorrect password" };

            context.cookies.set('adminId', admin.username, {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                maxAge: 60 * 60 * 24
            });
            return { success: true };
        }
    }),
    logout: defineAction({
        accept: 'form',
        handler: async (_, context) => {
            context.cookies.delete('adminId', { path: '/' });
            return { success: true };
        }
    }),
    addProduct: defineAction({
        accept: 'form',
        input: z.object({
            productName: z.string(),
            description: z.string(),
            price: z.number(),
            stock: z.number(),
            category: z.string(),
            offer: z.string().optional(),
            // Validate files
            image1: z.any(),
            image2: z.any(),
            image3: z.any(),
        }),
        handler: async (input, context) => {
            await dbConnect();
            const adminCookie = context.cookies.get('adminId');
            if (!adminCookie) return { success: false, error: "Unauthorized" };

            if (!(input.image1 instanceof File) || !(input.image2 instanceof File) || !(input.image3 instanceof File)) {
                return { success: false, error: "Images are required" };
            }

            const existing = await Product.findOne({ productName: input.productName });
            if (existing) {
                return { success: false, error: "Product already exists" };
            }

            const product = new Product({
                productName: input.productName,
                description: input.description,
                price: input.price,
                stock: input.stock,
                category: input.category,
                offer: input.offer || "",
                sales: 0 // Initialize sales
            });

            const savedProduct = await product.save();

            try {
                await saveFile(input.image1, `image1${savedProduct._id}.jpg`);
                await saveFile(input.image2, `image2${savedProduct._id}.jpg`);
                await saveFile(input.image3, `image3${savedProduct._id}.jpg`);
            } catch (e) {
                console.error("File save error:", e);
                return { success: false, error: "Error saving images" };
            }

            return { success: true };
        }
    }),
    editProduct: defineAction({
        accept: 'form',
        input: z.object({
            id: z.string(),
            productName: z.string().optional(),
            description: z.string().optional(),
            price: z.number().optional(),
            stock: z.number().optional(),
            category: z.string().optional(),
            offer: z.string().optional(),
            image1: z.any().optional(),
            image2: z.any().optional(),
            image3: z.any().optional(),
        }),
        handler: async (input, context) => {
            await dbConnect();
            const adminCookie = context.cookies.get('adminId');
            if (!adminCookie) return { success: false, error: "Unauthorized" };

            const product = await Product.findById(input.id);
            if (!product) return { success: false, error: "Product not found" };

            if (input.productName) product.productName = input.productName;
            if (input.description) product.description = input.description;
            if (input.price) product.price = input.price;
            if (input.stock !== undefined) product.stock = input.stock;
            if (input.category) product.category = input.category;
            if (input.offer) product.offer = input.offer;

            await product.save();

            try {
                if (input.image1 instanceof File && input.image1.size > 0) await saveFile(input.image1, `image1${product._id}.jpg`);
                if (input.image2 instanceof File && input.image2.size > 0) await saveFile(input.image2, `image2${product._id}.jpg`);
                if (input.image3 instanceof File && input.image3.size > 0) await saveFile(input.image3, `image3${product._id}.jpg`);
            } catch (e) {
                console.error("Image upload error in edit", e);
            }

            try {
                if (input.description) {
                    await User.updateMany({ "cart._id": input.id }, { $set: { "cart.$.description": input.description } });
                    await User.updateMany({ "wishlist._id": input.id }, { $set: { "wishlist.$.description": input.description } });
                }
                if (input.price) {
                    await User.updateMany({ "cart._id": input.id }, { $set: { "cart.$.price": input.price } });
                    await User.updateMany({ "wishlist._id": input.id }, { $set: { "wishlist.$.price": input.price } });
                }
            } catch (e) {
                console.error("Sync error", e);
            }

            return { success: true };
        }
    }),
    deleteProduct: defineAction({
        accept: 'form',
        input: z.object({
            id: z.string()
        }),
        handler: async ({ id }, context) => {
            await dbConnect();
            const adminCookie = context.cookies.get('adminId');
            if (!adminCookie) return { success: false, error: "Unauthorized" };

            await Product.findByIdAndDelete(id);

            try {
                if (!import.meta.env.PROD) {
                    const fs = (await import('node:fs/promises')).default;
                    const path = (await import('node:path')).default;
                    const publicDir = path.resolve('./public/images');
                    await fs.unlink(path.join(publicDir, `image1${id}.jpg`)).catch(() => { });
                    await fs.unlink(path.join(publicDir, `image2${id}.jpg`)).catch(() => { });
                    await fs.unlink(path.join(publicDir, `image3${id}.jpg`)).catch(() => { });
                }
            } catch (e) {
                console.error("File delete error:", e);
            }

            return { success: true };
        }
    }),
    addCategory: defineAction({
        accept: 'form',
        input: z.object({
            category: z.string()
        }),
        handler: async ({ category }, context) => {
            await dbConnect();
            const adminCookie = context.cookies.get('adminId');
            if (!adminCookie) return { success: false, error: "Unauthorized" };

            const upperCategory = category.toUpperCase();
            const existing = await import('../models/categoryModel').then(m => m.default.findOne({ categoryName: upperCategory }));

            if (existing) {
                return { success: false, error: "Category already exists" };
            }

            const CategoryModel = await import('../models/categoryModel').then(m => m.default);
            const newCategory = new CategoryModel({
                categoryName: upperCategory
            });
            await newCategory.save();

            return { success: true };
        }
    }),
    deleteCategory: defineAction({
        accept: 'form',
        input: z.object({
            categoryName: z.string()
        }),
        handler: async ({ categoryName }, context) => {
            await dbConnect();
            const adminCookie = context.cookies.get('adminId');
            if (!adminCookie) return { success: false, error: "Unauthorized" };

            const product = await Product.findOne({ category: categoryName });
            if (product) {
                return { success: false, error: "Cannot delete: Products exist in this category" };
            }

            const CategoryModel = await import('../models/categoryModel').then(m => m.default);
            await CategoryModel.deleteOne({ categoryName: categoryName });

            return { success: true };
        }
    })
};
