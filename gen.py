#! /usr/bin/env python3
import pathlib
import argparse
import json
import itertools
import re
import operator
import sys
import functools
import shutil
import urllib.parse
import os
import hashlib


class MacroSet:
    pattern = re.compile("@.*?@")

    def __init__(self):
        self.macros = {}

    def add_macro(self, name: str, replacement: str):
        self.macros[name] = replacement

    def replace_macros(
        self,
        text: str,
        failure_fn=lambda index, err: print(
            "Problem replacing macros at {index}: {err}".format(index=index, err=err),
            sys.stderr,
        ),
    ) -> str:
        return functools.reduce(
            operator.add,
            self.__insert_macros(text, self.pattern.finditer(text), failure_fn),
        )

    def __insert_macros(self, string, iter, failure_fn):
        start = 0
        for match in iter:
            yield string[start : match.start()]
            key = match.group()[1:-1]
            if key == "":
                yield "@"
            elif key in self.macros:
                yield self.macros[key]
            else:
                failure_fn(match.start(), "could not find {}".format(key))
                yield match.group()
            start = match.end()
        yield string[start:]


def to_ex_dir(p: str) -> pathlib.Path:
    path = pathlib.Path(p)
    if not path.is_dir():
        raise NotADirectoryError(p)
    return path


def to_opt_dir(p: str) -> pathlib.Path:
    path = pathlib.Path(p)
    if path.is_dir():
        return path
    if path.exists():
        raise NotADirectoryError(p)
    path.mkdir(parents=True, exist_ok=True)
    return path


def gen_version_dir(
    version_dir: pathlib.Path, out_dir: pathlib.Path, base_url: str
) -> str:
    macros = MacroSet()
    o_dir = out_dir / version_dir.name
    o_dir.mkdir(exist_ok=True)
    p_d = list(
        itertools.filterfalse(
            lambda cont: not cont.is_dir(), (x for x in version_dir.iterdir())
        )
    )
    if len(p_d) == 1:
        os.chdir(o_dir)
        patch_name = shutil.make_archive("patch", "gztar", p_d[0])
        macros.add_macro(
            "patch_url",
            urllib.parse.urljoin(
                base_url,
                "{project}/{version}/{patchname}".format(
                    project=out_dir.name,
                    version=o_dir.name,
                    patchname=pathlib.PurePath(patch_name).name,
                ),
            ),
        )
        with open(patch_name, "rb") as patch_f:
            macros.add_macro("patch_hash", hashlib.sha256(patch_f.read()).hexdigest())

    with (
        o_dir
        / ("{project}-{version}.wrap".format(project=out_dir.name, version=o_dir.name))
    ).open("w") as out:
        with (version_dir / "wrap.ini").open() as in_f:
            out.write(macros.replace_macros(in_f.read()))
    return o_dir.name


def gen_project_dir(
    project_dir: pathlib.Path, output_dir: pathlib.Path, base_url: str
) -> str:
    out_dir = output_dir / project_dir.name
    out_dir.mkdir(exist_ok=True)
    dir_content = [x for x in project_dir.iterdir()]
    versions = itertools.filterfalse(lambda d_cont: not d_cont.is_dir(), dir_content)
    version_names = [gen_version_dir(pro, out_dir, base_url) for pro in versions]
    project_info_template = project_dir / "project.json"

    def load_p(p):
        with p.open() as f:
            return json.load(f)

    project_info = (
        load_p(project_info_template) if project_info_template.is_file() else {}
    )
    project_info["versions"] = version_names
    with (out_dir / "project.json").open("w") as out_f:
        json.dump(project_info, out_f)
    return project_dir.name


def gen_root_dir(input: pathlib.Path, output: pathlib.Path, base_url: str):
    root_index_file = output / "index.json"
    dir_content = [x for x in input.iterdir()]
    projects = itertools.filterfalse(lambda d_cont: not d_cont.is_dir(), dir_content)
    project_names = [gen_project_dir(pro, output, base_url) for pro in projects]
    with root_index_file.open("w") as out_f:
        json.dump({"projects": project_names}, out_f)


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_dir", type=to_ex_dir)
    parser.add_argument("output_dir", type=to_opt_dir)
    parser.add_argument(
        "base_url", type=lambda url: urllib.parse.urlunparse(urllib.parse.urlparse(url))
    )
    args = parser.parse_args()
    gen_root_dir(
        args.input_dir.resolve(True), args.output_dir.resolve(True), args.base_url
    )


if __name__ == "__main__":
    main()
