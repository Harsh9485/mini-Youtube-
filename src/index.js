// require('dotenv').config({path: './env'})

import { app } from "./app.js";
import connectDB from "./db/index.js";
import dotenv from "dotenv";

dotenv.config({ path: "./env" });

connectDB()
  .then(() => {
    app.on("error", (err) => {
      console.log(`server connection error: ${err}`);
    });
    app.listen(process.env.PORT || 3000, () => {
      console.log(`Connect to server on port ${process.env.PORT}`);
    });
  })
  .catch((error) => {
    console.log("MongoDB connection error: " + error);
  });

// This way to connect MongoDB and listen for POST only using index.js file

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
