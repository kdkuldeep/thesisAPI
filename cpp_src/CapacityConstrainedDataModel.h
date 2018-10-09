#ifndef CAPACITY_CONSTRAINED_DATAMODEL_H
#define CAPACITY_CONSTRAINED_DATAMODEL_H

#include "DataModel.h"

class CapacityConstrainedDataModel : public DataModel
{
private:
  std::vector<int64> _capacities; // Stores the capacity of each vehicle (numberOfVehicles x 1)
  std::vector<int64> _volumes;    // Stores the total order volume of each location (numberOfNodes x 1)

public:
  CapacityConstrainedDataModel(int numberOfVehicles,
                               int numberOfNodes,
                               std::vector<int64> capacities,
                               std::vector<int64> volumes,
                               std::vector<std::vector<int64>> durations);
  std::vector<int64> capacities() const;
  std::vector<int64> volumes();
  int64 getOrderVolume(RoutingModel::NodeIndex from, RoutingModel::NodeIndex to);
};

#endif