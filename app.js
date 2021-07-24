const express = require("express");

const places = require("./dummyData/places");
const HttpError = require("./models/http-error");
const placesRoutes = require("./routes/places-routes");
const usersRoutes = require("./routes/users-routes");
// const usersRoutes = require("./routes/users-routes");

const app = express();
app.use(express.json());

app.use("/api/places", placesRoutes); // /api/places/....
app.use("/api/users", usersRoutes);

app.use((req, res, next) => {
  const error = new HttpError("Could not find this route", 404);
  throw error;
});

app.use((error, req, res, next) => {
  // this will only excutes if there is any error thrown by any middleware above
  if (res.headerSent) {
    // check if response has already been sent. If that is the case we just return from here
    return next(error);
  }

  res.status(error.code || 500);
  res.json({ message: error.message || "Internal server error" });
});

app.listen(5000);
