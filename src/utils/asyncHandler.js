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
  (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((err) =>
      console.log("async handler error: " + err)
    );
  };
};

export { asyncHandler };
