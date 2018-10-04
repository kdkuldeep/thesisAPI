#ifndef DATAMODEL_H
#define DATAMODEL_H

#include <vector>
#include "ortools/constraint_solver/routing.h"

using operations_research::RoutingModel;

class DataModel
{
private:
  int _numberOfVehicles;
  int _numberOfOrders;
  std::vector<std::vector<int64>> _durations; // The n x n duration matrix (n = numberOfOrders + 1 depot)
public:
  DataModel(int numberOfVehicles,
            int numberOfOrders,
            std::vector<std::vector<int64>> durations);
  int numberOfVehicles();
  int numberOfOrders();
  std::vector<std::vector<int64>> durations();
  int64 getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};

#endif