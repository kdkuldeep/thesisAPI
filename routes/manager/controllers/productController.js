const db = require("../../../db/knex");

const ApplicationError = require("../../../errors/ApplicationError");

const fetchProducts = (req, res, next) => {
  const { company_id } = req.user;
  db.select("product_id", "name", "price", "type")
    .from("products")
    .where({ company_id })
    .then(data => res.json({ products: data }))
    .catch(next(new ApplicationError()));
};

const addProduct = (req, res, next) => {
  const { name, price, type } = req.validatedData.data;
  const { company_id } = req.user;

  db.insert({ company_id, name, price, type })
    .into("products")
    .returning("product_id")
    .then(ids => res.json({ product_id: ids[0], name, price, type }))
    .catch(err => {
      console.log(err);
      next(
        new ApplicationError(
          "You already have a product with the same name",
          400
        )
      );
    });
};

const editProduct = (req, res, next) => {
  const { product_id, name, price, type } = req.validatedData.data;
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
            console.log(err);
            next(
              new ApplicationError(
                "You already have a product with the same name",
                400
              )
            );
          });
      } else {
        next(new ApplicationError("Unauthorized access", 403));
      }
    })
    .catch(err => {
      console.log(err);
      next(new ApplicationError());
    });
};

const deleteProduct = (req, res, next) => {
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
            console.log(err);
            next(new ApplicationError());
          });
      } else {
        next(new ApplicationError("Unauthorized access", 403));
      }
    })
    .catch(err => {
      console.log(err);
      next(new ApplicationError());
    });
};

module.exports = {
  fetchProducts,
  addProduct,
  editProduct,
  deleteProduct
};
