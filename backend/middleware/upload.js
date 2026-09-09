import multer from "multer";

// Stores in memory; controller streams the buffer to Cloudinary (or swap
// for diskStorage / S3 in production). Keeps this sample dependency-light.
const storage = multer.memoryStorage();

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("image/")) cb(null, true);
  else cb(new Error("Only image files are allowed"), false);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 5 },
});
