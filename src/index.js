// require('dotenv').config({path: './env'})



import connectDB from "./db/index.js";
import dotenv from "dotenv";


import express  from "express";



dotenv.config({path: './env'});

const app = express();

connectDB();





/*
( async () => {
    try {
        await mongoose.connect(`${process.env.DB_CANACTION}/${DB_NAME}`);
        app.on('error', (err) => {throw err}); // not listen express srever 
        app.listen(process.env.PORT, () => {
            console.log("listen on port " + process.env.PORT);
        })
    } catch (error) {
        console.error("ERROR: " + error);
    }
})();
*/
