const uuid = require("uuid");
const { validationResult } = require("express-validator");
const mongoose = require("mongoose");
const fs = require('fs');

const HttpError = require("../models/http-error");
const Place = require("../models/place");
const User = require("../models/user");

const getPlaceById = async (req, res, next) => {
  const placeId = req.params.placeId;
  let place;
  try {
    place = await Place.findById(placeId);
  } catch (err) {
    const error = new HttpError("Something went wrong", 500);
    return next(error);
  }

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

  res.json({ place: place.toObject({ getters: true }) }); // {place : place} // {getters : true} this removes the underscore infront of id property ==> _id ==> id
};

const getPlaceByUserId = async (req, res, next) => {
  const userId = req.params.userId;
  //   let places;
  let userWithPlaces;
  try {
    // places = await Place.find({ creator: userId });
    userWithPlaces = await User.findById(userId).populate("places");
  } catch (err) {
    const error = new HttpError(
      "Something went wrong while retrieving place",
      500
    );
    return next(error);
  }

  //if(!places.length)
  if (!userWithPlaces || !userWithPlaces.places) {
    const error = new HttpError(
      "Could not find a places for the given user id",
      404
    );
    // throw error; // this will call error handling middlware only for synchronous code ==>
    //EARLIER THIS WAS SYNCHRONOUS CODE. NOW WE HAVE ADDED ASYNC KEYWORD TO FUNCTION ITSELF
    //SO EVERYTHING INSIDE THIS FUNCTION BECOMES ASYNCHRONOUS. SO WE NEED TO USE RETURN NEXT(ERROR)
    return next(error);
  }

  res.json({
    places: userWithPlaces.places.map((place) =>
      place.toObject({ getters: true })
    ), // {getters : true} this removes the underscore infront of id property ==> _id ==> id
  });
};

const createPlace = async (req, res, next) => {
  const errors = validationResult(req);
  console.log(errors.array());
  if (!errors.isEmpty()) {
    let error = errors.array()[0];
    console.log(error.msg);
    throw new HttpError(error.msg, 422);
  }

  const { title, description, address, creator } = req.body;
  // const placeId = "p" + places.length; // uuid() ==> this will generate dynamic id for us
  const coordinates = {
    lat: 18.9388528,
    lng: 72.8235753
  };
  const createdPlace = new Place({
    title,
    description,
    address,
    location: coordinates,
    image: req.file.path,
    creator,
  });

  let user;

  try {
    user = await User.findById(creator);
  } catch (error) {
    const err = new HttpError("Creating place failed , please try again", 500);
    return next(err);
  }

  if (!user) {
    const err = new HttpError("We could not find user for provided id", 404);
    return next(err);
  }
  try {
    // await createdPlace.save(); // If we want to save only this created place this this code is ok

    // however we need to add this place in places property in user. Also we want to save this created place as well.
    // IF ANY ONE OPERATION FAILS THEN WE NEED TO ROLLBACK OTHER OPERATIONS. SO WE NEED TO USE SESSION HERE

    const session = await mongoose.startSession();
    session.startTransaction();
    await createdPlace.save({ session: session });

    user.places.push(createdPlace);
    await user.save({ session: session });

    session.commitTransaction(); // Only at this point changes are really saved in database.
    // If anything goes wrong in above steps then all above changes will be rolled back automatically
  } catch (err) {
    console.log(err);
    // As this is an asynchronous task, if we throw an error here then it will not react error handling middleware
    // so we need to call next here
    const error = new HttpError(
      "Error while creating place , Please try again later",
      500
    );
    return next(error);
  }
  res.status(201).json({ place: createdPlace });
};

const updatePlace = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    let error = errors.array()[0];
    console.log(error.msg);
    throw new HttpError(error.msg, 422);
  }

  const placeId = req.params.placeId;
  const { title, description } = req.body;
  let placeToUpdate;
  try {
    placeToUpdate = await Place.findById(placeId);
  } catch (error) {
    const err = new HttpError("Could not find a place for given id", 404);
    return next(err);
  }
  placeToUpdate.title = title;
  placeToUpdate.description = description;
  try {
    await placeToUpdate.save();
  } catch (error) {
    console.log(error);
    const err = new HttpError(
      "Something went wrong while updating the place",
      500
    );
    return next(err);
  }

  res.json({
    message: "places updated successfully",
    place: placeToUpdate.toObject({ getters: true }), // {getters : true} this removes the underscore infront of id property ==> _id ==> id
  });
};

const deletePlace = async (req, res, next) => {
  const placeId = req.params.placeId;

  let place;

  try {
    place = await Place.findById(placeId).populate("creator"); // populate method would work only if we have connection internally
  } catch (error) {
    console.log(error);
    const err = new HttpError("Could not find place to delete", 404);
    return next(err);
  }

  if (!place) {
    const err = new HttpError("Could not find place to delete", 404);
    return next(err);
  }

  const imagePath = place.image;

  try {
    // await place.remove();

    // go to create place to read about this session and transaction

    const session = await mongoose.startSession();
    session.startTransaction();
    await place.remove({ session: session });

    place.creator.places.pull(place); // we can use creator on place becuase we are polulating it above;
    // We can use pull to remove this place from user

    await place.creator.save({ session: session });

    await session.commitTransaction(); // go to create place to read about this session and transaction
  } catch (error) {
    console.log(error);
    const err = new HttpError(
      "Something went wrong while deleting a place",
      500
    );
    return next(err);
  }
  fs.unlink(imagePath, err => {
    console.log(err);
  })
  res.json({ message: "Place deleted succefully" });
};

module.exports = {
  getPlaceById,
  getPlaceByUserId,
  createPlace,
  updatePlace,
  deletePlace,
};
