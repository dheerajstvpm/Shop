import { defineAction } from 'astro:actions';
import { z } from 'astro:schema';
import dbConnect from '../lib/db';
import User from '../models/userModel';
import Product from '../models/productModel';
import bcrypt from 'bcryptjs';
import { server as adminActions } from './admin';
import { server as checkoutActions } from './checkout';

export const server = {
    signup: defineAction({
        accept: 'form',
        input: z.object({
            name: z.string(),
            username: z.string().email(),
            password: z.string().min(6), // Relaxed constraints for migration
            mobile: z.string().length(10), // Assuming India/10 digits
        }),
        handler: async (input, context) => {
            await dbConnect();
            // Check existence
            const existingUser = await User.findOne({
                $or: [{ username: input.username }, { mobile: input.mobile }]
            });

            if (existingUser) {
                if (existingUser.username === input.username) return { success: false, error: "Username already exists" };
                if (existingUser.mobile === input.mobile) return { success: false, error: "Mobile already exists" };
            }

            const hashedPassword = await bcrypt.hash(input.password, 10);

            const newUser = new User({
                name: input.name,
                username: input.username,
                password: hashedPassword,
                mobile: input.mobile,
                status: "active" // Default status
            });

            await newUser.save();

            // Auto login? Or redirect to login
            return { success: true };
        }
    }),
    login: defineAction({
        accept: 'form',
        input: z.object({
            username: z.string(),
            password: z.string(),
        }),
        handler: async ({ username, password }, context) => {
            await dbConnect();
            const user = await User.findOne({ username });

            if (!user) {
                return { success: false, error: "User not found" };
            }
            if (user.status === 'blocked') {
                return { success: false, error: "User is blocked" };
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) {
                return { success: false, error: "Incorrect password" };
            }

            // Set session cookie
            context.cookies.set('uid', user._id.toString(), {
                path: '/',
                httpOnly: true,
                secure: import.meta.env.PROD,
                maxAge: 60 * 60 * 24 * 7 // 7 days
            });

            return { success: true };
        }
    }),
    logout: defineAction({
        accept: 'form',
        handler: async (_, context) => {
            context.cookies.delete('uid', { path: '/' });
            return { success: true };
        }
    }),
    addToCart: defineAction({
        accept: 'form',
        input: z.object({
            productId: z.string()
        }),
        handler: async ({ productId }, context) => {
            await dbConnect();
            const uidCookie = context.cookies.get('uid');
            if (!uidCookie) return { success: false, error: "Unauthorized" };

            const product = await Product.findById(productId);
            if (!product) return { success: false, error: "Product not found" };

            const user = await User.findById(uidCookie.value);
            if (!user) return { success: false, error: "User not found" };

            // Check if item in cart (Legacy logic was simplistic)
            // User schema has cart array
            const existingItem = user.cart.find((item: any) => item._id.toString() === productId);

            if (existingItem) {
                existingItem.count += 1;
            } else {
                // Add new item
                // Use Schema defaults? We need to copy product details as per legacy embedded schema
                user.cart.push({
                    _id: product._id, // Important to keep same ID
                    productName: product.productName,
                    description: product.description,
                    price: product.price,
                    stock: product.stock,
                    // image: product.image, // Legacy didn't have image field on Product? It used file system.
                    category: product.category,
                    offer: product.offer,
                    count: 1
                });
            }

            await user.save();
            return { success: true };
        }
    }),
    removeFromCart: defineAction({
        accept: 'form',
        input: z.object({
            productId: z.string()
        }),
        handler: async ({ productId }, context) => {
            await dbConnect();
            const uidCookie = context.cookies.get('uid');
            if (!uidCookie) return { success: false, error: "Unauthorized" };

            await User.findByIdAndUpdate(uidCookie.value, {
                $pull: { cart: { _id: productId } }
            });

            return { success: true };
        }
    }),
    addToWishlist: defineAction({
        accept: 'form',
        input: z.object({
            productId: z.string()
        }),
        handler: async ({ productId }, context) => {
            await dbConnect();
            const uidCookie = context.cookies.get('uid');
            if (!uidCookie) return { success: false, error: "Unauthorized" };

            const product = await Product.findById(productId);
            if (!product) return { success: false, error: "Product not found" };

            const user = await User.findById(uidCookie.value);
            // Check existence
            const exists = user.wishlist.find((item: any) => item._id.toString() === productId);
            if (exists) {
                return { success: false, error: "Item already in wishlist" };
            }

            user.wishlist.push({
                _id: product._id,
                productName: product.productName,
                description: product.description,
                price: product.price,
                stock: product.stock,
                category: product.category,
                offer: product.offer,
                image: `image1${product._id}.jpg` // Logic from admin addProduct
            });
            await user.save();
            return { success: true };
        }
    }),
    removeFromWishlist: defineAction({
        accept: 'form',
        input: z.object({
            productId: z.string()
        }),
        handler: async ({ productId }, context) => {
            await dbConnect();
            const uidCookie = context.cookies.get('uid');
            if (!uidCookie) return { success: false, error: "Unauthorized" };

            await User.findByIdAndUpdate(uidCookie.value, {
                $pull: { wishlist: { _id: productId } }
            });
            return { success: true };
        }
    }),
    updateCartQuantity: defineAction({
        accept: 'form',
        input: z.object({
            productId: z.string(),
            action: z.enum(['increment', 'decrement'])
        }),
        handler: async ({ productId, action }, context) => {
            await dbConnect();
            const uidCookie = context.cookies.get('uid');
            if (!uidCookie) return { success: false, error: "Unauthorized" };

            const user = await User.findById(uidCookie.value);
            const item = user.cart.find((i: any) => i._id.toString() === productId);

            if (item) {
                if (action === 'increment') {
                    // Check stock?
                    item.count += 1;
                } else if (action === 'decrement') {
                    if (item.count > 1) {
                        item.count -= 1;
                    }
                }
                await user.save();
            }

            return { success: true };
        }
    }),
    updateProfile: defineAction({
        accept: 'form',
        input: z.object({
            name: z.string().optional(),
            mobile: z.string().optional(),
        }),
        handler: async ({ name, mobile }, context) => {
            await dbConnect();
            const uidCookie = context.cookies.get('uid');
            if (!uidCookie) return { success: false, error: "Unauthorized" };

            const updateData: any = {};
            if (name) updateData.name = name;
            if (mobile) {
                updateData.mobile = mobile;
            }

            await User.findByIdAndUpdate(uidCookie.value, updateData);
            return { success: true };
        }
    }),
    manageAddress: defineAction({
        accept: 'form',
        input: z.object({
            action: z.enum(['add', 'delete']),
            address: z.string()
        }),
        handler: async ({ action, address }, context) => {
            await dbConnect();
            const uidCookie = context.cookies.get('uid');
            if (!uidCookie) return { success: false, error: "Unauthorized" };

            if (action === 'add') {
                // Prevent duplicates
                await User.findByIdAndUpdate(uidCookie.value, { $addToSet: { address: address } });
            } else if (action === 'delete') {
                await User.findByIdAndUpdate(uidCookie.value, { $pull: { address: address } });
            }

            return { success: true };
        }
    }),
    admin: adminActions,
    checkout: checkoutActions
};
