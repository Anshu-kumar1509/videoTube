import { Router } from "express";
import { changeCurrentPassword, getCurrentUser, getUserChannelProfile, getWatchHistory, loginUser, logoutUser, refreshAccessToken, registerUser, updateAccountDetails, updateAvatar, updateCoverImage } from "../controllers/user.controller.js";
import {upload} from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const userRouter = Router();

userRouter.route("/register").post(
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        },
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    registerUser
);
userRouter.route("/login").post(loginUser);

// secured routes
userRouter.route("/logout").post(verifyJWT, logoutUser);
userRouter.route("/refresh-access-token").post(refreshAccessToken);

userRouter.route("/change-password").patch(verifyJWT ,changeCurrentPassword);
userRouter.route("/get-user").get(verifyJWT,getCurrentUser);
userRouter.route("/update-account-details").patch(verifyJWT, updateAccountDetails);
userRouter.route("/update-avatar").patch(verifyJWT, upload.single("avatar"), updateAvatar);
userRouter.route("/update-coverImage").patch(verifyJWT, upload.single("coverImage"), updateCoverImage);
userRouter.route("/channel/:userName").get(verifyJWT, getUserChannelProfile);
userRouter.route("/watch-history").get(verifyJWT, getWatchHistory);


export default userRouter;