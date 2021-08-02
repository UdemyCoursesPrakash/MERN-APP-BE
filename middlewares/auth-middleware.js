const HttpError = require('../models/http-error');
const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {

    if (req.method == 'OPTIONS') {
        return next();
    }

    //in CORS we have allowd authorization header so we can expect those headers
    // also headers are case insencitive
    try {
        const token = req.headers.authorization.split(' ')[1];   // Authorization : Bearer TOKEN

        if (!token) {
            throw new Error('Authentication failed');
        }
        const decodedToken = jwt.verify(token, 'secretkey');
        req.userData = { userId: decodedToken.userId }; // this userid will be there in the request till request ends(ie. till we send response back)
        next();
    } catch (err) {
        const error = new HttpError('Authentication failed', 401);
        return next(error);  // here return statement is important, so that it will not travel to the next middlewars in the line
    }

}