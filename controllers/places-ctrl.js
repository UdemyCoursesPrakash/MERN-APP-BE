const uuid = require("uuid");
const { validationResult } = require("express-validator");

let places = require("../dummyData/places");
const HttpError = require("../models/http-error");

const getPlaceById = (req, res, next) => {
  const placeId = req.params.placeId;

  const place = places.find((place) => {
    return place.id === placeId;
  });

  if (!place) {
    const error = new HttpError(
      "Could not find a places for the given place id",
      404
    );
    return next(error); // this will call error handling middlware for both synchronous and asynchronous code

    // we have added return above , because otherwise it will still execute following code after if condition.  There it will thrown an error as
    // Can not set headers after they are sent to the client.
    //so we need to return from here.
  }

  res.json({ place }); // {place : place}
};

const getPlaceByUserId = (req, res, next) => {
  const userId = req.params.userId;

  const place = places.filter((place) => {
    return place.creator === userId;
  });

  if (!place.length) {
    const error = new HttpError(
      "Could not find a places for the given user id",
      404
    );
    throw error; // this will call error handling middlware only for synchronous code
  }

  res.json({ place });
};

const createPlace = (req, res, next) => {
  const errors = validationResult(req);

  if (!errors.isEmpty()) {
    let error = errors.array()[0];
    console.log(error.msg);
    throw new HttpError(error.msg, 422);
  }

  const { title, description, coordinates, address, creator } = req.body;
  const placeId = "p" + places.length; // uuid() ==> this will generate dynamic id for us
  const createdPlace = {
    id: placeId,
    title,
    description,
    location: coordinates,
    address,
    creator,
  };

  places.push(createdPlace);
  res.status(201).json({ place: createdPlace });
};

const updatePlace = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let error = errors.array()[0];
    console.log(error.msg);
    throw new HttpError(error.msg, 422);
  }

  const placeId = req.params.placeId;
  const { title, description } = req.body;

  const placeToUpdate = {
    ...places.find((place) => place.id === placeId),
  }; // we are creating copy of places

  if (!placeToUpdate) {
    const error = new HttpError("Could not find a place for given id", 404);
    throw error;
  }

  const placeIndex = places.findIndex((place) => place.id == placeId);
  placeToUpdate.title = title;
  placeToUpdate.description = description;

  places[placeIndex] = placeToUpdate;
  res.json({ message: "places updated successfully", place: placeToUpdate });
};

const deletePlace = (req, res, next) => {
  const placeId = req.params.placeId;

  const placeToDelete = places.find((place) => place.id === placeId);

  if (!placeToDelete) {
    throw new HttpError("Could not find place to delete", 404);
  }

  places = places.filter((place) => place.id !== placeId);

  res.json({ message: "Place deleted succefully" });
};

module.exports = {
  getPlaceById,
  getPlaceByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};
