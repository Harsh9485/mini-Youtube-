import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";

const generateAccessAndRefereshToken = async (user) => {
  try {
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();
    user.refreshToken = refreshToken;
    await user.save({ validateBeforeSave: false }); // add a refresh token in user model
    /* `user.save({ validateBeforeSave: false })` is saving the user object to the database without
    performing any validation checks. By passing `{ validateBeforeSave: false }` as an option to the
    `save()` method, it bypasses any validation rules defined in the user model and directly saves
    the user object to the database. This can be useful in certain scenarios where you want to skip
    validation, such as when updating a user's refresh token. */

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(500, error.message);
  }
};

const options = {
  // options object for cookie security because cookies modify in the frontend
  httpOnly: true,
  secure: true,
};

const registerUser = asyncHandler(async (req, res) => {
  // get user information from frontend

  const { userName, email, fullName, password } = req.body;

  // validation - not empty

  if (!userName && !email && !fullName && !password) {
    throw new ApiError(400, "Please enter all required fields");
  }
  // check if user already exists: serche username and email

  const existingUser = await User.findOne({
    $or: [{ userName }, { email }],
  });
  if (existingUser) {
    throw new ApiError(409, "This user name already exists");
  }

  // check for image, check for avatar

  const avatarLocalPath = req.files?.avatar[0]?.path;
  const coverImageLocalPath = req.files?.coverImage[0]?.path;

  if (!avatarLocalPath) {
    throw new ApiError(400, "Please upload your avatar");
  }

  // upload them to cloudinary, avatar

  const avatar = await uploadOnCloudinary(avatarLocalPath);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(400, "Please upload your avatar");
  }

  // create user object - create user enter in db

  const user = await User.create({
    fullName,
    avatar: avatar.url,
    coverImage: coverImage?.url || "",
    email,
    userName: userName.toLowerCase(),
    password,
  });

  // remove password and refresh token field form response

  const userSuccessFullCreated = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // check for user creation

  if (!userSuccessFullCreated) {
    throw new ApiError(500, "Account not created please try again");
  }

  // return res
  return res
    .status(201)
    .json(
      new ApiResponse(
        200,
        userSuccessFullCreated,
        "account created successfully"
      )
    );
});

const loginUser = asyncHandler(async (req, res) => {
  // get user information like {email, userName} and password

  const { email, userName, password } = req.body;
  if (!email && !userName) {
    throw new ApiError(400, "required email or user name");
  }

  // find user in database and check user register ar not

  const user = await User.findOne({
    $or: [{ email }, { userName }],
  });

  if (!user) {
    throw new ApiError(400, "user not exist");
  }

  // password check

  if (!password) {
    throw new ApiError(400, "password is required");
  }

  const passworValid = user.isPasswordCorrect(password);

  if (!passworValid) {
    throw new ApiError(400, "password incorrect");
  }

  // generate Access And Referesh Token

  const { accessToken, refreshToken } =
    await generateAccessAndRefereshToken(user);

  const loginUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  // create cookie

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loginUser,
          accessToken,
          refreshToken,
        },
        "User loggen in successfully"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  const loggedUser = await User.findByIdAndUpdate(
    req.user._id,
    {
      $set: {
        refreshToken: undefined,
      },
    },
    {
      new: true,
    }
  );

  const options = {
    // options object for cookie security because cookies modify in the frontend
    httpOnly: true,
    secure: true,
  };

  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, { loggedUser }, "user logged Out"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken = req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  if (!decodedToken) {
    throw new ApiError(401, "invalid refresh token");
  }
  const user = await User.findOne({ _id: decodedToken._id });
  if (!user) {
    throw new ApiError(400, "user not exist");
  }
  if (decodedToken !== user._id) {
    throw new ApiError(400, "decoded token not authenticated");
  }
  const { accessToken, refreshToken } =
    await generateAccessAndRefereshToken(user);

  const loginUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loginUser,
          accessToken,
          refreshToken,
        },
        "User loggen in using refreshToken successfully"
      )
    );
});

export { registerUser, loginUser, logoutUser, refreshAccessToken };
