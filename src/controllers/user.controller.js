import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import {User} from "../models/user.model.js"
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import {ApiResponse} from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessAndRefreshToken = async(userid)=>{
    try {
        const user = await User.findById(userid);
    
        const accessToken = user.generateAccessToken();
        const refreshToken = user.generateRefreshToken();
    
        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave: false});
    
        return {accessToken, refreshToken};
    } catch (error) {
        throw new ApiError(500, "something went wrong while generating tokens");
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    // get user data from frontend
    // validation on data - not empty
    // check user already exist or not - userName and email
    // check for images- check avatar
    // upload on cloudinary
    // create user object and make entry in db
    // check user registered successfully
    // remove password and refreshToken from response
    // send response

    const {userName, password, email, fullName} = req.body;
    // console.log("email: ",email);


    if (
        [userName, password, email, fullName].some( (field) => field?.trim()==="" )
    ) {
        throw new ApiError(400,"all fields are compulsary");
    }


    const existedUser = await User.findOne({
        $or: [ {userName}, {email} ]
    })
    if (existedUser) {
        throw new ApiError(409,"user already exists with this userName or password");
    }


    // const avatarLocalPath = req.files?.avatar[0]?.path;
    let avatarLocalPath = null;
    if(req.files && req.files.avatar && Array.isArray(req.files.avatar) && req.files.avatar.length > 0){
        avatarLocalPath = await req.files.avatar[0].path;
    }

    let coverImageLocalPath = null;
    if(req.files && req.files.coverImage && Array.isArray(req.files.coverImage) && req.files.coverImage.length > 0){
        coverImageLocalPath = await req.files.coverImage[0].path;
    }

    if (!avatarLocalPath) {
        throw new ApiError(404, "avatar image is compulsary field");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);

    let coverImage = null;
    if(coverImageLocalPath){
        coverImage = await uploadOnCloudinary(coverImageLocalPath);
    }

    if (!avatar) {
        throw new ApiError(404, "avatar image is compulsary field");
    }

    const user = await User.create({
        userName: userName.toLowerCase(),
        password,
        email,
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || ""
    })


    const registeredUser = await User.findById(user._id).select("-password -refreshToken");

    if(!registeredUser){
        throw new ApiError(500, "something went wrong while registering user");
    }

    return res.status(200).json(
        new ApiResponse(200,registeredUser,"user registered successfully")
    )

})

const loginUser = asyncHandler(async(req,res)=>{
    // take user info from req.body
    // validate username or email 
    // check password
    // generate access and refresh token 
    // send cookie

    const {userName, email, password} = req.body;

    if(!userName && !email){
        throw new ApiError(401, "userName or email is required field");
    }

    const user = await User.findOne({
        $or: [{userName}, {email}]
    })

    if(!user){
        throw new ApiError(400, "this user does not exists");
    }

    const isValidPassword = await user.isPasswordCorrect(password);

    if(!isValidPassword){
        throw new ApiError(402, "password is incorrect");
    }

    const {accessToken, refreshToken} = await generateAccessAndRefreshToken(user._id);

    const loggedInUser = await User.findById(user._id).select("-password -refreshToken");

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {
                user: loggedInUser,
                accessToken,
                refreshToken
            },
            "user logged in successfully"
        )
    );
})

const logoutUser = asyncHandler(async(req,res)=>{
    await User.findByIdAndUpdate(
        req.user._id,
        {
            $unset:{
                refreshToken: 1
            }
        },
        {
            new: true // it helps to return updated user document
        }
    )

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(
        new ApiResponse(200, {}, "user logged out successfully")
    );
})

const refreshAccessToken = asyncHandler(async(req,res)=>{
    const receivedRefreshToken = req.cookies?.refreshToken || req.body?.refreshToken;
    if(!receivedRefreshToken){
        throw new ApiError(401,"refresh token not sent");
    }

    const decodedReceivedToken = jwt.verify(receivedRefreshToken, process.env.REFRESH_TOKEN_SECRET);

    const user = await User.findById(decodedReceivedToken?._id);
    if(!user){
        throw new ApiError(401,"refresh token is invalid, no user found");
    }

    if(receivedRefreshToken != user.refreshToken){
        throw new ApiError(401,"refresh token is invalid");
    }

    const {accessToken,refreshToken} = await generateAccessAndRefreshToken(user._id);

    const options = {
        httpOnly: true,
        secure: true
    }

    return res
    .status(200)
    .cookie("accessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
        new ApiResponse(
            200,
            {accessToken, refreshToken},
            "access token renewed with help of refresh token successfully"
        )
    );

})

