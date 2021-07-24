const { Router } = require("express");

const { check } = require("express-validator");

const userController = require("../controllers/users.ctrl");

const routes = Router();

routes.get("/", userController.getUsers);

routes.post(
  "/signup",
  [
    check("name").not().isEmpty().withMessage("Please enter name"),
    check("email")
      .normalizeEmail() // normalize ==> TEST@email.com ==> test@email.com
      .isEmail()
      .withMessage("Email format is wrong"),
    check("password")
      .isLength({ min: 6 })
      .withMessage("Please enter atleast 6 characters password"),
  ],
  userController.signup
);
routes.post("/login", userController.login);

module.exports = routes;
