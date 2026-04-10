const mongoose = require("mongoose");

// const connectDb = async () => {
//   try {
//     const uri = process.env.MONGO_URI;

//     if (!uri) {
//       throw new Error("MONGO_URI is not defined in environment variables");
//     }

//     // Mongoose will buffer commands until connected; we prefer to connect at startup.
//     await mongoose.connect(uri, {
//       dbName: process.env.MONGO_DB_NAME || undefined,
//       serverSelectionTimeoutMS: 15000,
//     });

//     console.log("Connected to MongoDB");
//   } catch (error) {
//     console.error("MongoDB connection error:", error?.message || error);
//     process.exit(1);
//   }
// };



const connectDb = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI)
        .then(()=>{
            console.log('MongoDB connected');
        })
        .catch((err)=>{
            console.log(err,"MongoDB connection failed");
        })
    } catch (error) {
        console.log(error);
    }
}

module.exports = { connectDb };

