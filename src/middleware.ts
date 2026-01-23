import { defineMiddleware } from 'astro:middleware';
import dbConnect from './lib/db';
import User from './models/userModel';

export const onRequest = defineMiddleware(async (context, next) => {
    // Only run DB connection on data requests
    await dbConnect();

    const uidCookie = context.cookies.get('uid');
    if (uidCookie && uidCookie.value) {
        try {
            const user = await User.findById(uidCookie.value).lean();
            if (user) {
                context.locals.user = user;
            }
        } catch (e) {
            console.error("Auth Middleware Error:", e);
        }
    }

    const adminCookie = context.cookies.get('adminId');
    if (adminCookie && adminCookie.value) {
        context.locals.admin = { username: adminCookie.value };
    }

    const response = await next();

    // Prevent caching of protected/sensitive pages to avoid "back button" after logout issue
    response.headers.set('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
    response.headers.set('Pragma', 'no-cache');
    response.headers.set('Expires', '0');
    response.headers.set('Surrogate-Control', 'no-store');

    return response;
});
