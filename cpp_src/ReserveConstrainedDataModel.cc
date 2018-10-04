#include "ReserveConstrainedDataModel.h"

ReserveConstrainedDataModel::ReserveConstrainedDataModel(int numberOfVehicles,
                                                         int numberOfOrders,
                                                         int numberOfProducts,
                                                         std::vector<std::vector<int64>> demands,
                                                         std::vector<std::vector<int64>> reserves,
                                                         std::vector<std::vector<int64>> durations)
    : DataModel(numberOfVehicles, numberOfOrders, durations),
      _numberOfProducts(numberOfProducts),
      _demands(demands),
      _reserves(reserves)
{
  for (int product_index = 0; product_index < numberOfProducts; product_index++)
  {
    ProductDemand demand(demands[product_index]);
    _product_demands.push_back(demand);
  }
};

int ReserveConstrainedDataModel::numberOfProducts()
{
  return _numberOfProducts;
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
  return _reserves[product_index];
}

ProductDemand ReserveConstrainedDataModel::getProductDemand(int product_index)
{
  return _product_demands[product_index];
}

// ProductDemand

ProductDemand::ProductDemand(std::vector<int64> demand)
    : _demand(demand){};

int64 ProductDemand::getDemand(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return _demand[to.value()];
}