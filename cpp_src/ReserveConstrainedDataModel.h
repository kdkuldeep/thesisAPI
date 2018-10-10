#ifndef RESERVE_CONSTRAINED_DATAMODEL_H
#define RESERVE_CONSTRAINED_DATAMODEL_H

#include "DataModel.h"

class ReserveConstrainedDataModel : public DataModel
{
private:
  int _numberOfProducts;
  std::vector<RoutingModel::NodeIndex> _starts;
  std::vector<RoutingModel::NodeIndex> _ends;
  std::vector<std::vector<int64>> _demands;  // Stores the demand of each product in every location (numberOfProducts x numberONodes)
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
  std::vector<std::vector<int64>> demands();
  std::vector<std::vector<int64>> reserves();
  std::vector<int64> getProductReserves(int product_index);
  int64 getProductDemandAtNode(int product_index, RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};

#endif