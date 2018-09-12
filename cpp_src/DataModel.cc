#include "DataModel.h"

DataModel::DataModel(int numberOfVehicles,
                     int numberOfOrders,
                     std::vector<int64> capacities,
                     std::vector<int64> volumes,
                     std::vector<std::vector<int64>> demands,
                     std::vector<std::vector<int64>> durations)
    : _numberOfVehicles(numberOfVehicles),
      _numberOfOrders(numberOfOrders),
      _capacities(capacities),
      _volumes(volumes),
      _demands(demands),
      _durations(durations){};

int DataModel::numberOfVehicles()
{
  return _numberOfVehicles;
}

int DataModel::numberOfOrders()
{
  return _numberOfOrders;
}

std::vector<int64> DataModel::capacities()
{
  return _capacities;
}

std::vector<int64> DataModel::volumes()
{
  return _volumes;
}

std::vector<std::vector<int64>> DataModel::demands()
{
  return _demands;
}

std::vector<std::vector<int64>> DataModel::durations()
{
  return _durations;
}

int64 DataModel::getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return _durations[from.value()][to.value()];
}

int64 DataModel::getOrderVolume(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return _volumes[from.value()];
}