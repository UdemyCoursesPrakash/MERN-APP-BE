const uuid = require("uuid").v4;
const { validationResult } = require("express-validator");
const users = require("../dummyData/users").users;
const HttpError = require("../models/http-error");

const getUsers = (req, res, next) => {
  res.json({
    data: users,
  });
};

const signup = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let error = errors.array()[0].msg;
    throw new HttpError(error, 422);
  }

  const { name, email, password } = req.body;

  const hashUser = users.find((user) => user.email == email);
  if (hashUser) {
    throw new HttpError("Could not create user, email already exists", 422);
  }

  const createdUser = {
    id: uuid(),
    name,
    email,
    password,
  };

  users.push(createdUser);

  res.status(201).json({ user: createdUser });
};

const login = (req, res, next) => {
  const { email, password } = req.body;

  const identifiedUser = users.find((user) => {
    return user.email === email;
  });

  if (!identifiedUser || identifiedUser.password != password) {
    const error = new HttpError(
      "Could not identify user , credential seems to be wrong",
      401
    );
    throw error;
  }

  res.json({ message: "Logged In" });
};

module.exports = {
  getUsers,
  signup,
  login,
};
