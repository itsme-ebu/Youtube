import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { apiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from "jsonwebtoken";
import e from "express";
import { Subscription } from "../models/subscription.model.js";

const generateAccessAndRefreshToken = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = await user.generateAccessToken();
    const refreshToken = await user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false });
    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "something went wrong while genrating Access and Refresh Token"
    );
  }
};

const regiesterUser = asyncHandler(async (req, res) => {
  const { fullName, email, username, password } = await req.body;
  if (
    [fullName, email, password, username].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "all fields are require");
  }

  const existedUser = await User.findOne({
    $or: [{ email }, { username }],
  });

  if (existedUser) throw new ApiError(400, "user alredy existes");

  const profilePicLocalPath = await req.files?.profilePic[0]?.path;
  // const coverImageLocalPath = await req.files?.coverImage[0]?.path;
  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = await req.files.coverImage[0].path;
  }

  if (!profilePicLocalPath) throw new ApiError(400, "profile pic is required");

  const profilePic = await uploadOnCloudinary(profilePicLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!profilePic) throw new ApiError(400, "profile pic is required");

  const newUser = await User.create({
    fullName,
    email,
    username,
    password,
    profilePic: profilePic.url,
    coverImage: coverImage?.url || "  ",
  });

  const createdUser = await User.findById(newUser._id).select("-password");

  if (!createdUser)
    throw new ApiError(
      500,
      "something went wrong on server while createing new user"
    );

  res.status(201).json(createdUser);
});

const logingUser = asyncHandler(async (req, res) => {
  try {
    const { username, email, password } = req.body;

    if (!username && !email) {
      throw new ApiError(400, "username or email is required");
    }

    const user = await User.findOne({
      $or: [{ username }, { email }],
    });

    if (!user) throw new ApiError(404, "No user Found");

    const comparedPassword = await user.isPasswordCorrect(password);

    if (!comparedPassword) throw new ApiError(401, "enter a valid password...");

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(
      user._id
    );

    const loggedingUser = await User.findById(user._id).select(
      "-password -refreshToken"
    );

    const options = { httpOnly: true, secure: true };

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new apiResponse(
          200,
          {
            user: loggedingUser,
            accessToken,
            refreshToken,
          },
          "user loggedin successfully"
        )
      );
  } catch (error) {
    throw new ApiError(400, "problem with login");
  }
});

const logoutUser = asyncHandler(async (req, res) => {
  if (!req.user) throw new ApiError(401, "Not authenticated");

  res.clearCookie("accessToken");
  res.clearCookie("refreshToken");

  await User.findByIdAndUpdate(req.user._id, {
    refreshToken: "",
  });

  res.status(200).json({ message: "Logged out successfully" });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) throw new ApiError(401, "unauthorized activity");
  try {
    const decoadedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );
    const user = await User.findById(decoadedToken._id);
    if (!user) throw new ApiError(401, "Invalid token");

    if (incomingRefreshToken !== user.refreshToken)
      throw new ApiError(401, "unauthorized activity");

    const { refreshToken, accessToken } = await generateAccessAndRefreshToken(
      user._id
    );

    return res
      .status(200)
      .cookie("accessToken", accessToken)
      .cookie("refreshToken", refreshToken)
      .json(
        new apiResponse(
          200,
          { data: accessToken, refreshToken },
          "access token refreshed"
        )
      );
  } catch (error) {
    throw new ApiError(500, error?.message || "access token refresh error");
  }
});

const channelSubscribe = asyncHandler(async (req, res) => {
  const { channel } = req.body;
  const subscriber = req.user?._id;
  if (!subscriber || !channel)
    throw new ApiError(401, "all fields are require subscribers & channel");

  const existingSubscription = await Subscription.findOne({
    subscriber,
    channel,
  });
  if (existingSubscription)
    throw new ApiError(401, "you have alredy subscribed the channel");

  const result = await Subscription.create({ subscriber, channel });
  return res
    .status(201)
    .json(new apiResponse(201, result, "successfully subscribed"));
});

const getChannelDetails = asyncHandler(async (req, res) => {
  // const { username } = req.params;
  const { username } = req.body;

  if (!username) throw new ApiError(400, "channel name neaded!");
  try {
    const channel = await User.aggregate([
      {
        $match: { username: username?.toLowerCase() },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "channel",
          as: "subscribers",
        },
      },
      {
        $lookup: {
          from: "subscriptions",
          localField: "_id",
          foreignField: "subscriber",
          as: "subscribeTo",
        },
      },
      {
        $addFields: {
          subscriberCount: {
            $size: "$subscribers",
          },
          subscribeToCount: {
            $size: "$subscribeTo",
          },
          isSubscribed: {
            $cond: {
              if: { $in: [req.user?._id, "$subscribers.subscriber"] },
              then: true,
              else: false,
            },
          },
        },
      },
      {
        $project: {
          fullName: 1,
          username: 1,
          email: 1,
          subscriberCount: 1,
          subscribeToCount: 1,
          isSubscribed: 1,
          profilePic: 1,
          coverImage: 1,
        },
      },
    ]);

    if (!channel?.length) throw new ApiError(404, "channel does not exists");

    return res.status(200).json(new apiResponse(200, channel));
  } catch (error) {
    throw new ApiError(500, error.message || "failed to get channel details");
  }
});

export {
  regiesterUser,
  logingUser,
  logoutUser,
  refreshAccessToken,
  channelSubscribe,
  getChannelDetails,
};
