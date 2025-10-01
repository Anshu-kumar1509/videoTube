import mongoose, {isValidObjectId} from "mongoose"
import {Video} from "../models/video.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {uploadOnCloudinary} from "../utils/cloudinary.js"


const getAllVideos = asyncHandler(async (req, res) => {
    //get all videos based on query, sort, pagination
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = "desc", userId } = req.query;

    const match = {};
    if (query) {
        match.title = { $regex: query, $options: "i" }; // search in title (case-insensitive)
    }
    if (userId && isValidObjectId(userId)) {
        match.owner = new mongoose.Types.ObjectId(userId);
    }

    const sortOptions = {};
    sortOptions[sortBy] = sortType === "asc" ? 1 : -1;

    const aggregate = Video.aggregate([
        { $match: match },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    { 
                        $project: { username: 1, email: 1 } 
                    }
                ]
            }
        },
        { $unwind: "$owner" },
        { $sort: sortOptions }
    ]);

    const options = {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10)
    };

    const videos = await Video.aggregatePaginate(aggregate, options);

    return res
    .status(200)
    .json(new ApiResponse(200,videos, "Videos fetched successfully"));
})

const publishAVideo = asyncHandler(async (req, res) => {
    // get video, upload to cloudinary, create video
    const { title, description } = req.body;

    if (!title || !description) {
        throw new ApiError(400, "Title and description are required");
    }

    if (!req.files?.videoFile || !req.files?.thumbnail) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    // Upload to cloudinary
    const videoFile = await uploadOnCloudinary(req.files.videoFile[0].path);
    const thumbnail = await uploadOnCloudinary(req.files.thumbnail[0].path);

    if (!videoFile || !thumbnail) {
        throw new ApiError(500, "Error uploading files");
    }

    const video = await Video.create({
        title,
        description,
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        duration: videoFile.duration || 0,
        owner: req.user._id
    });

    return res
    .status(201)
    .json(new ApiResponse(201,video, "Video published successfully"));
})

const getVideoById = asyncHandler(async (req, res) => {
    //get video by id
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "username");

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    // increase view count
    video.views += 1;
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(200,video, "Video fetched successfully"));
})

const updateVideo = asyncHandler(async (req, res) => {
    //update video details like title, description, thumbnail
    const { videoId } = req.params;
    const { title, description } = req.body;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update this video");
    }

    if (title) video.title = title;
    if (description) video.description = description;

    if (req.files?.thumbnail) {
        const newThumb = await uploadOnCloudinary(req.files.thumbnail[0].path);
        video.thumbnail = newThumb.url;
    }

    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(200,video, "Video updated successfully"));

})

const deleteVideo = asyncHandler(async (req, res) => {
    // delete video
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to delete this video");
    }

    await video.deleteOne();

    return res
    .status(200)
    .json(new ApiResponse(200,{}, "Video deleted successfully"));
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;

    if (!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId);

    if (!video) {
        throw new ApiError(404, "Video not found");
    }

    if (video.owner.toString() !== req.user._id.toString()) {
        throw new ApiError(403, "You are not allowed to update publish status of this video");
    }

    video.isPublished = !video.isPublished;
    await video.save();

    return res
    .status(200)
    .json(new ApiResponse(200,video, "Publish status updated successfully"));
})

export {
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}