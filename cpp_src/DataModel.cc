#include "DataModel.h"

DataModel::DataModel(int numberOfVehicles,
                     int numberOfNodes,
                     std::vector<std::vector<int64>> durations)
    : _numberOfVehicles(numberOfVehicles),
      _numberOfNodes(numberOfNodes),
      _durations(durations){};

int DataModel::numberOfVehicles()
{
  return _numberOfVehicles;
}

int DataModel::numberOfNodes()
{
  return _numberOfNodes;
}

std::vector<std::vector<int64>> DataModel::durations()
{
  return _durations;
}

int64 DataModel::getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return _durations[from.value()][to.value()];
}