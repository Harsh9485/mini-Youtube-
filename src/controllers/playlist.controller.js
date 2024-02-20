import mongoose, { disconnect, isValidObjectId } from "mongoose";
import { Playlist } from "../models/playlist.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createPlaylist = asyncHandler(async (req, res) => {
  const { name, description } = req.body;

  //TODO: create playlist
  if (!name) {
    throw new ApiError(400, "Invalid playlist name");
  }

  const playlist = await Playlist.create({
    name,
    description,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(500, "server error creating playlist failed");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, playlist, "success create playlist"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
  const { userId } = req.params;
  //TODO: get user playlists
  if (!isValidObjectId(userId)) {
    throw new ApiError(400, "Invalid userId");
  }
  const userPlaylists = await Playlist.aggregate([
    {
      $match: {
        owner: mongoose.Types.ObjectId(userId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlist",
      },
    },
  ]);
  if (!userPlaylists) {
    throw new ApiError(500, "intrnal server error Playlists not found");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(200, userPlaylists, "playlists successfully fetched")
    );
});

const getPlaylistById = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  //TODO: get playlist by id
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist id required");
  }
  const userPlaylist = await Playlist.aggregate([
    {
      $match: {
        _id: mongoose.Types.ObjectId(playlistId),
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "videos",
        foreignField: "_id",
        as: "playlist",
        pipeline: [
          {
            $lookup: {
              from: "users",
              localField: "owner",
              foreignField: "_id",
              as: "owner",
            },
          },
          {
            $project: {
              fullName: 1,
              userName: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
  ]);
  if (!userPlaylist) {
    throw new ApiError(500, "intrnal server error Playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, userPlaylist, "playlists successfully fetched"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist id required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video id required");
  }
  const userPlaylist = await Playlist.findById(playlistId);
  if (!userPlaylist) {
    throw new ApiError(500, "intrnal server error Playlist not found");
  }
  userPlaylist.videos.push(videoId);
  await userPlaylist.save({ validateBeforeSave: false });
  const updatedPlaylist = await Playlist.findById(playlistId);
  if (userPlaylist.videos.length() === updatedPlaylist.videos.length()) {
    throw new ApiError(500, "video not add in playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "successfully add video"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
  const { playlistId, videoId } = req.params;
  // TODO: remove video from playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist id required");
  }
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "video id required");
  }
  const userPlaylist = await Playlist.findById(playlistId);
  if (!userPlaylist) {
    throw new ApiError(500, "intrnal server error Playlist not found");
  }
  userPlaylist.videos = userPlaylist.videos.filter((id) => id !== videoId);
  await userPlaylist.save({ validateBeforeSave: false });
  const updatedPlaylist = await Playlist.findById(playlistId);
  if (userPlaylist.videos.length() === updatedPlaylist.videos.length()) {
    throw new ApiError(500, "video not removed in playlist");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, updatedPlaylist, "successfully remove video"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  // TODO: delete playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist id required");
  }
  const userPlaylist = await Playlist.findByIdAndDelete(playlistId);
  if (!userPlaylist) {
    throw new ApiError(500, "intrnal server error Playlist not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, userPlaylist, "successfully delete playlist"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
  const { playlistId } = req.params;
  const { name, description } = req.body;
  //TODO: update playlist
  if (!isValidObjectId(playlistId)) {
    throw new ApiError(400, "playlist id required");
  }
  if (!name) {
    throw new ApiError(400, "name required");
  }
  if (!description) {
    throw new ApiError(400, "description required");
  }
  const playlist = await Playlist.find({
    _id: playlistId,
    owner: req.user._id,
  });
  if (!playlist) {
    throw new ApiError(500, "playlist not found");
  }
  if (name === playlist.name) {
    if (description === playlist.description) {
      return res
        .status(200)
        .json(
          new ApiResponse(
            200,
            playlist,
            "not changed because name is same as description"
          )
        );
    }
    playlist.description = description;
    await playlist.save({ validateBeforeSave: false });
    const updatedPlaylist = await Playlist.findById(playlistId);
    if (!updatedPlaylist) {
      throw new ApiError(400, "playlist not updated");
    }
    return res
      .status(200)
      .json(
        new ApiResponse(
          200, 
          updatedPlaylist, 
          "success updated description"
        )
      );
  }
  playlist.name = name;
  playlist.description = description;
  await playlist.save({ validateBeforeSave: false });
  const updatedPlaylist = await Playlist.findById(playlistId);
  if (!updatedPlaylist) {
    throw new ApiError(400, "playlist not updated");
  }
  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        updatedPlaylist,
        "success updated description and name"
      )
    );
});

export {
  createPlaylist,
  getUserPlaylists,
  getPlaylistById,
  addVideoToPlaylist,
  removeVideoFromPlaylist,
  deletePlaylist,
  updatePlaylist,
};
