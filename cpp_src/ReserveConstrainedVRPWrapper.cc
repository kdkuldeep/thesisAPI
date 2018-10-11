#include "ReserveConstrainedVRPWrapper.h"

ReserveConstrainedSolverWorker::ReserveConstrainedSolverWorker(Napi::Function &callback,
                                                               Napi::Promise::Deferred deferred,
                                                               std::vector<std::vector<int64>> previousRoutes,
                                                               std::vector<std::vector<int64>> demands,
                                                               std::vector<std::vector<int64>> reserves,
                                                               std::vector<std::vector<int64>> durations,
                                                               int timeLimit)
    : Napi::AsyncWorker(callback),
      deferred(deferred),
      previousRoutes(previousRoutes),
      demands(demands),
      reserves(reserves),
      durations(durations),
      timeLimit(timeLimit) {}

ReserveConstrainedSolverWorker::~ReserveConstrainedSolverWorker() {}

void ReserveConstrainedSolverWorker::Execute()
{
  routes = solveWithReserveConstraints(previousRoutes, demands, reserves, durations, timeLimit);
}

void ReserveConstrainedSolverWorker::OnOK()
{
  Napi::HandleScope scope(Env());

  // convert to Napi values
  Napi::Array result = Napi::Array::New(Env(), routes.size());
  for (uint32_t rowIndex = 0; rowIndex < routes.size(); rowIndex++)
  {
    Napi::Array resultRow = Napi::Array::New(Env(), routes[rowIndex].size());
    for (int32_t columnIndex = 0; columnIndex < routes[rowIndex].size(); columnIndex++)
    {
      Napi::Number value = Napi::Number::New(Env(), routes[rowIndex][columnIndex]);
      resultRow.Set(columnIndex, value);
    }
    result.Set(rowIndex, resultRow);
  }
  // resolve promise with the result
  deferred.Resolve(result);

  // call the empty callback
  Callback().Call({Env().Null(), result});
}

Napi::Promise solveAsyncWithReserveConstraints(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  // The Promise class, along with its Promise::Deferred class,
  // implement the ability to create, resolve, and reject Promise objects.
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(info.Env());

  // Check for incorrect arguments passed from JS and reject promise
  if (info.Length() < 5)
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Wrong number of arguments.").Value());
  }

  else if (!info[0].IsArray())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected 2d array as first argument (previous routes)").Value());
  }

  else if (!info[1].IsArray())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected 2d array as second argument (demands)").Value());
  }

  else if (!info[2].IsArray())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected 2d array as third argument (reserves)").Value());
  }

  else if (!info[3].IsArray())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected 2d array as fourth argument (duration matrix)").Value());
  }

  else if (!info[4].IsNumber())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected number as fifth argument (metaheuristic time limit)").Value());
  }

  else
  {

    // Get previous vehicle routes from first argument
    std::vector<std::vector<int64>> previousRoutes;
    Napi::Array previousRoutesInput = info[0].As<Napi::Array>();
    for (uint32_t rowIndex = 0; rowIndex < previousRoutesInput.Length(); rowIndex++)
    {
      std::vector<int64> previousRoutesRow;
      Napi::Array previousRoutesInputRow = previousRoutesInput.Get(rowIndex).As<Napi::Array>();
      for (int32_t columnIndex = 0; columnIndex < previousRoutesInputRow.Length(); columnIndex++)
      {
        int64 previousRoutesValue = previousRoutesInputRow.Get(columnIndex).As<Napi::Number>().Int64Value();
        previousRoutesRow.push_back(previousRoutesValue);
      }
      previousRoutes.push_back(previousRoutesRow);
    }

    // Get product demands from second argument
    std::vector<std::vector<int64>> demands;
    Napi::Array demandsInput = info[1].As<Napi::Array>();
    for (uint32_t rowIndex = 0; rowIndex < demandsInput.Length(); rowIndex++)
    {
      std::vector<int64> demandsRow;
      Napi::Array demandsInputRow = demandsInput.Get(rowIndex).As<Napi::Array>();
      for (int32_t columnIndex = 0; columnIndex < demandsInputRow.Length(); columnIndex++)
      {
        int64 demandsValue = demandsInputRow.Get(columnIndex).As<Napi::Number>().Int64Value();
        demandsRow.push_back(demandsValue);
      }
      demands.push_back(demandsRow);
    }

    // Get vehicle reserves from third argument
    std::vector<std::vector<int64>> reserves;
    Napi::Array reservesInput = info[2].As<Napi::Array>();
    for (uint32_t rowIndex = 0; rowIndex < reservesInput.Length(); rowIndex++)
    {
      std::vector<int64> reservesRow;
      Napi::Array reservesInputRow = reservesInput.Get(rowIndex).As<Napi::Array>();
      for (int32_t columnIndex = 0; columnIndex < reservesInputRow.Length(); columnIndex++)
      {
        int64 reservesValue = reservesInputRow.Get(columnIndex).As<Napi::Number>().Int64Value();
        reservesRow.push_back(reservesValue);
      }
      reserves.push_back(reservesRow);
    }

    // Get duration matrix from fourth argument
    std::vector<std::vector<int64>> durations;
    Napi::Array durationsInput = info[3].As<Napi::Array>();
    for (uint32_t rowIndex = 0; rowIndex < durationsInput.Length(); rowIndex++)
    {
      std::vector<int64> durationsRow;
      Napi::Array durationsInputRow = durationsInput.Get(rowIndex).As<Napi::Array>();
      for (int32_t columnIndex = 0; columnIndex < durationsInputRow.Length(); columnIndex++)
      {
        int64 durationsValue = durationsInputRow.Get(columnIndex).As<Napi::Number>().Int64Value();
        durationsRow.push_back(durationsValue);
      }
      durations.push_back(durationsRow);
    }

    // Get metaheuristic time limit from fifth argument
    int timeLimit = info[4].As<Napi::Number>();

    // create empty callback to pass to AsyncWorker
    Napi::Function callback = Napi::Function::New(env, EmptyCallback);

    // create AsyncWorker and queue for execution
    ReserveConstrainedSolverWorker *worker = new ReserveConstrainedSolverWorker(callback, deferred, previousRoutes, demands, reserves, durations, timeLimit);
    worker->Queue();
  }

  // return promise to JS
  return deferred.Promise();
}