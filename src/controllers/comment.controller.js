import mongoose, { isValidObjectId } from "mongoose";
import { Comment } from "../models/comment.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getVideoComments = asyncHandler(async (req, res) => {
  //TODO: get all comments for a video
  const { videoId } = req.params;
  const { page = 1, limit = 10 } = req.query;
});

const addComment = asyncHandler(async (req, res) => {
  // TODO: add a comment to a video
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, `Invalid video id: ${videoId}`);
  }
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, `content is required`);
  }
  const comment = await Comment.create({
    content,
    video: videoId,
    owner: req.user._id,
  });
  if (!comment) {
    throw new ApiError(500, "Comment not created");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, comment, "Comment created successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
  // TODO: update a comment
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, `Invalid video id: ${commentId}`);
  }
  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user._id,
  });
  if (!comment) {
    throw new ApiError(400, "Comment not found or onauthorized request");
  }
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, `content is required`);
  }
  if (content === comment.content) {
    return res
      .status(200)
      .json(new ApiResponse(200, comment, "comment not changed"));
  }
  comment.content = content;
  await comment.save({ validateBeforeSave: false });
  const newComment = await Comment.findById(comment._id);
  return res
    .status(200)
    .json(new ApiResponse(200, newComment, "comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
  // TODO: delete a comment
  const { commentId } = req.params;
  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, `Invalid video id: ${commentId}`);
  }
  const comment = await Comment.findOne({
    _id: commentId,
    owner: req.user._id,
  });
  if (!comment) {
    throw new ApiError(400, "Comment not found or onauthorized request");
  }
  const deletedComment = await Comment.findByIdAndDelete(comment._id);
  if (!deletedComment) {
    throw new ApiError(500, "Comment not found");
  }
  return res
    .status(200)
    .json(new ApiResponse(200, deletedComment, "Comment deleted successfully"));
});

export { getVideoComments, addComment, updateComment, deleteComment };
