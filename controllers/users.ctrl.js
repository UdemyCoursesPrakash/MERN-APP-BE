const uuid = require("uuid").v4;
const { validationResult } = require("express-validator");

const HttpError = require("../models/http-error");
const User = require("../models/user");

const getUsers = async (req, res, next) => {
  let users;
  try {
    users = await User.find({}, "-password");
  } catch (error) {
    const err = new HttpError("Fetching users failed , please try later", 500);
    return next(err);
  }

  res.json({
    users: users.map((user) => user.toObject({ getters: true })),
  });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let error = errors.array()[0].msg;
    return next(new HttpError(error, 422));
  }

  const { name, email, password, places } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    console.log(error);
    const err = new HttpError("Signup failed , plese try later", 500);
    return next(err);
  }

  if (existingUser) {
    const err = new HttpError(
      "User exists already , please login instead",
      422
    );
    return next(err);
  }

  const createdUser = new User({
    name,
    email,
    password,
    image: req.file.path,
    places: [],
  });

  try {
    await createdUser.save();
  } catch (error) {
    const err = new HttpError(
      "Failed while sigining up , please login instead",
      500
    );
    return next(err);
  }

  res.status(201).json({ user: createdUser.toObject({ getters: true }) }); // {getters : true} this removes the underscore infront of id property ==> _id ==> id
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("Login failed , plese try later", 500);
    next(err);
  }

  if (!existingUser || existingUser.password != password) {
    const err = new HttpError(
      "Invalid credentials, could not let log oyu in",
      401
    );
    return next(err);
  }

  res.json({ message: "Logged In", user: existingUser.toObject({ getters: true }) });
};

module.exports = {
  getUsers,
  signup,
  login,
};
