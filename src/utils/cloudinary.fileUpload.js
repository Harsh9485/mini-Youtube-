import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUT_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localFilePath) => {
  try {
    if (!localFilePath) return null;
    // upload the file on cloudinary
    const response = await cloudinary.uploader.upload(localFilePath, {
      resource_type: "auto",
    });
    // file has been successfully uploaded
    fs.unlinkSync(localFilePath);
    return response;
  } catch (error) {
    fs.unlinkSync(localFilePath); // remove the locally saved temporary file as the upload opreation got failed
    return null;
  }
};

const deleteOnCloudinary = async (fileUrl) => {
  try {
    const fileName = fileUrl.split("/").pop().split(".")[0];
    const response = await cloudinary.uploader.destroy(fileName)
    return response;
  } catch (error) {
    console.log(error);
  }
}

export { uploadOnCloudinary, deleteOnCloudinary };
