import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";

const DBconnect = async()=>{
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        // console.log(connectionInstance);
        console.log(`DB connected successfully at host: ${connectionInstance.connection.host}`);
    } catch (error) {
        console.log("DB connection error: ",error);
        process.exit(1);
    }
}

export default DBconnect;