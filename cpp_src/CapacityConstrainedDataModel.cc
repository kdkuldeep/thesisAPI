#include "CapacityConstrainedDataModel.h"

CapacityConstrainedDataModel::CapacityConstrainedDataModel(int numberOfVehicles,
                                                           int numberOfOrders,
                                                           std::vector<int64> capacities,
                                                           std::vector<int64> volumes,
                                                           std::vector<std::vector<int64>> durations)
    : DataModel(numberOfVehicles, numberOfOrders, durations),
      _capacities(capacities),
      _volumes(volumes){};

std::vector<int64> CapacityConstrainedDataModel::capacities() const
{
  return _capacities;
}

std::vector<int64> CapacityConstrainedDataModel::volumes()
{
  return _volumes;
}

int64 CapacityConstrainedDataModel::getOrderVolume(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return _volumes[to.value()];
}