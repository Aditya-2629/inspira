require("dotenv").config();
const express = require("express");
const router = express.Router();
const userModel = require("./users");
const postModel = require("./post");
const passport = require("passport");
const LocalStrategy = require("passport-local").Strategy;
const upload = require("./multer"); // Multer configuration
const { uploadOnCloudinary } = require("../utility/cloudinary"); // Cloudinary utility
const fs = require("fs");
const io = require("../socket"); // Socket.io instance (still needed for likes/comments)
const nodemailer = require("nodemailer");
const crypto = require("crypto");
const {
  sendWelcomeEmail,
  sendPasswordResetRequest,
  sendPasswordResetConfirmation,
} = require("../utility/email");
// Passport configuration
passport.use(new LocalStrategy(userModel.authenticate()));

// Home route
router.get("/", (req, res) => {
  res.render("index", { nav: false });
});

// Show all posts
router.get("/feed", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    const posts = await postModel.find().populate("user");
    res.render("feed", { posts, user, nav: true });
  } catch (err) {
    res.redirect("/profile");
  }
});

// Navigate to Author Profile
router.get("/user/:id", isLoggedIn, async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .populate("posts")
      .populate("followers")
      .populate("following");
    res.render("profile", { user, nav: true });
  } catch (err) {
    res.redirect("/feed");
  }
});

// Navigate to detail info of post
router.get("/post/:id", async (req, res) => {
  try {
    const post = await postModel
      .findById(req.params.id)
      .populate("user", "username profilePic")
      .populate("comments.user", "username profilePic");

    if (!post) return res.status(404).send("Post not found");

    res.render("postDetail", { post, user: req.user, nav: true });
  } catch (err) {
    console.error("Error fetching post:", err);
    res.status(500).send("Server error");
  }
});

// Navigate to profile page
router.get("/profile", isLoggedIn, async (req, res) => {
  try {
    const currentUser = await userModel
      .findOne({ username: req.session.passport.user })
      .populate("posts")
      .populate("followers")
      .populate("following");
    if (!currentUser.profilePic) currentUser.profilePic = "/images/default.png"; // Fallback
    console.log("Profile user profilePic:", currentUser.profilePic); // Debug
    console.log("Current User:", currentUser);
    res.render("profile", { user: currentUser, currentUser, nav: true });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.redirect("/");
  }
});

router.get("/profile/:id", async (req, res) => {
  try {
    const user = await userModel.findById(req.params.id).populate("posts");

    if (!user) return res.status(404).send("User not found");

    res.render("profile", { user, currentUser: req.user, nav: true });
  } catch (err) {
    console.error("Error fetching profile:", err);
    res.status(500).send("Server error");
  }
});

// Upload profile picture
router.post(
  "/upload-profile-pic",
  isLoggedIn,
  upload.single("image"),
  async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: "No image file provided" });
      }

      const result = await uploadOnCloudinary(req.file.path);
      if (!result || !result.secure_url) {
        throw new Error("Cloudinary upload failed");
      }

      const user = await userModel.findById(req.user._id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      user.profilePic = result.secure_url;
      await user.save();

      console.log("Profile picture updated:", result.secure_url);

      if (fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log("Local file deleted:", req.file.path);
      }

      res.status(200).json({ profilePicUrl: result.secure_url });
    } catch (error) {
      console.error("Error uploading profile picture:", error);
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
        console.log("Local file deleted on error:", req.file.path);
      }
      res.status(500).json({ error: error.message });
    }
  }
);
// Create Post
router.post(
  "/createpost",
  isLoggedIn,
  upload.single("postImage"),
  async (req, res) => {
    try {
      const user = await userModel.findOne({
        username: req.session.passport.user,
      });

      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }

      let imageUrl = null;
      if (req.file) {
        const cloudinaryResponse = await uploadOnCloudinary(req.file.path);
        if (!cloudinaryResponse) {
          throw new Error("Failed to upload to Cloudinary");
        }
        imageUrl = cloudinaryResponse.secure_url;
        fs.unlinkSync(req.file.path); // Clean up local file
      } else {
        // Handle case where no file is uploaded (optional)
        return res.redirect("/add?error=No file uploaded");
      }

      const post = await postModel.create({
        user: user._id,
        title: req.body.title,
        description: req.body.description,
        image: imageUrl || "default.jpg", // Works for both images and videos
        likes: [],
        comments: [],
      });

      user.posts.push(post._id);
      await user.save();

      io.emit("newPost", { post });

      res.redirect("/profile");
    } catch (error) {
      console.error("Error creating post:", error);
      // Handle Multer file type errors or other issues
      if (
        error.message ===
        "Only images (JPEG, PNG, GIF) and videos (MP4, WebM, OGG) are allowed"
      ) {
        return res.redirect("/add?error=Unsupported file type");
      }
      if (req.file && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path); // Clean up on error
      }
      res.redirect("/profile?error=Failed to create post");
    }
  }
);

