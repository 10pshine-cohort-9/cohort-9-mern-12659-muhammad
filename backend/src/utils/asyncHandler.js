// it wraps an async route handler and forwards any rejected promise to error middleware,
// so there is only one error handling logic
function asyncHandler(fn) {
  return function (req, res, next) {
    return Promise.resolve(fn(req, res, next)).catch(next);
  };
}

module.exports = asyncHandler;
