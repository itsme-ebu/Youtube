import express from "express";
import upload from "../middlewares/multer.middleware.js";
const router = express.Router();

router.get("/", (req, res) => {
  return res.json({
    msg: "helew",
  });
});

export { router as userRouter };
