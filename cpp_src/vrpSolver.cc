#include "vrpSolver.h"

VRPSolver::VRPSolver(int numOfVehicles, std::vector<std::vector<int64>> matrix)

{
  this->numOfVehicles = numOfVehicles;
  this->matrix = matrix;
}

int VRPSolver::getNumOfVehicles()
{
  return this->numOfVehicles;
}

std::vector<std::vector<int64>> VRPSolver::getMatrix()
{
  return this->matrix;
}

int64 getArcCost(VRPSolver *solver, RoutingModel::NodeIndex from, RoutingModel::NodeIndex to)
{
  return solver->getMatrix()[from.value()][to.value()];
}

std::string VRPSolver::solveProblem()
{
  // Create a routing model for the given problem size

  int numberOfNodes = this->matrix.size();
  int numberOfRoutes = this->numOfVehicles;
  const RoutingModel::NodeIndex kDepot(0);
  RoutingModel routing(numberOfNodes, numberOfRoutes, kDepot);

  // Set the cost function by passing a permanent callback to the distance
  // accessor here. The callback has the following signature:
  // ResultCallback2<int64, int64, int64>.
  // ??????????

  routing.SetArcCostEvaluatorOfAllVehicles(
      NewPermanentCallback(getArcCost, this));

  // Find a solution using Solve(), returns a solution if any (owned by
  // routing):

  const operations_research::Assignment *solution = routing.Solve();

  if (solution != nullptr)
  {
    std::string s = "\nSOLVED\n\nVehicle Number: " + std::to_string(numberOfRoutes) +
                    "\n Nodes: " + std::to_string(numberOfNodes) + "\n Cost: " + std::to_string(solution->ObjectiveValue());

    for (int64 vehicle_id = 0; vehicle_id < numberOfRoutes; vehicle_id++)
    {
      s += "\n\n Route " + std::to_string(vehicle_id) + "\t";

      for (int64 node = routing.Start(vehicle_id);
           !routing.IsEnd(node);
           node = solution->Value(routing.NextVar(node)))
      {
        s += " -> " + std::to_string(node);
      }
    }
    return (s);
  }
  else
  {
    return ("No solution found.");
  }
}