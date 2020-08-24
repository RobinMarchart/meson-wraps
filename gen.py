#! /usr/bin/env python3
import pathlib
import argparse
import json
import itertools
import shutil
import os
import hashlib
import typing


class Readme:
    href: str = ""
    url: str = ""

    def from_dict(dictionary) -> "Readme":
        readme: Readme = Readme()
        if isinstance(dictionary, dict):
            if "href" in dictionary:
                readme.href = dictionary["href"]
            if "url" in dictionary:
                readme.url = dictionary["url"]
        return readme

    def to_dict(self) -> dict:
        if self.href == "":
            self.href = self.url
        return {"href": self.href, "url": self.url}


class Version:
    name: str = ""
    wrap: str = ""
    patch: str = ""
    readme: Readme = Readme()

    @staticmethod
    def from_dict(dictionary) -> "Version":
        version: Version = Version()
        if isinstance(dictionary, dict):
            if "name" in dictionary:
                version.name = dictionary["name"]
            if "wrap" in dictionary:
                version.wrap = dictionary["wrap"]
            if "patch" in dictionary:
                version.patch = dictionary["patch"]
            if "readme" in dictionary:
                version.readme = Readme.from_dict(dictionary["readme"])
        return version

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "wrap": self.wrap,
            "patch": self.patch,
            "readme": self.readme.to_dict(),
        }


class Project:
    name: str = ""
    descr: str = ""
    versions: typing.List[Version] = []

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "descr": self.descr,
            "versions": [version.to_dict() for version in self.versions],
        }


class ProjectTemplate:
    name: str = ""
    descr: str = ""
    readme: Readme = Readme()

    @staticmethod
    def from_dict(dictionary) -> "ProjectTemplate":
        proj: ProjectTemplate = ProjectTemplate()
        if isinstance(dictionary, dict):
            if "name" in dictionary:
                proj.name = dictionary["name"]
            if "descr" in dictionary:
                proj.descr = dictionary["descr"]
            if "readme" in dictionary:
                proj.readme = Readme.from_dict(dictionary["readme"])
        return proj

    def __processVersion(self, version: Version) -> Version:
        if version.readme.href == "":
            version.readme.href = self.readme.href.format(version=version.name)
        if version.readme.url == "":
            version.readme.url = self.readme.url.format(version=version.name)
        return version

    def to_project(self, versions: typing.List[Version]):
        proj: Project = Project()
        proj.name = self.name
        proj.descr = self.descr
        proj.versions = [self.__processVersion(v) for v in versions]
        return proj


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
    version_dir: pathlib.Path, out_dir: pathlib.Path, project_name: str
) -> Version:
    macros: typing.Dict[str, str] = {}

    version = Version()
    if (version_dir / "version.json").is_file():
        with (version_dir / "version.json").open() as version_f:
            version = Version.from_dict(json.load(version_f))
    if version.name == "":
        version.name = version_dir.name
    if version.patch == "":
        p_d = list(
            itertools.filterfalse(
                lambda cont: not cont.is_dir(), (x for x in version_dir.iterdir())
            )
        )
        if len(p_d) == 1:
            patch_file = shutil.make_archive(
                "patch-{project}-{version}".format(
                    project=project_name, version=version.name
                ),
                "gztar",
                p_d[0],
            )
            version.patch = os.path.abspath(patch_file)
            with open(patch_file, "rb") as patch_f:
                macros["patch_hash"] = hashlib.sha256(patch_f.read()).hexdigest()

    if version.wrap == "":
        path = out_dir / (
            "{project}-{version}.wrap".format(
                project=project_name, version=version.name
            )
        )
        with path.open("w") as out_f:
            with (version_dir / "wrap.ini").open() as in_f:
                out_f.write(in_f.read().format_map(macros))
        version.wrap = str(path)
    return version


def gen_project_dir(project_dir: pathlib.Path, output_dir: pathlib.Path) -> Project:
    project_template: ProjectTemplate = ProjectTemplate()
    if (project_dir / "project.json").is_file():
        with (project_dir / "project.json").open() as project_f:
            project_template = ProjectTemplate.from_dict(json.load(project_f))
    if project_template.name == "":
        project_template.name = project_dir.name
    dir_content = project_dir.iterdir()
    versions = itertools.filterfalse(lambda d_cont: not d_cont.is_dir(), dir_content)
    versions = [
        gen_version_dir(pro, output_dir, project_template.name) for pro in versions
    ]
    return project_template.to_project(versions)


def gen_root_dir(input: pathlib.Path, output: pathlib.Path):
    root_index_file = output / "projects.json"
    files_output_dir = output / "files"
    files_output_dir.mkdir(exist_ok=True)
    os.chdir(files_output_dir)
    dir_content = input.iterdir()
    projects = itertools.filterfalse(lambda d_cont: not d_cont.is_dir(), dir_content)
    projects = [gen_project_dir(pro, files_output_dir) for pro in projects]
    with root_index_file.open("w") as out_f:
        json.dump(
            [project.to_dict() for project in projects], out_f, indent=4, sort_keys=True
        )


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_dir", type=to_ex_dir)
    parser.add_argument("output_dir", type=to_opt_dir)
    args = parser.parse_args()
    gen_root_dir(args.input_dir.resolve(True), args.output_dir.resolve(True))


if __name__ == "__main__":
    main()
