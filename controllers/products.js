const fetch = db => (req, res) => {
  switch (req.user.role) {
    case "manager":
      const { email } = req.user;
      db
        .select("company_id")
        .from("managers")
        .where({ email })
        .first()
        .then(data => {
          const { company_id } = data;
          db
            .select("product_id", "name", "price", "type")
            .from("products")
            .where({ company_id })
            .then(data => res.json({ products: data }));
        });
      break;
  }
};

module.exports = {
  fetch
};
