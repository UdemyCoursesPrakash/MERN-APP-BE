const express = require("express");

const { check } = require("express-validator");

const placesController = require("../controllers/places-ctrl");

const routes = express.Router();

routes.get("/:placeId", placesController.getPlaceById);

routes.get("/user/:userId", placesController.getPlaceByUserId);

routes.post(
  "/",
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
