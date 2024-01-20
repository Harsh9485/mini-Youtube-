import mongoose from "mongoose";

const connectDB = async () => {
    try {
        const connectionIntance = await mongoose.connect(`${process.env.DB_CANACTION}/youtube`);
        console.log(connectionIntance.connection.host);
    } catch (error) {
        console.error(error);
        process.exit(1);
    }
}

export default connectDB;