import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req, res) => {
    // toggle like on video
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const existingLike = await Like.findOne({
        video: videoId,
        likedBy: req.user._id
    })

    if (existingLike) {
        // Already liked → remove it (unlike)
        await existingLike.deleteOne();
        return res.status(200).json(
            new ApiResponse(200, {}, "Video unliked successfully")
        );
    } 
    else {
        // Not liked yet → create new like
        const newLike = await Like.create({
            video: videoId,
            likedBy: req.user._id
        })
        return res.status(201).json(
            new ApiResponse(201, newLike, "Video liked successfully")
        )
    }
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    //toggle like on comment
    const { commentId } = req.params;

    if (!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid comment ID");
    }

    const existingLike = await Like.findOne({
        comment: commentId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(200, {}, "Comment unliked successfully")
        )
    } 
    else {
        const newLike = await Like.create({
            comment: commentId,
            likedBy: req.user._id
        })
        return res.status(201).json(
            new ApiResponse(201, newLike, "Comment liked successfully")
        )
    }

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    //toggle like on tweet
    const { tweetId } = req.params;

    if (!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet ID");
    }

    const existingLike = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user._id
    })

    if (existingLike) {
        await existingLike.deleteOne()
        return res.status(200).json(
            new ApiResponse(200, {}, "Tweet unliked successfully")
        )
    } 
    else {
        const newLike = await Like.create({
            tweet: tweetId,
            likedBy: req.user._id
        })
        return res.status(201).json(
            new ApiResponse(201, newLike, "Tweet liked successfully")
        )
    }
})

const getLikedVideos = asyncHandler(async (req, res) => {
    //get all liked videos
    const likedVideos = await Like.find(
        { 
            likedBy: req.user._id, 
            video: { $exists: true } 
        }).populate("video");

    return res.status(200).json(
        new ApiResponse(200, likedVideos, "Liked videos fetched successfully")
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}