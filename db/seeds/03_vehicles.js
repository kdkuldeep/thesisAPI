const faker = require("faker");

const MIN_CAPACITY = 500000;
const MAX_CAPACITY = 1000000;

const generateLicencePlate = () => {
  const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

  return `${faker.random.arrayElement([...chars]) +
    faker.random.arrayElement([...chars]) +
    faker.random.arrayElement([...chars]) +
    faker.random.number({ min: 0, max: 9 }) +
    faker.random.number({ min: 0, max: 9 }) +
    faker.random.number({ min: 0, max: 9 }) +
    faker.random.number({ min: 0, max: 9 })}`;
};

const insertVehicle = (knex, company_id, driver_id) =>
  knex("vehicles").insert({
    company_id,
    driver_id,
    licence_plate: generateLicencePlate(),
    capacity: faker.random.number({ min: MIN_CAPACITY, max: MAX_CAPACITY })
  });

exports.seed = knex =>
  // Deletes ALL existing entries
  knex("vehicles")
    .del()
    .then(() =>
      // Insert one vehicle for every driver of each company
      knex("companies")
        .pluck("company_id")
        .map(company_id =>
          knex("drivers")
            .pluck("user_id")
            .where({ company_id })
            .map(driver_id => insertVehicle(knex, company_id, driver_id))
            .then(promises => Promise.all(promises))
        )
    );
