const omit = require("lodash/omit");

const db = require("../../../db/knex");

const ApplicationError = require("../../../errors/ApplicationError");

const fetchProducts = (req, res, next) => {
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
      })
      .catch(err => {
        console.log(err);
        return next(new ApplicationError());
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
      default:
        return next(new ApplicationError("Incorrect query parameters", 400));
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
      })
      .catch(err => {
        console.log(err);
        return next(new ApplicationError());
      });
  }
};

const fetchTypes = query =>
  db
    .select("type")
    .from("products")
    .where("type", "ilike", `%${query}%`)
    .distinct("type")
    .pluck("type");

const fetchCompanies = query =>
  db
    .select("company_name")
    .from("companies")
    .where("company_name", "ilike", `%${query}%`)
    .distinct("company_name")
    .pluck("company_name");

const fetchLocations = query =>
  db
    .select("city")
    .from("companies")
    .distinct("city")
    .where("city", "ilike", `%${query}%`)
    .pluck("city");

// FIXME: Find better way to use Promise return value
const fetchOptions = (req, res, next) => {
  const query = req.query.q;

  Promise.all([fetchTypes(query), fetchCompanies(query), fetchLocations(query)])
    .then(([types, companies, locations]) =>
      res.json({ types, companies, locations })
    )
    .catch(err => {
      console.log(err);
      return next(new ApplicationError());
    });
};

module.exports = {
  fetchProducts,
  fetchOptions
};
