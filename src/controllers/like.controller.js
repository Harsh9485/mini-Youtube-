import mongoose, { isValidObjectId } from "mongoose";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: toggle like on video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video id");
  }
  const isLiked = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });
  if (!isLiked) {
    console.log("video not liked");
    const likedVideo = await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    if (!likedVideo) {
      throw new ApiError(500, "error not liked to video");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, likedVideo, "liked video"));
  }
  const deleteLikedVidoe = await Like.findByIdAndDelete(isLiked._id);
  if (!deleteLikedVidoe) {
    throw new ApiError(500, "error mongoose not delete liked video");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deleteLikedVidoe, "on liked"));
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;
  //TODO: toggle like on comment
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment id");
  }
  const isLiked = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });
  if (!isLiked) {
    console.log("comment not liked");
    const likedComment = await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    if (!likedComment) {
      throw new ApiError(500, "error not liked to comment");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, likedComment, "liked comment"));
  }
  const deleteLikedComment = await Like.findByIdAndDelete(isLiked._id);
  if (!deleteLikedComment) {
    throw new ApiError(500, "error mongoose not delete liked comment");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deleteLikedComment, "on liked"));
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  //TODO: toggle like on tweet
  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet id");
  }
  const isLiked = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });
  if (!isLiked) {
    console.log("tweet not liked");
    const likedTweet = await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    if (!likedTweet) {
      throw new ApiError(500, "error not liked to tweet");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, likedTweet, "liked tweet"));
  }
  const deleteLikedTweet = await Like.findByIdAndDelete(isLiked._id);
  if (!deleteLikedTweet) {
    throw new ApiError(500, "error mongoose not delete liked tweet");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deleteLikedTweet, "on liked"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
  //TODO: get all liked videos
  //pipeline likedBy === req.user._id then
  const allLikedVideos = await Like.aggregate([
    {
      $match: {
        video: { $exists: true, $ne: null },
        likedBy: mongoose.Types.ObjectId(req.user._id),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "video",
        foreignField: "_id",
        as: "video",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
              pipeline: [
                {
                  $project: {
                    userName: 1,
                    fullName: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
        ],
      },
    },
  ]);

  return res
    .status(200)
    .json(
      new ApiResponse(200, allLikedVideos, "successfully fathed like videos")
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
