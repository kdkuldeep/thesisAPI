#ifndef RESERVE_CONSTRAINED_VRP_H
#define RESERVE_CONSTRAINED_VRP_H

#include "ReserveConstrainedDataModel.h"

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

std::vector<std::vector<int>> getReserveConstrainedRoutes(const ReserveConstrainedDataModel &data,
                                                          const RoutingModel &routing,
                                                          const Assignment &plan);

std::vector<std::vector<int>> solveWithReserveConstraints(std::vector<std::vector<int64>> previousRoutes,
                                                          std::vector<std::vector<int64>> demands,
                                                          std::vector<std::vector<int64>> reserves,
                                                          std::vector<std::vector<int64>> durations,
                                                          int timeLimit);

#endif