import multer from "multer";

// Set storage engine
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "public/temp");
  },
  filename: (req, file, cb) => {
    cb(null, `${Date.now()}-${file.originalname}`);
  },
});

// Initialize upload
const upload = multer({
  storage,
  limits: { fileSize: 100000000 }, // Limit file size to 100MB
});

export default upload;
