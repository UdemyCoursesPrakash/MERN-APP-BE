const express = require("express");
const fileUpload = require("../middlewares/file-upload");
const { check } = require("express-validator");

const placesController = require("../controllers/places-ctrl");
const checkAuth = require('../middlewares/auth-middleware');

const routes = express.Router();

routes.get("/:placeId", placesController.getPlaceById);

routes.get("/user/:userId", placesController.getPlaceByUserId);

//**************NOTE **********************

// IF WE ADD MIDDLEWARE HERE THEN FIRST TWO ROUTES WILL NOT GO THROUGH THIS MIDDLEWARE
// E.G. IF WE ADD routes.use(authMiddleware) THEN FIRST TWO ROUTES WILL BE OPEN FOR ALL THE USERS
// HOWEVER FOLLOWING ROUTES WILL BE ACCESSIBLE FOR ONLY LOGED IN USERS

//**************NOTE **********************

routes.use(checkAuth);

routes.post(
  "/",
  fileUpload.single('image'),
  [
    check("title").notEmpty().withMessage("Title is required"),
    check("description")
      .isLength({ min: 5 })
      .withMessage("Description should be atleast 5 character"),
    check("address").not().isEmpty().withMessage("Address is required"),
  ],
  placesController.createPlace
);

routes.patch(
  "/:placeId",
  [
    check("title").notEmpty().withMessage("Title is required"),
    check("description")
      .isLength({ min: 5 })
      .withMessage("Description should be atleast 5 character"),
  ],
  placesController.updatePlace
);

routes.delete("/:placeId", placesController.deletePlace);

module.exports = routes;
