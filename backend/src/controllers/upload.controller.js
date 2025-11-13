const handleImageUpload = (req, res, next) => {
  try {
    if (!req.file) {
      const error = new Error('No image uploaded');
      error.statusCode = 400;
      throw error;
    }

    const { path, filename, size, mimetype } = req.file;

    res.status(201).json({
      success: true,
      data: {
        url: path,
        publicId: filename,
        size,
        mimeType: mimetype,
      },
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  handleImageUpload,
};

