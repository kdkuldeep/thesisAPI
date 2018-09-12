#include <vector>
#include "ortools/constraint_solver/routing.h"

using operations_research::RoutingModel;

class Product
{
private:
  int _productId;
  int64 _volume;

public:
  Product(int id, int volume);
  int productId();
  int volume();
};

class Vehicle
{
private:
  int _vehicleId;         // ID of vehicle in database
  int _capacity;          // Total capacity of vehicle
  std::vector<int> cargo; // Stores the reserve of each product (cargo[i] references DataModel.products[i])
public:
  Vehicle(int id, int capacity);
  int vehicleId();
  int capacity();
};

class Order
{
private:
  int _orderId;

public:
  Order(int id);
  int orderId();
};

class DataModel
{
private:
  int numberOfVehicles;
  std::vector<Vehicle> vehicles;
  int numberOfOrders;
  std::vector<Order> orders;
  int numberOfProducts;
  std::vector<Product> products;
  std::vector<std::vector<int64>> durations; // The n x n duration matrix (n = numberOfOrders + 1 depot)
  std::vector<std::vector<int>> demands;     // Stores the quantity of ordered product ((numberOfOrders + 1 depot) x numberOfProducts)
  std::vector<int64> volumes;                // Stores the total volume of each order (n = numberOfOrders + 1 depot)
public:
  DataModel(int numberOfVehicles, std::vector<std::vector<int64>> matrix);
  int getNumberOfVehicles();
  std::vector<std::vector<int64>> getDurationsMatrix();
  int64 getArcCost(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
  int64 getOrderVolume(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
  int64 getDemand(int productIndex, RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};