{
    "targets": [{
        "target_name": "VRPSolver",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
            "cpp_src/addon.cc",
            "cpp_src/DataModel.cc",
            "cpp_src/CapacityConstrainedDataModel.cc",
            "cpp_src/CapacityConstrainedVRP.cc",
            "cpp_src/CapacityConstrainedVRPWrapper.cc",
            "cpp_src/ReserveConstrainedDataModel.cc",
            "cpp_src/ReserveConstrainedVRP.cc",
            "cpp_src/ReserveConstrainedVRPWrapper.cc",
            "cpp_src/EmptyCallback.cc"
        ],
        'include_dirs': [
            "<!@(node -p \"require('node-addon-api').include\")",
            "<(module_root_dir)/or_tools/include"
        ],
        # 'libraries': [],
        'link_settings': {
            'libraries': ["-lortools", "-lcvrptw_lib", "-ldimacs", "-lfap"],
            'library_dirs': ["<(module_root_dir)/or_tools/lib/"],
        },
        'dependencies': [
            "<!(node -p \"require('node-addon-api').gyp\")"
        ],
        'defines': [ 'NAPI_DISABLE_CPP_EXCEPTIONS' ],
        'msvs_settings': {
              'VCCLCompilerTool': {
                #   Compiler Options Listed Alphabetically
                #   https://msdn.microsoft.com/en-us/library/fwkeyyhe.aspx
                 'AdditionalOptions': [
                  '/GR', # 'RuntimeTypeInfo': 'true'
                  '/MD', # 'RuntimeLibrary': '2'
                  '/EHsc' # 'ExceptionHandling': 1
                ]
              },
        },
    }]
}