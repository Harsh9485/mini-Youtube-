import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  deleteOnCloudinary,
  uploadOnCloudinary,
} from "../utils/cloudinary.fileUpload.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, query, sortBy, sortType, userId } = req.query;
  //TODO: get all videos based on query, sort, pagination
  const skip = (page - 1) * limit;
  const videos = await Video.aggregate([
    {
      $limit: limit,
    },
    {
      $skip: skip,
    },
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
  ]);
  if (!videos.length) {
    throw new ApiError(500, "No videos found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, videos, "successfull fetched videos"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (!title && !description) {
    throw new ApiError(400, "Please provide title and description");
  }
  // get video and thumbnail
  const videoLocalPath = req.files?.videoFile[0]?.path;
  const thumbnailLocalPath = req.files?.thumbnail[0]?.path;

  if (!videoLocalPath || !thumbnailLocalPath) {
    throw new ApiError(400, "Please provide video and thumbnail");
  }

  const videoFile = await uploadOnCloudinary(videoLocalPath);
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile && !thumbnail) {
    throw new ApiError(500, "uploading faelad");
  }

  const video = await Video.create({
    videoFile: videoFile.url,
    thumbnail: thumbnail.url,
    owner: req.user._id,
    title,
    description,
    duration: videoFile.duration,
    ispublished: true,
  });
  const DBSavedVideo = await Video.findById(video._id);
  if (!DBSavedVideo) {
    throw new ApiError(500, "video not uploding in DB");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, DBSavedVideo, "success uploading video"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "please provide videoId");
  }
  const video = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
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
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
  ]);
  if (!video[0]) {
    throw new ApiError(400, "video not exist");
  }
  console.log(video);
  return res
    .status(200)
    .json(new ApiResponse(200, video[0], "success fatched video"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not exist");
  }
  if (video.owner == !req.user._id) {
    throw new ApiError(400, "aunother user not allowed to update video");
  }
  const { title, description } = req.body;
  console.log(title, description);
  console.log(video);
  if (title || description) {
    if (title !== video.title) {
      video.title = title;
    }
    if (description !== video.description) {
      video.description = description;
    }
  }
  const thumbnailLocalPath = req.file?.path;
  if (!thumbnailLocalPath) {
    throw new ApiError(400, "missing thumbnail");
  }
  const thumbnail = await uploadOnCloudinary(thumbnailLocalPath);
  if (!thumbnail) {
    throw new ApiError(500, "upload on cloudinary is failed");
  }
  deleteOnCloudinary(video.thumbnail);
  video.thumbnail = thumbnail.url;
  await video.save({ validateBeforeSave: false });
  const DBVideo = await Video.findById(video._id);
  return res
    .status(200)
    .json(new ApiResponse(200, DBVideo, "success update video"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "missing video id");
  }
  const video = await Video.findByIdAndDelete(videoId);
  await deleteOnCloudinary(video.thumbnail);
  await deleteOnCloudinary(video.videoFile);
  if (!video) {
    throw new ApiError(400, "video not exist");
  }
  return res.json(new ApiResponse(200, video, "video deleted"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "vidoe Id not correct");
  }
  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(400, "video not exist");
  }
  video.ispublished = !video.ispublished;
  const ispublished = video.ispublished ? "published" : "private";
  await video.save({ vaildateBeforeSave: true });
  return res
    .status(200)
    .json(new ApiResponse(200, video, `video successfully ${ispublished}`));
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
