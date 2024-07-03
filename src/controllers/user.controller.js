import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { apiResponse } from "../utils/ApiResponse.js";
import User from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const GenerateAccessAndRefreshToken = async (userId) => {
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
  console.log(email, password, username);
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
  const { username, email, password } = req.body;

  if (!(username || email)) {
    console.log(email, username);
    throw new ApiError(400, "username or email is required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) throw new ApiError(404, "No user Found");

  const comparedPassword = await user.isPasswordCorrect(password);

  if (!comparedPassword) throw new ApiError(401, "enter a valid password...");

  const { accessToken, refreshToken } = await GenerateAccessAndRefreshToken(
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
});

export { regiesterUser, logingUser };
