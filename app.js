require("dotenv").config();
const createError = require("http-errors");
const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const { Server } = require("socket.io");
const expressSession = require("express-session");
const passport = require("passport");
const indexRouter = require("./routes/index");
const userModel = require("./routes/users");

const app = express();
const server = require("http").createServer(app);
const io = new Server(server);

// View engine setup
app.set("views", path.join(__dirname, "views"));
app.set("view engine", "ejs");

app.use(
  expressSession({
    resave: false,
    saveUninitialized: false,
    secret: "hola bhola hola bhola",
  })
);

passport.serializeUser(userModel.serializeUser());
passport.deserializeUser(userModel.deserializeUser());
app.use(passport.initialize());
app.use(passport.session());

// Log all incoming requests
app.use((req, res, next) => {
  console.log(`Request: ${req.method} ${req.url}`);
  next();
});

app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "public")));

app.set("io", io);

// Routes
app.use("/", indexRouter);
app.use("/users", indexRouter); // Fixed to indexRouter

// Socket.io event handling
io.on("connection", (socket) => {
  console.log("A user connected");
  socket.on("newComment", (data) => io.emit("updateComments", data));
  socket.on("newLike", (data) => io.emit("updateLikes", data));
  socket.on("disconnect", () => console.log("User disconnected"));
});

// Catch 404 and forward to error handler
app.use((req, res, next) => {
  console.log("404 reached for:", req.url);
  next(createError(404));
});

// Error handler
app.use((err, req, res, next) => {
  console.log("Error:", err.message);
  res.locals.message = err.message;
  res.locals.error = req.app.get("env") === "development" ? err : {};
  res.status(err.status || 500);
  res.render("error");
});

module.exports = { app, server };
