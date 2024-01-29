import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.fileUpload.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async (req, res) => {
  // get user information from frontend

  const { userName, email, fullName, password } = req.body;

  // validation - not empty

  if (!userName || !email || !fullName || !password) {
    console.log("Please enter your name and email");
    throw new ApiError(400, "Please enter all required fields");
  }
  // check if user already exists: serche username and email

  const existingUser = await User.findOne({
    $or: [{ userName }, { email }]
  })
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

export { registerUser };
