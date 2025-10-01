import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //get all comments for a video
    const { videoId } = req.params;
    const { page = 1, limit = 10 } = req.query;

    // check if video id is wrong
    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }
    
    // fetching all comments of that video
    const comments = await Comment.find({ video: videoId })
        .skip((page - 1) * limit)
        .limit(Number(limit))
        .sort({ createdAt: -1 }) // latest first
        .populate("owner", "userName"); // populate userName

    const totalComments = await Comment.countDocuments({ video: videoId });

    return res.status(200).json(
        new ApiResponse(
            200,
            { 
                comments,
                total: totalComments, 
                page, 
                limit 
            },
            "Comments fetched successfully"
        )
    );

})

const addComment = asyncHandler(async (req, res) => {
    // add a comment to a video
    const { videoId } = req.params
    const { text } = req.body

    if (!mongoose.Types.ObjectId.isValid(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    if (!text) {
        throw new ApiError(400, "Comment text is required")
    }

    const comment = await Comment.create({
        video: videoId,
        owner: req.user._id, //user is set in req.user
        content: text
    })

    return res.status(201).json(
        new ApiResponse(201, comment, "Comment added successfully")
    )
})

const updateComment = asyncHandler(async (req, res) => {
    // update a comment
    const { commentId } = req.params
    const { content } = req.body

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    if (!content) {
        throw new ApiError(400, "Comment text is required")
    }

    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id }, // ensure user owns the comment
        { content },
        { new: true }
    )

    if (!comment) {
        throw new ApiError(404, "Comment not found or not authorized")
    }

    return res.status(200).json(
        new ApiResponse(200, comment, "Comment updated successfully")
    )
})

const deleteComment = asyncHandler(async (req, res) => {
    // delete a comment
    const { commentId } = req.params

    if (!mongoose.Types.ObjectId.isValid(commentId)) {
        throw new ApiError(400, "Invalid comment ID")
    }

    const comment = await Comment.findOneAndDelete({
        _id: commentId,
        owner: req.user._id // ensure user owns the comment
    })

    if (!comment) {
        throw new ApiError(404, "Comment not found or not authorized")
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Comment deleted successfully")
    )
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}