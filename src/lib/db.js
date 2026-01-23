import mongoose from 'mongoose';


// const dbURI = import.meta.env.dbURI || process.env.dbURI; // Moved inside function

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    // Resolve URI at runtime (inside function) to ensure env vars are loaded
    const dbURI = import.meta.env.dbURI || process.env.dbURI;

    if (!dbURI) {
        console.error("CRITICAL ERROR: dbURI is not defined in environment variables!");
        throw new Error("dbURI is missing. Please check Cloudflare Pages settings.");
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        console.log("Attempting to connect to MongoDB..."); // Debug log
        cached.promise = mongoose.connect(dbURI, opts).then((mongoose) => {
            console.log('Connected to MongoDB');
            return mongoose;
        }).catch(err => {
            console.error("Mongoose Connection Error:", err);
            throw err;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        console.error("Failed to await DB connection:", e);
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
