// Centralized error handler
module.exports = (err, _req, res, _next) => {
  const statusCode = Number(err.statusCode) || 500;
  const message =
    err && typeof err.message === "string" ? err.message : "Server error";

  if (process.env.NODE_ENV !== "production") {
    console.error(err);
  }

  res.status(statusCode).json({
    message,
  });
};

