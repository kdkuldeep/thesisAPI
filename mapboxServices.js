// Mapbox service clients
const mbxClient = require("@mapbox/mapbox-sdk");
const mbxMatrix = require("@mapbox/mapbox-sdk/services/matrix");

const baseClient = mbxClient({ accessToken: process.env.MAPBOX_TOKEN });
const matrixService = mbxMatrix(baseClient);

module.exports = {
  matrixService
};
