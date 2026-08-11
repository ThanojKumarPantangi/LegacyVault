import multer from "multer";

// Configure multer memory storage (we encrypt buffer in memory before writing to disk)
const storage = multer.memoryStorage();

// File filter validation
const fileFilter = (req, file, cb) => {
  // Disallow executable files
  const disallowedExtensions = /\.(exe|bat|sh|cmd|dll|scr|js|vbs|jar|msi)$/i;
  const disallowedMimeTypes = [
    "application/x-msdownload",
    "application/x-sh",
    "application/x-bash",
    "application/javascript",
    "application/x-javascript",
    "text/javascript",
  ];

  if (
    disallowedExtensions.test(file.originalname) ||
    disallowedMimeTypes.includes(file.mimetype)
  ) {
    return cb(
      new Error("File upload blocked: Executable file types are not allowed for security reasons."),
      false
    );
  }

  cb(null, true);
};

export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
});
