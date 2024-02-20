import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }
  const channelStats = await Video.aggregate([
    {
      $match: {
        owner: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "subscriptions",
        localField: "owner",
        foreignField: "channel",
        as: "subscribers",
      },
    },
    {
      $lookup: {
        from: "likes",
        localField: "_id",
        foreignField: "video",
        as: "likes",
      },
    },
    {
      $addFields: {
        totalSubscribers: {
          $size: "$subscribers",
        },
        totalVideos: {
          $size: "$videos",
        },
        totalLikes: {
          $size: "$likes",
        },
      },
    },
  ]);
  if (!channelStats?.length) {
    throw new ApiError(500, "DB error channelStats");
  }
  const totalViwes = await Video.find({ owner: channelId });
  if (!totalViwes?.length) {
    throw new ApiError(500, "DB error totalViwes");
  }
  const totalViwe = 0;
  totalViwes.forEach((viwes) => {
    totalViwe = totalViwe + viwes.viwes;
  });
  return res
    .status(200)
    .json(200, [channelStats, totalViwe], "successfull fatched channelStats");
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel id");
  }
  const videos = await Video.find({ owner: channelId });
  if (!videos) {
    throw new ApiError(500, "DB videos not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "successfully fatched videos"));
});

export { getChannelStats, getChannelVideos };
