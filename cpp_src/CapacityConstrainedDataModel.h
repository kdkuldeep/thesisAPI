#ifndef CAPACITY_CONSTRAINED_DATAMODEL_H
#define CAPACITY_CONSTRAINED_DATAMODEL_H

#include "DataModel.h"

class CapacityConstrainedDataModel : public DataModel
{
private:
  std::vector<int64> _capacities; // Stores the capacity of each vehicle
  std::vector<int64> _volumes;    // Stores the total volume of each order (n = numberOfOrders + 1 depot)

public:
  CapacityConstrainedDataModel(int numberOfVehicles,
                               int numberOfOrders,
                               std::vector<int64> capacities,
                               std::vector<int64> volumes,
                               std::vector<std::vector<int64>> durations);
  std::vector<int64> capacities() const;
  std::vector<int64> volumes();
  int64 getOrderVolume(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};

#endif