import User from "../models/user.model";
import { ApiError } from "../utils/ApiError";
import { asyncHandler } from "../utils/asyncHandler";
import jwt from "jsonwebtoken";
const verifyJWT = asyncHandler(async (req, res, next) => {
  const token =
    req.cookies?.accessToken ||
    req.header("Authorization")?.replace("Bearer ", "");

  if (!token) {
    throw new ApiError(401, "unauthorized request");
  }

  const decodedToken = jwt.verify(token, process.env.SECRET_KEY);

  const user = await User.findById(decodedToken?._id).select("-password");
  if (!user) throw new ApiError(401, "Invalid access token");
  req.user = user;
  next();
});

export default verifyJWT;
