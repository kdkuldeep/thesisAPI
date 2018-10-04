#ifndef CAPACITY_CONSTRAINED_VRP_WRAPPER_H
#define CAPACITY_CONSTRAINED_VRP_WRAPPER_H

#include <napi.h>
#include "CapacityConstrainedVRP.h"
#include "EmptyCallback.h"

class CapacityConstrainedSolverWorker : public Napi::AsyncWorker
{
private:
  std::vector<std::vector<int>> routes;
  Napi::Promise::Deferred deferred;
  std::vector<int64> capacities;
  std::vector<int64> volumes;
  std::vector<std::vector<int64>> durations;
  int timeLimit;

public:
  CapacityConstrainedSolverWorker(Napi::Function &callback,
                                  Napi::Promise::Deferred deferred,
                                  std::vector<int64> capacities,
                                  std::vector<int64> volumes,
                                  std::vector<std::vector<int64>> durations,
                                  int timeLimit);

  ~CapacityConstrainedSolverWorker();

  // AsyncWorker ensures that all the code in the Execute function runs in the background
  // out of the event loop thread and at the end the OnOK or OnError function
  // will be called and are executed as part of the event loop.
  void Execute();

  // When the work on the Execute method is done the OnOk method is called
  // and the results return back to JavaScript invoking the stored callback
  // with its associated environment.
  void OnOK();
};

Napi::Promise solveAsyncWithCapacityConstraints(const Napi::CallbackInfo &info);

#endif