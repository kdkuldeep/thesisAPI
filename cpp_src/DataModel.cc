#include "DataModel.h"

DataModel::DataModel(int numberOfVehicles, std::vector<std::vector<int64>> matrix) : numberOfVehicles(numberOfVehicles),
                                                                                     durations(matrix){};

int DataModel::getNumberOfVehicles()
{
  return this->numberOfVehicles;
}

std::vector<std::vector<int64>> DataModel::getDurationsMatrix()
{
  return this->durations;
}

int64 DataModel::getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return this->durations[from.value()][to.value()];
}