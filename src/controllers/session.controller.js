import { v4 as uuidv4 } from "uuid";
import { sendResponse } from "../utility/helper.js";
import catchAsync from "../utility/catchAsync.js";

export const createSession = catchAsync(async (req, res) => {
  const sessionId = uuidv4();
  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Session created successfully",
    data: { sessionId },
  });
});