// Add new post page
router.get("/add", isLoggedIn, (req, res) => {
  res.render("add", { nav: true });
});

// Like/Unlike Post (With Real-Time Update)
router.post("/like/:id", isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    const userId = user._id.toString();
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    req.app
      .get("io")
      .emit("likeUpdate", { postId: post._id, likes: post.likes.length });

    res.json({ success: true, likes: post.likes.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Comment on Post (With Real-Time Update)
router.post("/comment/:id", isLoggedIn, async (req, res) => {
  try {
    const post = await postModel.findById(req.params.id);
    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Post not found" });
    }

    const user = await userModel.findOne({
      username: req.session.passport.user,
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "User not found" });
    }

    if (!req.body.comment.trim()) {
      return res
        .status(400)
        .json({ success: false, message: "Comment cannot be empty" });
    }

    const newComment = {
      user: user._id,
      text: req.body.comment,
      createdAt: new Date(),
    };

    post.comments.push(newComment);
    await post.save();

    const populatedPost = await postModel
      .findById(post._id)
      .populate("comments.user", "username profilePic");
    const populatedComment =
      populatedPost.comments[populatedPost.comments.length - 1];

    req.app.get("io").emit("commentUpdate", {
      postId: post._id,
      comment: {
        _id: populatedComment._id,
        user: {
          _id: populatedComment.user._id,
          username: populatedComment.user.username,
          profilePic: populatedComment.user.profilePic || null,
        },
        text: populatedComment.text,
        createdAt: populatedComment.createdAt,
      },
    });

    res.json({ success: true, comment: populatedComment });
  } catch (err) {
    console.error("Error in comment route:", err);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Delete Comment Route
router.delete("/comment/:commentId", async (req, res) => {
  try {
    const commentId = req.params.commentId;

    const post = await postModel.findOneAndUpdate(
      { "comments._id": commentId },
      { $pull: { comments: { _id: commentId } } },
      { new: true }
    );

    if (!post) {
      return res
        .status(404)
        .json({ success: false, message: "Comment not found" });
    }

    res.json({ success: true, message: "Comment deleted" });

    req.app.get("io").emit("commentDeleted", { postId: post._id, commentId });
  } catch (error) {
    console.error("Error deleting comment:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Follow a User
router.post("/follow/:id", isLoggedIn, async (req, res) => {
  try {
    const userToFollow = await userModel.findById(req.params.id);
    const currentUser = await userModel.findById(req.user.id.toString());

    if (!userToFollow || !currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    if (!currentUser.following.includes(userToFollow._id)) {
      currentUser.following.push(userToFollow._id);
      userToFollow.followers.push(currentUser._id);
      await currentUser.save();
      await userToFollow.save();
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Unfollow a User
router.post("/unfollow/:id", isLoggedIn, async (req, res) => {
  try {
    const userToUnfollow = await userModel.findById(req.params.id);
    const currentUser = await userModel.findById(req.user.id.toString());

    if (!userToUnfollow || !currentUser) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    currentUser.following = currentUser.following.filter(
      (id) => id.toString() !== userToUnfollow._id.toString()
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Get Followers List
router.get("/user/:id/followers/list", async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .populate("followers", "username profilePic");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json(user.followers); // Return JSON array of followers
  } catch (error) {
    console.error("Followers list error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Get Following List
router.get("/user/:id/following/list", async (req, res) => {
  try {
    const user = await userModel
      .findById(req.params.id)
      .populate("following", "username profilePic");
    if (!user) {
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }
    res.json(user.following); // Return JSON array of following
  } catch (error) {
    console.error("Following list error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Register & Login Routes
router.get("/register", (req, res) => {
  console.log("GET /register accessed");
  res.render("register", { nav: false });
});

router.post("/register", async (req, res) => {
  console.log("POST /register:", req.body);
  const { username, email, password, name } = req.body;
  try {
    const existingUsername = await userModel.findOne({ username });
    if (existingUsername) {
      console.log("Username taken:", username);
      return res
        .status(400)
        .json({ success: false, message: "Username already taken" });
    }
    const existingEmail = await userModel.findOne({ email });
    if (existingEmail) {
      console.log("Email taken:", email);
      return res
        .status(400)
        .json({ success: false, message: "Email already registered" });
    }
    const data = new userModel({ username, email, name });
    await userModel.register(data, password);
    passport.authenticate("local")(req, res, async () => {
      console.log("New user profilePic:", data.profilePic); // Debug
      console.log("Registration successful:", username);

      // Send welcome email
      try {
        await sendWelcomeEmail(email, username);
      } catch (emailError) {
        console.error("Email sending error:", emailError);
        // Don’t fail registration if email fails
      }

      res
        .status(201)
        .json({ success: true, message: "Registration successful" });
    });
  } catch (error) {
    console.error("Registration error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

router.post("/login", (req, res, next) => {
  console.log("POST /login:", req.body);
  passport.authenticate("local", (err, user, info) => {
    if (err) {
      console.error("Login error:", err);
      return res.status(500).json({ success: false, message: "Server error" });
    }
    if (!user) {
      console.log("Login failed: Invalid credentials");
      return res
        .status(400)
        .json({ success: false, message: "Invalid email or password" });
    }
    req.logIn(user, (err) => {
      if (err) {
        console.error("Login session error:", err);
        return res
          .status(500)
          .json({ success: false, message: "Server error" });
      }
      console.log("Login successful:", user.username);
      res.status(200).json({ success: true, message: "Login successful" });
    });
  })(req, res, next);
});

router.get("/logout", (req, res, next) => {
  req.logout((err) => {
    if (err) return next(err);
    res.redirect("/");
  });
});

// Forgot Password

// Email transporter setup (replace with your SMTP details)

// Forgot Password Request
router.get("/forgot-password", (req, res) => {
  res.render("forgot-password", { nav: false });
});

router.post("/forgot-password", async (req, res) => {
  try {
    const { identifier } = req.body;
    console.log("Forgot password request for:", identifier);
    const user = await userModel.findOne({
      $or: [{ email: identifier }, { username: identifier }],
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Username or email not registered" });
    }

    // Generate reset token
    const resetToken = crypto.randomBytes(20).toString("hex");
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = Date.now() + 3600000; // 1 hour
    await user.save();

    // Send reset email
    const resetUrl = `https://inspira-ggqm.onrender.com/users/reset-password/${resetToken}`;
    await sendPasswordResetRequest(user.email, resetUrl);

    res.status(200).json({
      success: true,
      message: "Password reset link sent to your registered email",
    });
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});

// Reset Password Form
router.get("/reset-password/:token", async (req, res) => {
  try {
    const user = await userModel.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res.status(400).send("Invalid or expired reset link");
    }
    res.render("reset-password", { token: req.params.token, nav: false });
  } catch (error) {
    console.error("Reset password GET error:", error);
    res.status(500).send("Server error");
  }
});

// Handle Password Reset
router.post("/reset-password/:token", async (req, res) => {
  try {
    const { password } = req.body;
    console.log("Reset password attempt for token:", req.params.token);
    const user = await userModel.findOne({
      resetPasswordToken: req.params.token,
      resetPasswordExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ success: false, message: "Invalid or expired reset link" });
    }
    await user.setPassword(password);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();
    console.log("New password hash:", user.password); // Debug hash
    console.log("Password reset successful for:", user.username);

    // Send confirmation email
    await sendPasswordResetConfirmation(user.email, user.username);

    // Force logout to clear session
    req.logout((err) => {
      if (err) console.error("Logout error:", err);
    });

    res.status(200).json({
      success: true,
      message: "Password reset successful. Please log in.",
    });
  } catch (error) {
    console.error("Reset password POST error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
});
// Middleware to check if the user is logged in
function isLoggedIn(req, res, next) {
  if (req.isAuthenticated()) return next();
  res.redirect("/");
}

module.exports = router;
