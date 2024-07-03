import express from "express";
import upload from "../middlewares/multer.middleware.js";
import { logingUser, regiesterUser } from "../controllers/user.controller.js";
const router = express.Router();

router.route("/regiester").post(
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  regiesterUser
);

router.route("/login").post(logingUser);

export { router as userRouter };
