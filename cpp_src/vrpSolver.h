#include <vector>
#include "ortools/constraint_solver/routing.h"

using operations_research::RoutingModel;

class VRPSolver
{
private:
  int numOfVehicles;
  std::vector<std::vector<int64>> matrix;
  // int64 getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);

public:
  VRPSolver(int numOfVehicles, std::vector<std::vector<int64>> matrix);
  int getNumOfVehicles();
  std::vector<std::vector<int64>> getMatrix();
  std::string solveProblem();
};