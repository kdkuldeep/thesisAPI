#ifndef DATAMODEL_H
#define DATAMODEL_H

#include <vector>
#include "ortools/constraint_solver/routing.h"

using operations_research::RoutingModel;

class DataModel
{
private:
  int _numberOfVehicles;
  int _numberOfNodes;                         // numberOfNodes = order locations + 1 depot location
  std::vector<std::vector<int64>> _durations; // The n x n duration matrix (numberOfNodes x numberOfNodes)
public:
  DataModel(int numberOfVehicles,
            int numberOfNodes,
            std::vector<std::vector<int64>> durations);
  int numberOfVehicles();
  int numberOfNodes();
  std::vector<std::vector<int64>> durations();
  int64 getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};

#endif