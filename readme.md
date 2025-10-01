# 🎥 VideoTube - Backend API

This is a **backend API** built with **Node.js, Express, and MongoDB (Mongoose)** that powers features similar to a **social media / video sharing platform**.  
It includes user authentication, video management, likes, comments, playlists, and subscriptions.  
The project also integrates **Multer + Cloudinary** for secure file uploads and supports **pagination, sorting, and filtering** with a modular REST API structure.

---

## 🚀 Features

- **User Authentication & Authorization**
  - Register, login, and JWT-based authentication
  - Secure password hashing with **bcrypt**
  - Cookie-based token handling with **cookie-parser**

- **Video Management**
  - Upload and publish videos (stored on Cloudinary)
  - Update or delete videos
  - Toggle publish/unpublish status
  - Pagination, sorting & filtering using `mongoose-aggregate-paginate-v2`

- **Tweets (short posts)**
  - Create, update, delete tweets
  - Fetch tweets by user

- **Playlists**
  - Create, update, and manage playlists
  - Add or remove videos from playlists

- **Likes & Comments**
  - Like/unlike videos or tweets
  - Add, update, or delete comments

- **Subscriptions**
  - Subscribe/unsubscribe to channels
  - Get subscribers of a channel
  - Get channel list a user has subscribed to

---

## 🛠 Tech Stack

- **Backend:** Node.js, Express.js  
- **Database:** MongoDB with Mongoose ODM  
- **Authentication:** JWT, bcrypt  
- **File Uploads:** Multer, Cloudinary  
- **Security & Utilities:** dotenv, cors, cookie-parser  
- **Dev Tools:** Nodemon for auto-reload  

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/Anshu-kumar1509/videoTube.git
   cd videoTube
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**  
   Create a `.env` file (or copy `.env.sample`) and add:
   ```env
   PORT=4000
   MONGODB_URI=your_mongodb_connection_string
   JWT_SECRET=your_jwt_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

4. **Start the development server**
   ```bash
   npm run dev
   ```

---

## 🔥 Future Enhancements
- Add unit & integration tests with Jest  
- Add rate limiting & input validation  
- Role-based access control (Admin, User)  
- Dashboard analytics  

---

## 👨‍💻 Author
**Anshu Kumar**  
[GitHub Profile](https://github.com/Anshu-kumar1509)
