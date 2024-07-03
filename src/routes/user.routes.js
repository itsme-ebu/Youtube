import express from "express";
import upload from "../middlewares/multer.middleware.js";
import {
  channelSubscribe,
  getChannelDetails,
  logingUser,
  logoutUser,
  refreshAccessToken,
  regiesterUser,
} from "../controllers/user.controller.js";
import verifyJwt from "../middlewares/auth.middleware.js";
const router = express.Router();

router.route("/regiester").post(
  upload.fields([
    { name: "profilePic", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  regiesterUser
);

router.route("/login").post(logingUser);
router.route("/logout").post(verifyJwt, logoutUser);
router.route("/refresh").post(refreshAccessToken);
router.route("/subscribe").post(verifyJwt, channelSubscribe);
router.route("/channel").post(verifyJwt, getChannelDetails);

export { router as userRouter };
