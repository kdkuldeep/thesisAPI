{
    "targets": [{
        "target_name": "VRPSolver",
        "cflags!": [ "-fno-exceptions" ],
        "cflags_cc!": [ "-fno-exceptions" ],
        "sources": [
            "cpp_src/main.cc",
            "cpp_src/vrpSolver.cc",
            "cpp_src/wrapper.cc",
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