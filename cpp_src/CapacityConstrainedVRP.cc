#include "CapacityConstrainedVRP.h"

std::vector<std::vector<int>> getCapacityConstrainedRoutes(const CapacityConstrainedDataModel &data,
                                                           const RoutingModel &routing,
                                                           const operations_research::Assignment &plan,
                                                           const RoutingDimension &capacity_dimension)
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
    operations_research::IntVar *const load_var =
        capacity_dimension.CumulVar(routing.End(vehicle_id));
    StringAppendF(&plan_output, "Capacity:\t%lld mL\n", data.capacities()[vehicle_id]);
    StringAppendF(&plan_output, "Load:\t\t%lld mL\n", plan.Value(load_var));
    StringAppendF(&plan_output, "Free:\t\t%lld mL\n", data.capacities()[vehicle_id] - plan.Value(load_var));
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

std::vector<std::vector<int>> solveWithCapacityConstraints(std::vector<int64> capacities,
                                                           std::vector<int64> volumes,
                                                           std::vector<std::vector<int64>> durations,
                                                           int timeLimit)
{
  CapacityConstrainedDataModel data(capacities.size(), volumes.size(), capacities, volumes, durations);

  const char *kDuration = "Duration";
  const char *kCapacity = "Capacity";
  const int kMaxTripDuration = 28800; // maximum trip duration per vehicle (8 hours)

  // RoutingModel Constructor
  // Arguments: int nodes, int vehicles, NodeIndex depot
  // Create a routing model for the given problem size
  RoutingModel routing(data.numberOfNodes(), data.numberOfVehicles(), RoutingModel::NodeIndex(0));

  // Configure routing model parameters
  RoutingSearchParameters parameters = RoutingModel::DefaultSearchParameters();
  parameters.set_first_solution_strategy(
      FirstSolutionStrategy::PATH_CHEAPEST_ARC);
  parameters.set_local_search_metaheuristic(LocalSearchMetaheuristic::GUIDED_LOCAL_SEARCH);
  parameters.set_time_limit_ms(timeLimit); // metaheuristic time limit (milliseconds) (sec*1000)

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

  // Add Capacity Constraints
  routing.AddDimensionWithVehicleCapacity(NewPermanentCallback(&data, &CapacityConstrainedDataModel::getOrderVolume),
                                          0,
                                          data.capacities(), // Maximum capacities per vehicle
                                          true,
                                          kCapacity);

  // Adding penalty costs to allow skipping orders.
  // TODO: prioritize orders from previous days
  const int64 kPenalty = 10000000;
  const RoutingModel::NodeIndex kFirstNodeAfterDepot(1);
  for (RoutingModel::NodeIndex order = kFirstNodeAfterDepot;
       order < routing.nodes(); ++order)
  {
    std::vector<RoutingModel::NodeIndex> orders(1, order);
    routing.AddDisjunction(orders, kPenalty);
  }

  // Solve and Display Solution
  const Assignment *solution = routing.SolveWithParameters(parameters);
  return getCapacityConstrainedRoutes(data, routing, *solution, routing.GetDimensionOrDie(kCapacity));
}
