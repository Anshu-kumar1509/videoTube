
// const asyncHandler = (fn) => async (req,res,nxt) => {
//     try {
//         await fn(req,res,nxt);
//     } catch (error) {
//         res.status(error.code || 500).json({
//             success: false,
//             message: error.message
//         })
//     }
// }

const asyncHandler = (fn)=>{
    return (req,res,nxt) => {
        Promise.resolve(fn(req,res,nxt)).catch((err)=>nxt(err));
    }
}

export {asyncHandler};