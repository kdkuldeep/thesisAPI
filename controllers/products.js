const omit = require("lodash/omit");

const fetchProducts = db => (req, res) => {
  switch (req.user.role) {
    case "manager":
      const { company_id } = req.user;
      db.select("product_id", "name", "price", "type")
        .from("products")
        .where({ company_id })
        .then(data => res.json({ products: data }));
      break;
    case "customer":
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
            res.json({ products: products });
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
            res.json({ products: products });
          });
      }
  }
};

const addProduct = db => (req, res) => {
  const { name, price, type } = req.body.data;
  const { company_id } = req.user;

  // TODO: add more checks
  if (!name || !price) {
    return res.status(400).json("incorrect form submission");
  }

  db.insert({ company_id, name, price, type })
    .into("products")
    .returning("product_id")
    .then(ids => res.json({ product_id: ids[0], name, price, type }))
    .catch(err => {
      console.log(err);
      res.status(400).json({
        errors: {
          global: "You already have a product with the same name"
        }
      });
    });
};

const editProduct = db => (req, res) => {
  const { product_id, name, price, type } = req.body.data;
  const { company_id } = req.user;

  db.select("company_id")
    .from("products")
    .where({ product_id })
    .first()
    .then(productData => {
      const productCompanyId = productData.company_id;
      if (company_id === productCompanyId) {
        db("products")
          .where({ product_id })
          .update({ name, price, type })
          .then(() => res.json({ product_id, name, price, type }))
          .catch(err => {
            res.status(500).json({
              errors: {
                global: "You already have a product with the same name"
              }
            });
          });
      } else {
        res.status(401).json({
          errors: {
            global: "unauthorized access"
          }
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        errors: {
          global: "something went wrong when updating"
        }
      });
    });
};

const deleteProduct = db => (req, res) => {
  const product_id = req.params.id;

  const { company_id } = req.user;

  db.select("company_id")
    .from("products")
    .where({ product_id })
    .first()
    .then(productData => {
      const productCompanyId = productData.company_id;
      if (company_id === productCompanyId) {
        db("products")
          .where({ product_id })
          .del()
          .then(() => res.json({ product_id }))
          .catch(err => {
            res.status(500).json({
              errors: {
                global: "Something went wrong. No product exists"
              }
            });
          });
      } else {
        res.status(401).json({
          errors: {
            global: "unauthorized access"
          }
        });
      }
    })
    .catch(err => {
      res.status(500).json({
        errors: {
          global: "something went wrong when deleting"
        }
      });
    });
};

module.exports = {
  fetchProducts,
  addProduct,
  editProduct,
  deleteProduct
};
