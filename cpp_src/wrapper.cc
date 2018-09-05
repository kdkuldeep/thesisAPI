#include <iostream>

#include "wrapper.h"

Napi::FunctionReference VRPSolverWrapper::constructor;

Napi::Object VRPSolverWrapper::Init(Napi::Env env, Napi::Object exports)
{
  Napi::HandleScope scope(env);

  Napi::Function func = DefineClass(env, "VRPSolverWrapper", {
                                                                 InstanceMethod("getNumOfVehicles", &VRPSolverWrapper::getNumOfVehicles),
                                                                 InstanceMethod("getMatrix", &VRPSolverWrapper::getMatrix),
                                                                 InstanceMethod("solveProblem", &VRPSolverWrapper::solveProblem),
                                                             });

  constructor = Napi::Persistent(func);
  constructor.SuppressDestruct();

  exports.Set("VRPSolverWrapper", func);
  return exports;
}

VRPSolverWrapper::VRPSolverWrapper(const Napi::CallbackInfo &info) : Napi::ObjectWrap<VRPSolverWrapper>(info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  if (info.Length() != 2 || !info[0].IsNumber() || !info[1].IsArray())
  {
    Napi::TypeError::New(env, "Wrong Arguments").ThrowAsJavaScriptException();
  }

  Napi::Number numOfVehicles = info[0].As<Napi::Number>();

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

  this->solver = new VRPSolver(numOfVehicles, durationMatrix);
}

Napi::Value VRPSolverWrapper::getNumOfVehicles(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  int num = this->solver->getNumOfVehicles();
  return Napi::Number::New(env, num);
}

Napi::Value VRPSolverWrapper::getMatrix(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  std::vector<std::vector<int64>> matrix = this->solver->getMatrix();

  Napi::Array durationMatrix = Napi::Array::New(env);
  uint32_t numRows = matrix.size();
  uint32_t rowIndex;
  for (rowIndex = 0; rowIndex < numRows; rowIndex++)
  {
    Napi::Array rowDurations = Napi::Array::New(env);
    std::vector<int64> row = matrix[rowIndex];
    uint32_t numColumns = row.size();
    uint32_t columnIndex;
    for (columnIndex = 0; columnIndex < numColumns; columnIndex++)
    {
      Napi::Number duration = Napi::Number::New(env, matrix[rowIndex][columnIndex]);
      rowDurations.Set(columnIndex, duration);
    }
    durationMatrix.Set(rowIndex, rowDurations);
  }

  return durationMatrix;
}

Napi::Value VRPSolverWrapper::solveProblem(const Napi::CallbackInfo &info)
{
  Napi::Env env = info.Env();
  Napi::HandleScope scope(env);

  std::string solution = this->solver->solveProblem();
  return Napi::String::New(env, solution);
}