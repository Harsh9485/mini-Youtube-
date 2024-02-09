import mongoose, { isValidObjectId } from "mongoose";
import { Tweet } from "../models/tweet.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  //TODO: create tweet
  const { content } = req.body;
  if (!content && content?.trim() === "") {
    throw new ApiError(400, "Invalid content text");
  }
  const tweet = await Tweet.create({
    owner: req.user._id,
    content,
  });
  if (!tweet) {
    throw new ApiError(500, "DB Error tweet not created");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "tweet sccessfully created"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  // TODO: get user tweets
  const { userId } = req.params;
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid user id");
  }
  const tweets = await Tweet.find({ owner: userId });
  if (!tweets) {
    throw new ApiError(500, "DB Error tweets not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "tweets successfully fatched"));
});

const updateTweet = asyncHandler(async (req, res) => {
  //TODO: update tweet
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweet id invalied");
  }
  const { content } = req.body;
  if (!content && content?.trim() === "") {
    throw new ApiError(400, "content not provide");
  }
  const tweet = await Tweet.find({ owner: req.user.id, _id: tweetId });
  if (!tweet) {
    throw new ApiError(400, "aunouther requst");
  }

  if (tweet.content === content) {
    return res.status(200).json(new ApiResponse(200, tweet, "tweet updated"));
  }
  tweet.content = content;
  await tweet.save({ validateBeforeSave: false });
  const updatedTweet = await Tweet.findById(tweet._id);
  if (!updatedTweet) {
    throw new ApiError(500, "tweet not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedTweet, "tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  //TODO: delete tweet
  const { tweetId } = req.params;
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "tweet id invalied");
  }
  const tweet = await Tweet.find({ owner: req.user.id, _id: tweetId });
  if (!tweet) {
    throw new ApiError(400, "aunouther requst");
  }
  const deletedTweet = await Tweet.findByIdAndDelete(tweet._id)
  return res
  .status(200)
  .json(new ApiResponse(200, deletedTweet, "successfull deleted tweet"))
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
