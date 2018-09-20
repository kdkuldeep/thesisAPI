#include <napi.h>
#include "solver.cc"

#include <napi.h>

Napi::Value EmptyCallback(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  return env.Undefined();
}

class SolverWorker : public Napi::AsyncWorker
{
public:
  SolverWorker(Napi::Function &callback, Napi::Promise::Deferred deferred, std::vector<int64> capacities, std::vector<int64> volumes, std::vector<std::vector<int64>> demands, std::vector<std::vector<int64>> durations)
      : Napi::AsyncWorker(callback), deferred(deferred), capacities(capacities), volumes(volumes), demands(demands), durations(durations) {}

  ~SolverWorker() {}

  // AsyncWorker ensures that all the code in the Execute function runs in the background
  // out of the event loop thread and at the end the OnOK or OnError function
  // will be called and are executed as part of the event loop.
  void Execute()
  {
    routes = solver(capacities, volumes, demands, durations);
  }

  // When the work on the Execute method is done the OnOk method is called
  // and the results return back to JavaScript invoking the stored callback
  // with its associated environment.
  void OnOK()
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

private:
  std::vector<std::vector<int>> routes;
  std::vector<int64> capacities;
  std::vector<int64> volumes;
  std::vector<std::vector<int64>> demands;
  std::vector<std::vector<int64>> durations;
  Napi::Promise::Deferred deferred;
};

Napi::Promise SolveAsyncPromise(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  // The Promise class, along with its Promise::Deferred class,
  // implement the ability to create, resolve, and reject Promise objects.
  Napi::Promise::Deferred deferred = Napi::Promise::Deferred::New(info.Env());

  // Check for incorrect arguments passed from JS and reject promise
  if (info.Length() < 4)
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Wrong number of arguments.").Value());
  }

  else if (!info[0].IsArray())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected array as first argument (vehicle capacities)").Value());
  }

  else if (!info[1].IsArray())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected array as second argument (order volumes)").Value());
  }

  else if (!info[2].IsArray())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected 2d array as third argument (product demands)").Value());
  }

  else if (!info[3].IsArray())
  {
    deferred.Reject(
        Napi::TypeError::New(env, "Expected 2d array as fourth argument (duration matrix)").Value());
  }

  else
  {

    // Get vehicle capacities from first argument
    std::vector<int64> capacities;
    Napi::Array capacitiesInput = info[0].As<Napi::Array>();
    for (uint32_t rowIndex = 0; rowIndex < capacitiesInput.Length(); rowIndex++)
    {
      int64 capacitiesValue = capacitiesInput.Get(rowIndex).As<Napi::Number>().Int64Value();
      capacities.push_back(capacitiesValue);
    }

    // Get order volumes from second argument
    std::vector<int64> volumes;
    Napi::Array volumesInput = info[1].As<Napi::Array>();
    for (uint32_t rowIndex = 0; rowIndex < volumesInput.Length(); rowIndex++)
    {
      int64 volumesValue = volumesInput.Get(rowIndex).As<Napi::Number>().Int64Value();
      volumes.push_back(volumesValue);
    }

    // Get product demands from third argument
    std::vector<std::vector<int64>> demands;
    Napi::Array demandsInput = info[3].As<Napi::Array>();
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

    // create empty callback to pass to AsyncWorker
    Napi::Function callback = Napi::Function::New(env, EmptyCallback);

    // create AsyncWorker and queue for execution
    SolverWorker *worker = new SolverWorker(callback, deferred, capacities, volumes, demands, durations);
    worker->Queue();
  }

  // return promise to JS
  return deferred.Promise();
}

/**
* This code is our entry-point. We receive two arguments here, the first is the
* environment that represent an independent instance of the JavaScript runtime,
* the second is exports, the same as module.exports in a .js file.
* You can either add properties to the exports object passed in or create your
* own exports object. In either case you must return the object to be used as
* the exports for the module when you return from the Init function.
*/
Napi::Object Init(Napi::Env env, Napi::Object exports)
{
  exports.Set(Napi::String::New(env, "solve"), Napi::Function::New(env, SolveAsyncPromise));
  return exports;
}

/**
* This code defines the entry-point for the Node addon, it tells Node where to go
* once the library has been loaded into active memory. The first argument must
* match the "target" in our *binding.gyp*. Using NODE_GYP_MODULE_NAME ensures
* that the argument will be correct, as long as the module is built with
* node-gyp (which is the usual way of building modules). The second argument
* points to the function to invoke. The function must not be namespaced.
*/
NODE_API_MODULE(NODE_GYP_MODULE_NAME, Init);
