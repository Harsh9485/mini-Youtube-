const mongoose = require("mongoose");

// Define the like schema
const likeSchema = new mongoose.Schema(
  {
    video: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Video", // Assuming there's a 'Video' model for the liked video
    },
    comment: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Comment", // Assuming there's a 'Comment' model for the liked comment
    },
    tweet: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Tweet", // Assuming there's a 'Tweet' model for the liked tweet
    },
    likedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User", // Assuming there's a 'User' model for the user who liked
      required: true,
    },
  },
  { timestamps: true }
);

// Define the Like model
const Like = mongoose.model("Like", likeSchema);

export { Like };
