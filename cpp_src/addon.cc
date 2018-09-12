#include <napi.h>
#include "solver.cc"

Napi::Value solverWrapped(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  // Check for correct arguments passed from JS
  if (info.Length() < 4)
  {
    Napi::TypeError::New(env, "Wrong number of arguments.").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsArray())
  {
    Napi::TypeError::New(env, "Expected array as first argument (vehicle capacities)").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[1].IsArray())
  {
    Napi::TypeError::New(env, "Expected array as second argument (order volumes)").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[2].IsArray())
  {
    Napi::TypeError::New(env, "Expected 2d array as third argument (product demands)").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[3].IsArray())
  {
    Napi::TypeError::New(env, "Expected 2d array as fourth argument (duration matrix)").ThrowAsJavaScriptException();
    return env.Null();
  }

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

  // call the actual function and return result to JS
  std::string result = solver(capacities, volumes, demands, durations);

  return Napi::String::New(env, result);
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
  exports.Set("solve", Napi::Function::New(env, solverWrapped));
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
