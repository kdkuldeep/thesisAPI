#include <napi.h>
#include "vrpSolver.h"

/**
* The ObjectWrap class can be used to expose C++ code to JavaScript. 
* To do this you need to extend the ObjectWrap class that contain all the plumbing 
* to connect JavaScript code to a C++ object. 
* Classes extending ObjectWrap can be instantiated from JavaScript using the new operator, 
* and their methods can be directly invoked from JavaScript. 
* The wrap word refers to a way to group methods and state of your 
* class because it will be your responsibility to write custom code to bridge 
* each of your C++ class methods.
*/

class VRPSolverWrapper : public Napi::ObjectWrap<VRPSolverWrapper>
{
public:
  static Napi::Object Init(Napi::Env env, Napi::Object exports);
  VRPSolverWrapper(const Napi::CallbackInfo &info);

private:
  static Napi::FunctionReference constructor;                   // reference to store the class definition that needs to be exported to JS
  Napi::Value getNumOfVehicles(const Napi::CallbackInfo &info); // wrapped getNumOfVehicles function
  Napi::Value getMatrix(const Napi::CallbackInfo &info);        // wrapped getMatrix function
  Napi::Value solveProblem(const Napi::CallbackInfo &info);     // wrapped solveProblem function
  VRPSolver *solver;                                            // internal instance of VRPSolver used to perform actual operations
};
