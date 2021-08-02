const uuid = require("uuid").v4;
const { validationResult } = require("express-validator");
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

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

  let hashedPassword;
  try {
    hashedPassword = await bcrypt.hash(password, 12);
  } catch (err) {
    const error = new Error('Could not create a user, please try later', 500);
    return next(error);
  }

  const createdUser = new User({
    name,
    email,
    password: hashedPassword,
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
  let token;
  try {
    token = jwt.sign({ userId: createdUser.id, email: createdUser.email }, 'secretkey', { expiresIn: '1h' })
  } catch (error) {
    const err = new HttpError(
      "Signing up failed , please try later",
      500
    );
    return next(err);
  }

  // change it later, don't send whole user object , just send user id , email and token
  res.status(201).json({ userId: createdUser.id, token: token }); // {getters : true} this removes the underscore infront of id property ==> _id ==> id
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

  if (!existingUser) {
    const err = new HttpError(
      "Invalid credentials, could not let log oyu in",
      401
    );
    return next(err);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    const err = new HttpError(
      "Could not log you in , please check your credentials and try again",
      500
    );
    return next(err);
  }

  if (!isValidPassword) {
    const err = new HttpError(
      "Invalid credentials, could not let log oyu in",
      401
    );
    return next(err);
  }

  let token;
  try {
    token = jwt.sign({ userId: existingUser.id, email: existingUser.email }, 'secretkey', { expiresIn: '1h' })
  } catch (error) {
    const err = new HttpError(
      "Signing up failed , please try later",
      500
    );
    return next(err);
  }

  res.json({ userId: existingUser.id, token: token }); // change it later, don't send whole user object , just send user id , email and token
};

module.exports = {
  getUsers,
  signup,
  login,
};
