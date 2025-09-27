import { Customer } from "../models/customer.model.js";
import { Reward } from "../models/reward.model.js";
import { ClaimedReward } from "../models/claimedReward.model.js";
import AppError from "../errors/appError.js";
import catchAsync from "../utility/catchAsync.js";
import { sendResponse } from "../utility/helper.js";

// Main user-facing function: Submits customer data and spins the wheel
export const submitReviewAndSpin = catchAsync(async (req, res, next) => {
  const { username, email, phone, rating, review } = req.body;

  // 1. Check if the customer already exists to prevent duplicate spins
  const existingCustomer = await Customer.findOne({ email });
  if (existingCustomer) {
    throw new AppError(400, "You have already participated.");
  }

  // 2. Create a new customer record with review data
  const newCustomer = await Customer.create({
    username,
    email,
    phone,
    rating,
    review,
  });

  // 3. Get all available rewards (stock > 0)
  const availableRewards = await Reward.find({ stockAvailable: { $gt: 0 } });

  // If no rewards are available, the user gets "Try Again"
  if (availableRewards.length === 0) {
    return sendResponse(res, {
      statusCode: 200,
      success: true,
      message: "Spin result",
      data: {
        reward: null,
        message:
          "Sorry, all rewards are currently unavailable. Please try again later.",
      },
    });
  }

  // 4. Implement weighted random selection to determine the winning prize
  const totalProbability = availableRewards.reduce(
    (sum, reward) => sum + (reward.probability || 0),
    0
  );
  let randomNumber = Math.random() * totalProbability;
  let winningReward = null;

  for (const reward of availableRewards) {
    randomNumber -= reward.probability || 0;
    if (randomNumber <= 0) {
      winningReward = reward;
      break;
    }
  }

  // If no prize is selected (due to low probability or no prize), default to a "Try Again" message
  if (!winningReward) {
    winningReward = {
      rewardName: "Try Again",
      description: "Sorry, better luck next time!",
      couponCode: null,
    };
  }

  // 5. If a winning prize is found, update its stock and create a claimed reward record
  let claimedReward = null;
  if (winningReward.couponCode) {
    winningReward.stockAvailable -= 1;
    await winningReward.save();

    claimedReward = await ClaimedReward.create({
      customer: newCustomer._id,
      reward: winningReward._id,
      couponCode: winningReward.couponCode,
    });
  }

  sendResponse(res, {
    statusCode: 200,
    success: true,
    message: "Spin result",
    data: {
      reward: {
        rewardName: winningReward.rewardName,
        couponCode: claimedReward ? claimedReward.couponCode : null,
        description: winningReward.description,
      },
      customer: newCustomer,
    },
  });
});
