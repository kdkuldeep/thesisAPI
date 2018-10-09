#include "ReserveConstrainedVRP.h"

std::vector<std::vector<int>> getReserveConstrainedRoutes(const ReserveConstrainedDataModel &data,
                                                          const RoutingModel &routing,
                                                          const Assignment &plan)
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
  LOG(INFO) << plan_output;
  return routes;
}

std::vector<std::vector<int>> solveWithReserveConstraints(std::vector<int64> startingLocations,
                                                          std::vector<std::vector<int64>> demands,
                                                          std::vector<std::vector<int64>> reserves,
                                                          std::vector<std::vector<int64>> durations,
                                                          int timeLimit)
{
  ReserveConstrainedDataModel data(reserves[0].size(), demands[0].size(), demands.size(), startingLocations, demands, reserves, durations);

  const char *kDuration = "Duration";
  const int kMaxTripDuration = 28800; // maximum trip duration per vehicle (8 hours)

  // RoutingModel Constructor
  // Arguments: int nodes, int vehicles, std::vector<NodeIndex>& starts, std::vector<NodeIndex>& ends
  // Create a routing model for the given problem size
  RoutingModel routing(data.numberOfNodes(), data.numberOfVehicles(), data.starts(), data.ends());

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
  // between the largest value of route end cumul variables and
  // the smallest value of route start cumul variables.
  // In other words:
  // global_span_cost = coefficient * (Max(dimension end value) - Min(dimension start value)).
  routing.GetMutableDimension(kDuration)->SetGlobalSpanCostCoefficient(100);

  // Add Reserve Constraints
  std::vector<std::string> kReserve;
  for (int product_index = 0; product_index < data.numberOfProducts(); product_index++)
  {
    kReserve.push_back("Reserve" + std::to_string(product_index));

    routing.AddDimensionWithVehicleCapacity(NewPermanentCallback(&data.getProductDemand(product_index), &ProductDemand::getOrderDemand),
                                            0,
                                            data.getProductReserves(product_index),
                                            true,
                                            kReserve[product_index]);
  }

  // Adding penalty costs to allow skipping orders.
  // https://groups.google.com/forum/#!topic/or-tools-discuss/tNWnNsKguyM
  const int64 kPenalty = 10000000;
  const RoutingModel::NodeIndex kFirstNodeAfterDepot(1);
  for (RoutingModel::NodeIndex order = kFirstNodeAfterDepot;
       order < routing.nodes(); ++order)
  {
    if (routing.IsStart(routing.NodeToIndex(order)))
    {
      continue;
    }
    std::vector<RoutingModel::NodeIndex> orders(1, order);
    routing.AddDisjunction(orders, kPenalty);
    std::cout << "Node " << order.value() << " made optional\n";
  }

  // ******* TEST LOGGING ***************************

  std::cout << "\nNumber of Locations " + std::to_string(routing.nodes()) + "\n";
  std::cout << "Number of Vehicles " + std::to_string(routing.vehicles()) + "\n";
  std::cout << "Number of Products " + std::to_string(data.numberOfProducts()) + "\n";

  for (int vehicle_id = 0; vehicle_id < routing.vehicles();
       ++vehicle_id)
  {
    std::cout << "\nVehicle " + std::to_string(vehicle_id) + "\n";
    std::cout << "Start: " + std::to_string(routing.IndexToNode(routing.Start(vehicle_id)).value()) +
                     "\tEnd: " + std::to_string(routing.IndexToNode(routing.End(vehicle_id)).value()) + "\n";
  }

  std::vector<std::string> all_dimensions;
  all_dimensions = routing.GetAllDimensionNames();
  std::cout << "\nDimensions:\n";
  for (int dimension_index = 0; dimension_index < all_dimensions.size(); dimension_index++)
  {
    std::cout << all_dimensions[dimension_index] + "\n";
  }

  int number_of_disjunctions = routing.GetNumberOfDisjunctions();
  std::cout << "\nNumber of disjunctions: " + std::to_string(number_of_disjunctions) + "\n";

  // ************************************************

  // Solve and Display Solution
  const Assignment *solution = routing.SolveWithParameters(parameters);
  // 0	ROUTING_NOT_SOLVED: Problem not solved yet.
  // 1	ROUTING_SUCCESS: Problem solved successfully.
  // 2	ROUTING_FAIL: No solution found to the problem.
  // 3	ROUTING_FAIL_TIMEOUT: Time limit reached before finding a solution.
  // 4	ROUTING_INVALID: Model, model parameters, or flags are not valid.
  std::cout << std::to_string(routing.status()) + "\n";

  if (solution != nullptr)
  {
    std::cout << "SOLVED\n";
    return getReserveConstrainedRoutes(data, routing, *solution);
  }
  else
  {
    std::cout << "solution == nullptr\n";
    std::vector<std::vector<int>> empty_routes;
    return empty_routes;
  }
}