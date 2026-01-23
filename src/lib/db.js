import mongoose from 'mongoose';

const dbURI = import.meta.env.dbURI || process.env.dbURI;

if (!dbURI) {
    // In development, sometimes env vars aren't loaded immediately, or we might be running a script.
    // But for the app to work, we need it.
    console.error("dbURI is not defined");
}

let cached = global.mongoose;

if (!cached) {
    cached = global.mongoose = { conn: null, promise: null };
}

async function dbConnect() {
    if (cached.conn) {
        return cached.conn;
    }

    if (!cached.promise) {
        const opts = {
            bufferCommands: false,
        };

        cached.promise = mongoose.connect(dbURI, opts).then((mongoose) => {
            console.log('Connected to MongoDB');
            return mongoose;
        });
    }
    try {
        cached.conn = await cached.promise;
    } catch (e) {
        cached.promise = null;
        throw e;
    }

    return cached.conn;
}

export default dbConnect;
