#include "ReserveConstrainedDataModel.h"

ReserveConstrainedDataModel::ReserveConstrainedDataModel(int numberOfVehicles,
                                                         int numberOfNodes,
                                                         int numberOfProducts,
                                                         std::vector<int64> startingLocations,
                                                         std::vector<std::vector<int64>> demands,
                                                         std::vector<std::vector<int64>> reserves,
                                                         std::vector<std::vector<int64>> durations)
    : DataModel(numberOfVehicles, numberOfNodes, durations),
      _numberOfProducts(numberOfProducts),
      _reserves(reserves),
      _demands(demands)
{
  for (int vehicle_index = 0; vehicle_index < numberOfVehicles; vehicle_index++)
  {
    _starts.push_back(RoutingModel::NodeIndex(startingLocations.at(vehicle_index)));
    _ends.push_back(RoutingModel::NodeIndex(0));
  }
};

int ReserveConstrainedDataModel::numberOfProducts()
{
  return _numberOfProducts;
}

std::vector<RoutingModel::NodeIndex> ReserveConstrainedDataModel::starts()
{
  return _starts;
}

std::vector<RoutingModel::NodeIndex> ReserveConstrainedDataModel::ends()
{
  return _ends;
}

std::vector<std::vector<int64>> ReserveConstrainedDataModel::demands()
{
  return _demands;
}

std::vector<std::vector<int64>> ReserveConstrainedDataModel::reserves()
{
  return _reserves;
}

std::vector<int64> ReserveConstrainedDataModel::getProductReserves(int product_index)
{
  return _reserves.at(product_index);
}

int64 ReserveConstrainedDataModel::getProductDemandAtNode(int product_index, RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return _demands.at(product_index).at(from.value());
}
