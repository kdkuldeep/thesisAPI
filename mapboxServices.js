// Mapbox service clients
const mbxClient = require("@mapbox/mapbox-sdk");
const mbxMatrix = require("@mapbox/mapbox-sdk/services/matrix");
const mbxDirections = require("@mapbox/mapbox-sdk/services/directions");

const baseClient = mbxClient({ accessToken: process.env.MAPBOX_TOKEN });
const matrixService = mbxMatrix(baseClient);
const directionsService = mbxDirections(baseClient);

module.exports = {
  matrixService,
  directionsService
};
