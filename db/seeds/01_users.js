const faker = require("faker");
const bcrypt = require("bcrypt");

const googleMapsClient = require("@google/maps").createClient({
  key: process.env.GOOGLE_MAPS_TOKEN,
  Promise
});

const roles = require("../../roles");

const RADIUS_CUST = 2000; //  Radius in meters
const RADIUS_COMP = 1000; //  Radius in meters
const IOANNINA_CENTER = { latitude: 39.665, longitude: 20.8537 };

const NUMBER_OF_COMPANIES = 2;
const DRIVERS_PER_COMPANY = 6;
const NUMBER_OF_CUSTOMERS = 20;

const PASSWORD_STRING = "test";

//  https://gis.stackexchange.com/questions/25877/generating-random-locations-nearby
const generateRandomCoords = (centerCoords, radius) => {
  const { latitude, longitude } = centerCoords;

  const rd = radius / 111300; // Convert Radius from meters to degrees.

  const u = Math.random();
  const v = Math.random();

  const w = rd * Math.sqrt(u);
  const t = 2 * Math.PI * v;
  const newLng = w * Math.cos(t);
  const newLat = w * Math.sin(t);

  const newLng2 = newLng / Math.cos(latitude);

  return { latitude: latitude + newLat, longitude: longitude + newLng2 };
};

const generateLocationData = (centerCoords, radious) => {
  const { latitude, longitude } = generateRandomCoords(centerCoords, radious);
  return googleMapsClient
    .reverseGeocode({
      latlng: { latitude, longitude },
      language: "en"
    })
    .asPromise()
    .then(response => {
      // console.log(response.json.results[0]);
      const location = {};
      const addressComponents = response.json.results[0].address_components;
      const coords = response.json.results[0].geometry.location;
      addressComponents.forEach(component => {
        // console.log(component.types);

        switch (component.types[0]) {
          case "street_number": // FIXME: unnamed road
            location.number = component.long_name;
            break;
          case "route":
            location.street = component.long_name;
            break;
          case "country":
            location.country = component.long_name;
            break;
          case "locality":
            location.city = component.long_name;
            break;
          case "administrative_area_level_3":
            location.city = component.long_name;
            break;
          default:
            break;
        }
      });
      location.latitude = coords.lat;
      location.longitude = coords.lng;
      // console.log(location);
      if (!location.street) location.street = "Unknown"; // FIXME:
      if (!location.number) location.number = "1"; // FIXME:
      return location;
    });
};

const insertUser = (knex, roleString, roleNo, counter) =>
  knex("users")
    .insert({
      email: `${roleString + counter}@test.com`,
      password: bcrypt.hashSync(PASSWORD_STRING, 10),
      username: `${roleString + counter}`,
      first_name: faker.name.firstName(),
      last_name: faker.name.lastName(),
      role: roleNo
    })
    .returning("user_id");

const insertCompany = (knex, counter) =>
  generateLocationData(IOANNINA_CENTER, RADIUS_COMP).then(location =>
    knex("companies")
      .insert({
        company_name: `company${counter}`,
        country: location.country,
        city: location.city,
        street: location.street,
        number: location.number,
        latitude: location.latitude,
        longitude: location.longitude
      })
      .returning("company_id")
  );

const insertManager = (knex, counter) =>
  Promise.all([
    insertUser(knex, "manager", roles.MANAGER, counter),
    insertCompany(knex, counter)
  ]).then(([userData, companyData]) =>
    knex("managers")
      .insert({ user_id: userData[0], company_id: companyData[0] })
      .returning("company_id")
  );

const insertDriver = (knex, companyData, outerCounter, innerCounter) =>
  insertUser(knex, `driver${outerCounter}_`, roles.DRIVER, innerCounter).then(
    userData =>
      knex("drivers").insert({
        user_id: userData[0],
        company_id: companyData[0]
      })
  );

const insertCustomer = (knex, counter) =>
  Promise.all([
    insertUser(knex, "customer", roles.CUSTOMER, counter),
    generateLocationData(IOANNINA_CENTER, RADIUS_CUST)
  ]).then(([userData, location]) =>
    knex("customers")
      .insert({
        user_id: userData[0],
        country: location.country,
        city: location.city,
        street: location.street,
        number: location.number,
        latitude: location.latitude,
        longitude: location.longitude
      })
      .returning("user_id")
  );

exports.seed = knex =>
  // Deletes ALL existing entries
  knex("users")
    .del()
    .then(() => knex("companies").del())
    .then(() => {
      const promises = [];
      // Insert managers,companies and drivers
      for (
        let companyCounter = 1;
        companyCounter <= NUMBER_OF_COMPANIES;
        companyCounter += 1
      ) {
        promises.push(
          insertManager(knex, companyCounter).then(companyData => {
            const innerPromises = [];
            for (
              let driverCounter = 1;
              driverCounter <= DRIVERS_PER_COMPANY;
              driverCounter += 1
            ) {
              innerPromises.push(
                insertDriver(knex, companyData, companyCounter, driverCounter)
              );
            }
            return Promise.all(innerPromises);
          })
        );
      }

      // Insert customers
      for (
        let customerCounter = 1;
        customerCounter <= NUMBER_OF_CUSTOMERS;
        customerCounter += 1
      ) {
        promises.push(insertCustomer(knex, customerCounter));
      }

      return Promise.all(promises);
    });
