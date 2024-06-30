import dotenv from "dotenv";
import connectDB from "./db/connection.js";
import { app } from "./app.js";
dotenv.config({
  path: "./env",
});
connectDB()
  .then(() => {
    app.listen(process.env.PORT || 8000, (err) => {
      console.log(
        `DB_Connected and server running on port: ${process.env.PORT}`
      );
    });
  })
  .catch((err) => console.log("unable to connect mongodb...", err));
