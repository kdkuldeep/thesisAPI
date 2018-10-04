#include "DataModel.h"

DataModel::DataModel(int numberOfVehicles,
                     int numberOfOrders,
                     std::vector<std::vector<int64>> durations)
    : _numberOfVehicles(numberOfVehicles),
      _numberOfOrders(numberOfOrders),
      _durations(durations){};

int DataModel::numberOfVehicles()
{
  return _numberOfVehicles;
}

int DataModel::numberOfOrders()
{
  return _numberOfOrders;
}

std::vector<std::vector<int64>> DataModel::durations()
{
  return _durations;
}

int64 DataModel::getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return _durations[from.value()][to.value()];
}