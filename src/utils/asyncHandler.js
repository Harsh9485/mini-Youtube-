// const asyncHandler = (func) => async (req, res, next) => {
//   // async handler function use try catch
//   try {
//     await func(req, res, next);
//   } catch (error) {
//     res.status(error.code || 500).json({
//       success: false,
//       massege: error.message,
//     });
//   }
// };

const asyncHandler = (requestHandler) => {
  // requestHandler a asynchronous function, useing Promise.resolve to handle the error
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      console.log("async handler error: " + error);
      res.status(error.statusCode || 500).json({
        success: false,
        message: error.message,
      });
    });
  };
};

export { asyncHandler };
