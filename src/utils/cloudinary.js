import { v2 as cloudinary } from "cloudinary";
import fs from "fs";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadOnCloudinary = async (localPath) => {
  try {
    if (!localPath) return null;
    // Upload an image
    const uploadResult = await cloudinary.uploader.upload(localPath, {
      public_id: "videoFile",
      resource_type: "auto",
    });
    console.log("File uploaded on cloudinary: " + uploadResult);
    return uploadResult;
  } catch (error) {
    fs.unlinkSync(localPath);
    console.log(error);
  }
};

export { uploadOnCloudinary };
