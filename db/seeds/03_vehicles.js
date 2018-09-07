const faker = require("faker");

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
    capacity: faker.random.number({ min: 50, max: 200 })
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
