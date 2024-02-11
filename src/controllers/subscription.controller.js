import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.model.js";
import { Subscription } from "../models/subscription.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  // TODO: toggle subscription
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }
  const isSubscribed = await Subscription.findOne({
    channel: channelId,
    subscriber: req.user._id,
  });
  if (!isSubscribed) {
    console.log("channel not subscribed");
    const channelsSubscribed = await Subscription.create({
      channel: channelId,
      subscriber: req.user._id,
    });
    if (!channelsSubscribed) {
      throw new ApiError(500, "error not subscribed to channel");
    }
    return res
      .status(200)
      .json(new ApiResponse(200, channelsSubscribed, "subscribe"));
  }
  const deleteSubscriber = await Subscription.findOneAndDelete(isSubscribed);
  if (!deleteSubscriber) {
    throw new ApiError(500, "error mongoose not delete subscriber");
  }
  return res.status(200).json(new ApiResponse(200, deleteSubscriber, "onSubscribe"));
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;
  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "invalid channel Id");
  }
  const subscribres = await Subscription.aggregate([
    {
      $match: {
        channel: new mongoose.Types.ObjectId(channelId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "subscriber",
        foreignField: "_id",
        as: "subscribres",
        pipeline: [
          {
            $project: {
              userName: 1,
              avatar: 1,
              fullName: 1,
            },
          },
        ],
      },
    },
  ]);
  if (!subscribres.length) {
    throw new ApiError(400, "no subscriber");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, subscribres, "fatched subscribers successfully")
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;
  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "invalid channel Id");
  }
  const channelList = await Subscription.aggregate([
    {
      $match: {
        subscriber: new mongoose.Types.ObjectId(subscriberId),
      },
    },
    {
      $lookup: {
        from: "users",
        localField: "channel",
        foreignField: "_id",
        as: "channels",
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
  ]);
  if (!channelList) {
    throw new ApiError(500, "no channel list found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, channelList, "channelList fatched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
