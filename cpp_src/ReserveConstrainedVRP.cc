#include "ReserveConstrainedVRP.h"

std::vector<std::vector<int>> getReserveConstrainedRoutes(const ReserveConstrainedDataModel &data,
                                                          const RoutingModel &routing,
                                                          const operations_research::Assignment &plan)
{
  // 2d vector to hold routes for each vehicle
  std::vector<std::vector<int>> routes;

  // Display plan cost.
  std::string plan_output = StringPrintf("\nTotal Cost: %lld\n", plan.ObjectiveValue());

  // Display actual output for each vehicle.
  for (int vehicle_id = 0; vehicle_id < routing.vehicles();
       ++vehicle_id)
  {
    // the route for vehicle indexed by {vehicle_id}
    std::vector<int> vehicle_route;

    StringAppendF(&plan_output, "\n------  Vehicle %d  ------\n", vehicle_id);

    StringAppendF(&plan_output, "Route: ");

    int64 index = routing.Start(vehicle_id);
    if (routing.IsEnd(plan.Value(routing.NextVar(index))))
    {
      plan_output += "Empty\n";
    }
    else
    {
      while (true)
      {
        vehicle_route.push_back(routing.IndexToNode(index).value());

        StringAppendF(&plan_output, "%lld",
                      routing.IndexToNode(index).value());
        if (routing.IsEnd(index))
        {
          break;
        }
        StringAppendF(&plan_output, " -> ");
        index = plan.Value(routing.NextVar(index));
      }
      routes.push_back(vehicle_route);

      plan_output += "\n";
    }
  }
  LOG(INFO) << plan_output;
  return routes;
}

std::vector<std::vector<int>> solveWithReserveConstraints(std::vector<std::vector<int64>> demands,
                                                          std::vector<std::vector<int64>> reserves,
                                                          std::vector<std::vector<int64>> durations,
                                                          int timeLimit)
{
  ReserveConstrainedDataModel data(reserves[0].size(), demands[0].size(), demands.size(), demands, reserves, durations);

  const char *kDuration = "Duration";
  const int kMaxTripDuration = 28800; // maximum trip duration per vehicle (8 hours)

  // RoutingModel Constructor
  // Arguments: int nodes, int vehicles, NodeIndex depot
  // Create a routing model for the given problem size
  RoutingModel routing(data.numberOfOrders(), data.numberOfVehicles(), RoutingModel::NodeIndex(0));

  // SetArcCostEvaluatorOfAllVehicles
  // Return type: void
  // Arguments: NodeEvaluator2* evaluator
  // Sets the cost function of the model such that the cost of a segment of a
  // route between node 'from' and 'to' is evaluator(from, to), whatever the
  // route or vehicle performing the route.
  // Takes ownership of the callback 'evaluator'.
  routing.SetArcCostEvaluatorOfAllVehicles(NewPermanentCallback(&data, &DataModel::getArcCost));

  // Add a dimension to accumulate trip durations
  // Try to minimize the max trip duration difference among vehicles.
  // It doesn't mean the standard deviation is minimized
  routing.AddDimension(NewPermanentCallback(&data, &DataModel::getArcCost),
                       0, // null slack
                       kMaxTripDuration,
                       true, // start cumul to zero
                       kDuration);
  // Sets a cost proportional to the *global* dimension span, that is the difference
  // between the largest value of route end cumul variables and the smallest value of route
  // start cumul variables. In other words:
  // global_span_cost = coefficient * (Max(dimension end value) - Min(dimension start value)).
  routing.GetMutableDimension(kDuration)->SetGlobalSpanCostCoefficient(100);

  // Add Reserve Constraints
  for (int product_index = 0; product_index < data.numberOfProducts(); product_index++)
  {
    std::string kReserve = "Reserve" + std::to_string(product_index);
    routing.AddDimensionWithVehicleCapacity(NewPermanentCallback(&data.getProductDemand(product_index), &ProductDemand::getDemand),
                                            0,
                                            data.getProductReserves(product_index), // Reserve per vehicle for product with {product_index}
                                            true,
                                            kReserve);
  }

  // Configure routing model parameters
  RoutingSearchParameters parameters = RoutingModel::DefaultSearchParameters();
  parameters.set_first_solution_strategy(
      FirstSolutionStrategy::PATH_CHEAPEST_ARC);
  parameters.set_local_search_metaheuristic(LocalSearchMetaheuristic::GUIDED_LOCAL_SEARCH);
  parameters.set_time_limit_ms(timeLimit); // metaheuristic time limit (milliseconds) (sec*1000)

  // Solve and Display Solution
  const Assignment *solution = routing.SolveWithParameters(parameters);

  // std::vector<const RoutingDimension &> reserve_dimensions;
  // for (int product_index = 0; product_index < data.numberOfProducts(); product_index++)
  // {
  //   reserve_dimensions.push_back(routing.GetDimensionOrDie("kReserve" + std::to_string(product_index)));
  // }

  return getReserveConstrainedRoutes(data, routing, *solution);
}