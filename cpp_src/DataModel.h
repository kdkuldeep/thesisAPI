#include <vector>
#include "ortools/constraint_solver/routing.h"

using operations_research::RoutingModel;

class DataModel
{
private:
  int _numberOfVehicles;
  int _numberOfOrders;
  std::vector<int64> _capacities;             // Stores the capacity of each vehicle
  std::vector<int64> _volumes;                // Stores the total volume of each order (n = numberOfOrders + 1 depot)
  std::vector<std::vector<int64>> _demands;   // Stores the quantity of ordered product ((numberOfOrders + 1 depot) x numberOfProducts)
  std::vector<std::vector<int64>> _durations; // The n x n duration matrix (n = numberOfOrders + 1 depot)
public:
  DataModel(int numberOfVehicles,
            int numberOfOrders,
            std::vector<int64> capacities,
            std::vector<int64> volumes,
            std::vector<std::vector<int64>> demands,
            std::vector<std::vector<int64>> durations);
  int numberOfVehicles();
  int numberOfOrders();
  std::vector<int64> capacities() const;
  std::vector<int64> volumes();
  std::vector<std::vector<int64>> demands();
  std::vector<std::vector<int64>> durations();
  int64 getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
  int64 getOrderVolume(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
  int64 getDemand(int productIndex, RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};