const changeCurrentPassword = asyncHandler(async(req,res)=>{
    const {oldPassword, newPassword} = req.body;

    if(!oldPassword || !newPassword){
        throw new ApiError(400,"old and new password is required");
    }

    const user = await User.findById(req.user._id);

    const isCorrectPassword = await user.isPasswordCorrect(oldPassword);
    if(!isCorrectPassword){
        throw new ApiError(400,"old password is incorrect");
    }

    user.password = newPassword;
    await user.save({validateBeforeSave: false});

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "password changed successfully")
    );
})

const getCurrentUser = asyncHandler(async(req,res)=>{
    return res
    .status(200)
    .json(new ApiResponse(200, req.user, "current user fetched successfully"));
})

const updateAccountDetails = asyncHandler(async(req,res)=>{
    const {userName, fullName, email} = req.body;
    if(!(userName || fullName || email)){
        throw new ApiError(401, "no field to update");
    }

    const updateFields = {};
    if (userName) updateFields.userName = userName;
    if (fullName) updateFields.fullName = fullName;
    if (email) updateFields.email = email;

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set: updateFields
        },
        {new: true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "your profile updated successfully"));
})

const updateAvatar = asyncHandler(async(req,res)=>{
    const avatarLocalPath = req.file?.path;
    if (!avatarLocalPath) {
        throw new ApiError(400, "avatar image is not given to update");
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath);
    if(!avatar){
        throw new ApiError(500, "error in uploading updated avatar to cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                avatar: avatar.url
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "avatar image is updated successfully"));
})

const updateCoverImage = asyncHandler(async(req,res)=>{
    const coverImageLocalPath = req.file?.path;
    if (!coverImageLocalPath) {
        throw new ApiError(400, "cover image is not given to update");
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath);
    if(!coverImage){
        throw new ApiError(500, "error in uploading updated coverImage to cloudinary");
    }

    const user = await User.findByIdAndUpdate(
        req.user._id,
        {
            $set:{
                coverImage: coverImage.url
            }
        },
        {new: true}
    ).select("-password -refreshToken");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "cover image is updated successfully"));
})

const getUserChannelProfile = asyncHandler(async(req,res)=>{
    const {userName} = req.params;
    if(!userName?.trim()){
        throw new ApiError(400, "user name is not sent through params");
    }

    const channel = await User.aggregate([      //returns array of documents
        {
            $match:{     // selects documents
                userName: userName.trim().toLowerCase()
            }
        },
        {
            $lookup: {  // perform join 
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            } //adds a field subscribers(array of matched documents) to the documents selected by match
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "subscriber",
                as: "subscribedTo"
            }
        },
        {
            $addFields: {   // add fields 
                subscribersCount: {
                    $size: "$subscribers"  // length of array
                },
                subscribedToCount: {
                    $size: "$subscribedTo"
                },
                isSubscribed:{
                    $cond: {
                        if: {$in : [req.user?._id, "$subscribers.subscriber"]}, //Extract the subscriber field from each object inside the subscribers array, and return it as an array.
                        then: true,
                        else: false
                    }
                }
            }
        },
        {
            $project: {    // which all values to show marked as 1
                fullName: 1,
                userName: 1,
                email: 1,
                avatar: 1,
                coverImage: 1,
                subscribersCount: 1,
                subscribedToCount: 1,
                isSubscribed: 1
            }
        }
    ])

    if (!channel?.length) {
        throw new ApiError(400, "channel does not exists");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, channel[0], "channel fetched successfully")
    );
})

const getWatchHistory = asyncHandler(async(req,res)=>{
    const user = await User.aggregate([
        {    
            $match:{
                _id: new mongoose.Types.ObjectId(req.user._id) 
            }
        },
        {
            $lookup:{
                from: "videos",
                localField: "watchHistory",
                foreignField: "_id",
                as: "watchHistory",
                pipeline: [ // corresponds to videos
                    {
                        $lookup:{
                            from: "users",
                            localField: "owner",
                            foreignField: "_id",
                            as: "owner",
                            pipeline: [ // corresponds to users
                                {
                                    $project:{
                                        userName: 1,
                                        fullName: 1,
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields:{
                            owner:{
                                $first: "$owner"
                            }
                        }
                    }
                ]
            }
        }

    ]);

    return res
    .status(200)
    .json(
        new ApiResponse(
            200,
            user[0].watchHistory,
            "watch history fetched successfully"
        )
    );
})




export {registerUser, loginUser, logoutUser, refreshAccessToken, changeCurrentPassword, getCurrentUser, updateAccountDetails, updateAvatar, updateCoverImage, getUserChannelProfile, getWatchHistory}