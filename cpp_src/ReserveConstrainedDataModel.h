#ifndef RESERVE_CONSTRAINED_DATAMODEL_H
#define RESERVE_CONSTRAINED_DATAMODEL_H

#include "DataModel.h"

class ProductDemand
{
private:
  std::vector<int64> _demand; // holds the demand of specific product in each location (numberOfNodes x 1)

public:
  ProductDemand(std::vector<int64> demand);
  std::vector<int64> demand();
  int64 getOrderDemand(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};

class ReserveConstrainedDataModel : public DataModel
{
private:
  int _numberOfProducts;
  std::vector<RoutingModel::NodeIndex> _starts;
  std::vector<RoutingModel::NodeIndex> _ends;
  std::vector<ProductDemand> _demands;       // Stores the ProductDemand objects for each product (numberOfProducts x 1)
  std::vector<std::vector<int64>> _reserves; // Stores the reserve of each product in every vehicle (numberOfProducts x numberOfVehicles)

public:
  ReserveConstrainedDataModel(int numberOfVehicles,
                              int numberOfNodes,
                              int numberOfProducts,
                              std::vector<int64> startingLocations,
                              std::vector<std::vector<int64>> demands,
                              std::vector<std::vector<int64>> reserves,
                              std::vector<std::vector<int64>> durations);
  int numberOfProducts();
  std::vector<RoutingModel::NodeIndex> starts();
  std::vector<RoutingModel::NodeIndex> ends();
  std::vector<ProductDemand> demands();
  std::vector<std::vector<int64>> reserves();
  std::vector<int64> getProductReserves(int product_index);
  ProductDemand getProductDemand(int product_index);
};

#endif