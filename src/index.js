import dotenv from 'dotenv';
dotenv.config({
    path:'./.env'
})
import DBconnect from './db/index.js';
import { app } from './app.js';



DBconnect()
.then(()=>{
    app.listen(process.env.PORT,()=>{
        console.log(`app is listening on port ${process.env.PORT}`);
    })
})
.catch((err)=>{
    console.log("Database connection failed!!!", err);
})














/*
import mongoose from "mongoose";
import { DB_NAME } from "./constants.js";

import express from 'express';
const app = express();

(async()=>{
    try {
        await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log("DB connected successfully");

        app.on('error',(error)=>{
            console.log("Error:",error);
            throw error;
        })

        app.listen(process.env.PORT,()=>{
            console.log(`app is listening on port ${process.env.PORT}`);
        })
    } catch (error) {
        console.error("DB connectiion Error: ",error);
        throw error;
    }
})();
*/