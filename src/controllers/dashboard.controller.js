import mongoose from "mongoose"
import {Video} from "../models/video.model.js"
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getChannelStats = asyncHandler(async (req, res) => {
    //Get the channel stats like total video views, total subscribers, total videos, total likes etc.
    const channelId = req.user._id;  //req.user contains logged-in channel

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    // Total videos uploaded
    const totalVideos = await Video.countDocuments({ owner: channelId });

    // Total views (sum of views of all videos)
    const viewsAgg = await Video.aggregate([
        { 
            $match: { owner: channelId } 
        },
        { 
            $group: { 
                        _id: null, 
                        totalViews: { $sum: "$views" } 
                    } 
        }
    ]);
    const totalViews = viewsAgg[0]?.totalViews || 0;

    // Total subscribers
    const totalSubscribers = await Subscription.countDocuments({ channel: channelId });

    // Total likes on all videos of this channel
    const videoIds = await Video.find({ owner: channelId }).distinct("_id");
    const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

    return res.status(200).json(
        new ApiResponse(
            200,
            { totalVideos, totalViews, totalSubscribers, totalLikes },
            "Channel stats fetched successfully"
        )
    )
})

const getChannelVideos = asyncHandler(async (req, res) => {
    //Get all the videos uploaded by the channel
    const channelId = req.user._id;

    if (!mongoose.Types.ObjectId.isValid(channelId)) {
        throw new ApiError(400, "Invalid channel ID");
    }

    const videos = await Video.find({ owner: channelId })
        .sort({ createdAt: -1 }) // latest first
        .populate("owner", "username") // add channel info

    return res.status(200).json(
        new ApiResponse(200, videos, "Channel videos fetched successfully")
    )
})

export {
    getChannelStats, 
    getChannelVideos
}