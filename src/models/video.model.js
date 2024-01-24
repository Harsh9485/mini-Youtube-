import mongoose, { Schema } from "mongoose";
import mongooseAggregatePaginate from "mongoose-aggregate-paginate-v2";

const videoSchema = new Schema(
  {
    vieoFile: {
      type: String, // cloudinary url
      required: [true, "Video required"],
    },
    thumbnail: {
      type: String, // cloudinary url
      required: [true, "Thumbnail required"],
    },
    owner: {
      type: Schema.ObjectId,
      ref: "User",
      required: [true, "Owner required"],
    },
    title: {
      type: String,
      required: [true, "Title required"],
    },
    description: {
      type: String,
      required: [true, "Description required"],
    },
    duration: {
      type: Number, // cloudinary url
    },
    views: {
      type: Number,
      default: 0,
    },
    ispublished: {
      type: Boolean,
    },
  },
  { timestamps: true }
);

videoSchema.plugin(mongooseAggregatePaginate);

const Video = mongoose.model("Video", videoSchema);

export { Video };
