#include "ReserveConstrainedDataModel.h"

ReserveConstrainedDataModel::ReserveConstrainedDataModel(int numberOfVehicles,
                                                         int numberOfNodes,
                                                         int numberOfProducts,
                                                         std::vector<std::vector<int64>> previousRoutes,
                                                         std::vector<std::vector<int64>> demands,
                                                         std::vector<std::vector<int64>> reserves,
                                                         std::vector<std::vector<int64>> durations)
    : DataModel(numberOfVehicles, numberOfNodes, durations),
      _numberOfProducts(numberOfProducts),
      _reserves(reserves),
      _demands(demands)
{
  int maxNodeIndex = 0;
  for (int vehicle_index = 0; vehicle_index < numberOfVehicles; vehicle_index++)
  {

    _starts.push_back(RoutingModel::NodeIndex(previousRoutes.at(vehicle_index).at(0)));
    _ends.push_back(RoutingModel::NodeIndex(0));

    if (previousRoutes.at(vehicle_index).at(0) > maxNodeIndex)
      maxNodeIndex = previousRoutes.at(vehicle_index).at(0);

    std::vector<RoutingModel::NodeIndex> vehicleRoute{};
    for (int order_index = 1; order_index < previousRoutes.at(vehicle_index).size(); order_index++)
    {
      vehicleRoute.push_back(RoutingModel::NodeIndex(previousRoutes.at(vehicle_index).at(order_index)));

      if (previousRoutes.at(vehicle_index).at(order_index) > maxNodeIndex)
        maxNodeIndex = previousRoutes.at(vehicle_index).at(order_index);
    }
    _initialRoutes.push_back(vehicleRoute);
  }

  _minOptionalNodeIndex = RoutingModel::NodeIndex(maxNodeIndex + 1);
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

std::vector<std::vector<RoutingModel::NodeIndex>> ReserveConstrainedDataModel::initialRoutes()
{
  return _initialRoutes;
}

RoutingModel::NodeIndex ReserveConstrainedDataModel::minOptionalNodeIndex()
{
  return _minOptionalNodeIndex;
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
