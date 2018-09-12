#include <napi.h>
#include "solver.cc"

Napi::Value solverWrapped(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();

  // Check for correct arguments passed from JS
  if (info.Length() < 2)
  {
    Napi::TypeError::New(env, "Wrong number of arguments").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[0].IsNumber())
  {
    Napi::TypeError::New(env, "Expected int as first argument (number of vehicles)").ThrowAsJavaScriptException();
    return env.Null();
  }

  if (!info[1].IsArray())
  {
    Napi::TypeError::New(env, "Expected 2d array as second argument (cost matrix)").ThrowAsJavaScriptException();
    return env.Null();
  }

  // Get number of vehicles from first argument
  int numberOfVehicles = info[0].As<Napi::Number>().Int32Value();

  // Get cost matrix from second argument
  std::vector<std::vector<int64>> durationMatrix;

  Napi::Array matrix = info[1].As<Napi::Array>();
  uint32_t numRows = matrix.Length();
  uint32_t rowIndex;
  for (rowIndex = 0; rowIndex < numRows; rowIndex++)
  {
    std::vector<int64> rowDurations;
    Napi::Array row = matrix.Get(rowIndex).As<Napi::Array>();
    uint32_t numColumns = row.Length();
    uint32_t columnIndex;
    for (columnIndex = 0; columnIndex < numColumns; columnIndex++)
    {
      int64 duration = row.Get(columnIndex).As<Napi::Number>().Int64Value();
      rowDurations.push_back(duration);
    }
    durationMatrix.push_back(rowDurations);
  }

  // call the actual function and return result to JS
  std::string result = solver(numberOfVehicles, durationMatrix);

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
