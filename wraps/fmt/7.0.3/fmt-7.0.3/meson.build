project('fmt','cpp',version:'7.0.3',license:'MIT',default_options : ['cpp_std=c++14'])

fmt_inc = include_directories('include')

if get_option('header_only')
 fmt_dep = declare_dependency(include_directories : fmt_inc,compile_args:'-DFMT_HEADER_ONLY')
 else
fmt_private_cpp_args = [ ]
fmt_interface_cpp_args = [ ]
libtype = get_option('default_library')
if libtype == 'shared'
    fmt_private_cpp_args += [ '-DFMT_EXPORT' ]
    fmt_interface_cpp_args += [ '-DFMT_SHARED' ]
endif

fmt_lib = library('fmt',
    sources : [
        'src/format.cc',
        'src/os.cc'
    ],
    cpp_args : fmt_private_cpp_args,
    include_directories : fmt_inc
)

fmt_dep = declare_dependency(
    include_directories : fmt_inc,
    compile_args : fmt_interface_cpp_args,
    link_with : fmt_lib
)
endif

meson.override_dependency('fmt',fmt_dep)
meson.override_dependency('fmt-7',fmt_dep)
meson.override_dependency('fmt-7.0',fmt_dep)
meson.override_dependency('fmt-7.0.3',fmt_dep)
