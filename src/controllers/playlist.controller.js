import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const createPlaylist = asyncHandler(async (req, res) => {
    //create playlist
    const { name, description } = req.body;

    if (!name) {
        throw new ApiError(400, "Playlist name is required");
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user._id
    })

    return res.status(201).json(
        new ApiResponse(201, playlist, "Playlist created successfully")
    )
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    //get user playlists
    const { userId } = req.params;

    if (!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid user ID");
    }

    const playlists = await Playlist.find({ owner: userId }).populate("owner", "username email");

    return res.status(200).json(
        new ApiResponse(200, playlists, "User playlists fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    // get playlist by id
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findById(playlistId)
        .populate("owner", "username email")
        .populate("videos") // show video info inside playlist

    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist fetched successfully")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    // prevent duplicate videos
    if (playlist.videos.includes(videoId)) {
        throw new ApiError(400, "Video already in playlist");
    }

    playlist.videos.push(videoId);
    await playlist.save()

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video added to playlist successfully")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    //remove video from playlist
    const { playlistId, videoId } = req.params

    if (!isValidObjectId(playlistId) || !isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }

    const playlist = await Playlist.findById(playlistId)
    if (!playlist) {
        throw new ApiError(404, "Playlist not found");
    }

    playlist.videos = playlist.videos.filter(
        (vid) => vid.toString() !== videoId
    )
    await playlist.save();

    return res.status(200).json(
        new ApiResponse(200, playlist, "Video removed from playlist successfully")
    )

})

const deletePlaylist = asyncHandler(async (req, res) => {
    // delete playlist
    const { playlistId } = req.params;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findOneAndDelete({
        _id: playlistId,
        owner: req.user._id // ensure only owner can delete
    })

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or not authorized");
    }

    return res.status(200).json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})

const updatePlaylist = asyncHandler(async (req, res) => {
    // update playlist
    const { playlistId } = req.params;
    const { name, description } = req.body;

    if (!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist ID");
    }

    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { name, description },
        { new: true }
    )

    if (!playlist) {
        throw new ApiError(404, "Playlist not found or not authorized");
    }

    return res.status(200).json(
        new ApiResponse(200, playlist, "Playlist updated successfully")
    )
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}