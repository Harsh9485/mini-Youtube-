import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {
  deleteOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import { json } from "express";

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
  const passworValid = await user.isPasswordCorrect(password);

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
  ).select("-password -refreshToken");

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
  const incomingRefreshToken =
    req.cookies?.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "unauthorized request");
  }
  console.log("incomingRefreshToken: " + incomingRefreshToken);
  const decodedToken = jwt.verify(
    incomingRefreshToken,
    process.env.REFRESH_TOKEN_SECRET
  );
  console.log("decodedToken", decodedToken);
  if (!decodedToken) {
    throw new ApiError(401, "invalid refresh token");
  }
  const user = await User.findOne({ _id: decodedToken._id });
  console.log(user);
  if (!user) {
    throw new ApiError(400, "user not exist");
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

const changeCurrentPassword = asyncHandler(async (req, res) => {
  // Get user current password and new password
  const { password, newPassword } = req.body;
  if (!password && !newPassword) {
    throw new ApiError(400, "password and newPassword are required");
  }
  const userId = req.user?._id;
  const user = await User.findById(userId);
  // campar DB password and user current password use {userSchema.methods.isPasswordCorrect()}
  const passworValid = await user.isPasswordCorrect(password);
  if (!passworValid) {
    throw new ApiError(400, "password Invalid");
  }

  // save DB new password
  user.password = newPassword;
  await user.save({ validateBeforeSave: false });

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "success change password"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res.status(200).json(new ApiResponse(200, req.user, "success get user"));
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullName, email } = req.body;
  if (!email || !fullName) {
    throw new ApiError(400, "email or full name not provided");
  }
  const updateUser = User.findOneAndUpdate(
    req.user._id,
    {
      $set: {
        fullName,
        email,
      },
    },
    { new: true }
  ).select("-password -refreshToken");

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updateUser,
        "user email or full name successful update"
      )
    );
});

const updateUserAvatar = asyncHandler(async (req, res) => {
  const avatarLocalPath = req.files?.avatar[0].path;
  if (!avatarLocalPath) {
    throw new ApiError(400, "avatar not provided");
  }
  const avatar = await uploadOnCloudinary(avatarLocalPath);
  if (!avatar.url) {
    throw new ApiError(400, "upload avatar failed");
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      avatar: avatar.url,
    },
  }).select("-password -refreshToken");
  deleteOnCloudinary(user.avatar);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const updateUserCoverImage = asyncHandler(async (req, res) => {
  const coverImageLocalPath = req.files?.coverImage[0].path;
  if (!coverImageLocalPath) {
    throw new ApiError(400, "coverImage not provided");
  }
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!coverImage.url) {
    throw new ApiError(400, "upload coverImage failed");
  }
  const user = await User.findByIdAndUpdate(req.user._id, {
    $set: {
      coverImage: coverImage.url,
    },
  }).select("-password -refreshToken");
  deleteOnCloudinary(user?.coverImage);
  return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar updated successfully"));
});

const getUserChannelProfile = asyncHandler(async (req, res) => {
  const username = req.params;
  if (!username?.trim()) {
    throw new ApiError(400, "username not provided");
  }
  const channel = await User.aggregate([
    {
      $match: {
        userName: username?.toLowerCase(),
      },
    },
    {
      $lookup: {
        from: "subscriptions", // subscription documentation to add User documentation
        localField: "_id", // user _id
        foreignField: "channel", // channel ma user _id - ObjectId ka kita na documant ha vi ta na hi subscriber ho ga
        as: "subscribers", // sa ra data subscribers ka a jaya ga
      },
    },
    {
      $lookup: {
        from: "subscriptions", // subscription documentation to add User documentation
        localField: "_id", // user _id
        foreignField: "subscriber", // a user na ki tno ko subscrib ki ya ha subscriber cllection ma ji tna user _id ka dovumant ho ja vi tna channel subscrib kya ha
        as: "subscribedTo",
      },
    },
    {
      $addFields: {
        subscribersCount: {
          $size: "$subscribers", // ji ta na subscribers documenta ho ga vi ta na channel ka subscriber ki ya ha
        },
        channelsSubscribedToCount: {
          $size: "$subscribedTo", // ji ta na channel documenta ho ga vi ta na channel ka subscriber ki ya ha user na
        },
        isSubscribed: {
          $cond: {
            if: { $in: [req.user?._id, "$subscribers.subscriber"] }, // user _id ha subscribers object ma is ka matlab user na subscriber  ki ya ha
            then: true,
            else: false,
          },
        },
      },
    },
    {
      $project: {
        fullName: 1,
        userName: 1,
        subscribersCount: 1,
        channelsSubscribedToCount: 1,
        isSubscribed: 1,
        email: 1,
        avatar: 1,
        coverImage: 1,
      },
    },
  ]);
  if (!channel?.length) {
    throw new ApiError(404, "channel not exist");
  }

  res
    .status(200)
    .json(new ApiResponse(200, channel[0], "channel fetched successfully"));
});

export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
};
