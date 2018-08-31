const omit = require("lodash/omit");

const db = require("../../../db/knex");

const fetchProducts = (req, res) => {
  const searchTerm = req.query.term;
  if (req.query.param === "productName") {
    db("products")
      .join("companies", "products.company_id", "=", "companies.company_id")
      .select(
        "product_id",
        "name",
        "price",
        "type",
        "company_name",
        "country",
        "city",
        "street",
        "number"
      )
      .where("name", "ilike", `%${searchTerm}%`)
      .then(data => {
        const products = data.map(product =>
          omit(
            {
              ...product,
              address: `${product.country} ${product.city} 
                ${product.street} ${product.number}`
            },
            ["country", "city", "street", "number"]
          )
        );
        res.json({ products });
      });
  } else {
    let matchingColumn;

    switch (req.query.param) {
      case "type":
        matchingColumn = "type";
        break;
      case "companyName":
        matchingColumn = "company_name";
        break;
      case "location":
        matchingColumn = "city";
        break;
    }

    db("products")
      .join("companies", "products.company_id", "=", "companies.company_id")
      .select(
        "product_id",
        "name",
        "price",
        "type",
        "company_name",
        "country",
        "city",
        "street",
        "number"
      )
      .where(`${matchingColumn}`, "=", `${searchTerm}`)
      .then(data => {
        const products = data.map(product =>
          omit(
            {
              ...product,
              address: `${product.country} ${product.city} 
                  ${product.street} ${product.number}`
            },
            ["country", "city", "street", "number"]
          )
        );
        res.json({ products });
      });
  }
};

const fetchTypes = (query, options) =>
  db
    .select("type")
    .from("products")
    .where("type", "ilike", `%${query}%`)
    .distinct("type")
    .pluck("type")
    .then(data => {
      options.types = data;
    });

const fetchCompanies = (query, options) =>
  db
    .select("company_name")
    .from("companies")
    .where("company_name", "ilike", `%${query}%`)
    .distinct("company_name")
    .pluck("company_name")
    .then(data => {
      options.companies = data;
    });

const fetchLocations = (query, options) =>
  db
    .select("city")
    .from("companies")
    .distinct("city")
    .where("city", "ilike", `%${query}%`)
    .pluck("city")
    .then(data => {
      options.locations = data;
    });

// FIXME: Find better way to use Promise return value
const fetchOptions = (req, res) => {
  const query = req.query.q;
  const options = { types: [], companies: [], locations: [] };

  Promise.all([
    fetchTypes(query, options),
    fetchCompanies(query, options),
    fetchLocations(query, options)
  ]).then(() => res.json(options));
};

module.exports = {
  fetchProducts,
  fetchOptions
};
