#ifndef RESERVE_CONSTRAINED_DATAMODEL_H
#define RESERVE_CONSTRAINED_DATAMODEL_H

#include "DataModel.h"

class ProductDemand
{
private:
  std::vector<int64> _demand; // 1d array with demand of specific product in each order location (+ depot , demand = 0)

public:
  ProductDemand(std::vector<int64> demand);
  int64 getDemand(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};

class ReserveConstrainedDataModel : public DataModel
{
private:
  int _numberOfProducts;
  std::vector<RoutingModel::NodeIndex> _starts;
  std::vector<RoutingModel::NodeIndex> _ends;
  std::vector<std::vector<int64>> _demands;  // Stores the demand of each product in every location (numberOfProducts x (numberOfOrders + 1 depot))
  std::vector<std::vector<int64>> _reserves; // Stores the reserve of each product in every vehicle (numberOfProducts x numberOfVehicles)
  std::vector<ProductDemand> _product_demands;

public:
  ReserveConstrainedDataModel(int numberOfVehicles,
                              int numberOfOrders,
                              int numberOfProducts,
                              std::vector<int64> startingLocations,
                              std::vector<std::vector<int64>> demands,
                              std::vector<std::vector<int64>> reserves,
                              std::vector<std::vector<int64>> durations);
  int numberOfProducts();
  std::vector<RoutingModel::NodeIndex> starts();
  std::vector<RoutingModel::NodeIndex> ends();
  std::vector<std::vector<int64>> demands();
  std::vector<std::vector<int64>> reserves();
  std::vector<int64> getProductReserves(int product_index);
  ProductDemand getProductDemand(int product_index);
};

#endif