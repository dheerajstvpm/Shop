/// <reference path="../.astro/types.d.ts" />
/// <reference types="astro/client" />

declare namespace App {
    interface Locals {
        user?: {
            _id: string;
            name: string;
            username: string;
            cart: any[];
            wishlist: any[];
            // Add other fields as needed
        };
        admin?: {
            username: string;
        };
    }
}

declare module 'bcryptjs';
declare module '@paypal/checkout-server-sdk';

