#include "vrpSolver.h"

VRPSolver::VRPSolver(int numOfVehicles, std::vector<std::vector<double>> matrix)

{
  this->numOfVehicles = numOfVehicles;
  this->matrix = matrix;
}

int VRPSolver::getNumOfVehicles()
{
  return this->numOfVehicles;
}

std::vector<std::vector<double>> VRPSolver::getMatrix()
{
  return this->matrix;
}
