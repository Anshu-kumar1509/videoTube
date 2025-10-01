import mongoose, {isValidObjectId} from "mongoose"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    // toggle subscription
    const { channelId } = req.params;
    const userId = req.user._id; //req.user is populated from auth middleware

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    if (channelId === userId.toString()) {
        throw new ApiError(400, "Cannot subscribe to yourself");
    }

    // check if subscription exists
    const existingSub = await Subscription.findOne({ subscriber: userId, channel: channelId });

    if (existingSub) {
        // unsubscribe
        await existingSub.deleteOne();

        return res
        .status(200)
        .json(new ApiResponse(200,{}, "Unsubscribed successfully"));
    } 
    else {
        // subscribe
        const newSub = await Subscription.create({ subscriber: userId, channel: channelId });

        return res
        .status(201)
        .json(new ApiResponse(200,newSub, "Subscribed successfully"));
    }
})

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;

    if (!isValidObjectId(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const subscribers = await Subscription.find({ channel: channelId })
        .populate("subscriber", "username email") // populate subscriber info

    return res
    .status(200)
    .json(new ApiResponse(200,subscribers, "Subscribers fetched successfully"));
})

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;

    if (!isValidObjectId(subscriberId)) {
        throw new ApiError(400, "Invalid subscriber ID");
    }

    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .populate("channel", "username email") // populate channel info

    return res
    .status(200)
    .json(new ApiResponse(200,subscriptions,"Subscribed channels fetched successfully"));
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}