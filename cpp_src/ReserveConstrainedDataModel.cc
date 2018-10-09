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
      _reserves(reserves)
{
  for (int vehicle_index = 0; vehicle_index < numberOfVehicles; vehicle_index++)
  {
    _starts.push_back(RoutingModel::NodeIndex(startingLocations[vehicle_index]));
    _ends.push_back(RoutingModel::NodeIndex(0));
  }

  for (int product_index = 0; product_index < numberOfProducts; product_index++)
  {
    ProductDemand demand(demands[product_index]);
    _demands.push_back(demand);
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

std::vector<ProductDemand> ReserveConstrainedDataModel::demands()
{
  return _demands;
}

std::vector<std::vector<int64>> ReserveConstrainedDataModel::reserves()
{
  return _reserves;
}

std::vector<int64> ReserveConstrainedDataModel::getProductReserves(int product_index)
{
  return _reserves[product_index];
}

ProductDemand ReserveConstrainedDataModel::getProductDemand(int product_index)
{
  return _demands[product_index];
}

// ProductDemand

ProductDemand::ProductDemand(std::vector<int64> demand)
    : _demand(demand){};

std::vector<int64> ProductDemand::demand()
{
  return _demand;
}

int64 ProductDemand::getOrderDemand(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return _demand[from.value()];
}