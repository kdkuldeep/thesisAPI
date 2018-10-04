#ifndef CAPACITY_CONSTRAINED_VRP_H
#define CAPACITY_CONSTRAINED_VRP_H

#include "CapacityConstrainedDataModel.h"

#include "ortools/base/logging.h"
#include "ortools/base/stringprintf.h"
#include "ortools/base/callback.h"
#include "ortools/base/integral_types.h"

using operations_research::Assignment;
using operations_research::FirstSolutionStrategy;
using operations_research::LocalSearchMetaheuristic;
using operations_research::RoutingDimension;
using operations_research::RoutingSearchParameters;
using operations_research::StringAppendF;
using operations_research::StringPrintf;

std::vector<std::vector<int>> getCapacityConstrainedRoutes(const CapacityConstrainedDataModel &data,
                                                           const RoutingModel &routing,
                                                           const operations_research::Assignment &plan,
                                                           const RoutingDimension &capacity_dimension);

std::vector<std::vector<int>> solveWithCapacityConstraints(std::vector<int64> capacities,
                                                           std::vector<int64> volumes,
                                                           std::vector<std::vector<int64>> durations,
                                                           int timeLimit);

#endif