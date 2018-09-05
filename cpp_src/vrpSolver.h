#include <vector>

class VRPSolver
{
private:
  int numOfVehicles;
  std::vector<std::vector<double>> matrix;

public:
  VRPSolver(int numOfVehicles, std::vector<std::vector<double>> matrix);
  int getNumOfVehicles();
  std::vector<std::vector<double>> getMatrix();
};