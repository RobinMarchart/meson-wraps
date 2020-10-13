#! /usr/bin/env python3
import pathlib
import argparse
import json
import itertools
import shutil
import os
import hashlib
import typing
import urllib.parse
import logging
import logging.config

class Readme:
    def __init__(self):
        self.href:str=""
        self.url:str=""

    @staticmethod
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

    def __repr__(self):
        return repr(self.to_dict())


class Version:
    def __init__(self):
        self.name:str=""
        self.wrap:str=""
        self.patch:str=""
        self.readme:Readme=Readme()

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

    def __repr__(self):
        return repr(self.to_dict())


class Project:
    def __init__(self,name:str,descr:str,versions:typing.List[Version]):
        self.name:str=name
        self.descr:str=descr
        self.versions:typing.List[Version]=versions

    def to_dict(self) -> dict:
        return {
            "name": self.name,
            "descr": self.descr,
            "versions": [version.to_dict() for version in self.versions],
        }

    def __repr__(self):
        return repr(self.to_dict())


class ProjectTemplate:
    def __init__(self):
        self.name:str=""
        self.descr:str=""
        self.readme:Readme=Readme()

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
        logging.info("Finished generating version {0}".format(version.name))
        logging.debug("Generated version: {0!s}\n".format(version))
        return version

    def to_project(self, versions: typing.Iterable[Version]):
        return Project(self.name,self.descr,[self.__processVersion(v) for v in versions])

    def __repr__(self):
        return repr(
            {
                "name": self.name,
                "descr": self.descr,
                "readme": self.readme,
            }
        )


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

def sha256(file_name):
    with open(file_name,"rb") as patch_f:
        return hashlib.sha256(patch_f.read()).hexdigest()

def gen_version_dir(
    version_dir: pathlib.Path, out_dir: pathlib.Path, project_name: str, url_base: str
) -> Version:
    macros: typing.Dict[str, str] = {}

    version = Version()
    if (version_dir / "version.json").is_file():
        with (version_dir / "version.json").open() as version_f:
            version = Version.from_dict(json.load(version_f))
    if version.name == "":
        version.name = version_dir.name
    logging.info("Generating version {0}".format(version.name))
    out = out_dir / project_name / version.name
    out.mkdir(parents=True, exist_ok=True)
    if version.patch == "":
        p_d = list(
            itertools.filterfalse(
                lambda cont: not cont.is_dir(), (x for x in version_dir.iterdir())
            )
        )
        if len(p_d) == 1:
            os.chdir(out)
            patch_file = shutil.make_archive(
                "patch",
                "gztar",
                root_dir=version_dir,
                base_dir=p_d[0].name,
            )
            patch_hash=sha256(patch_file)
            os.rename(patch_file,"patch-{project}-{version}-{hash}.tar.gz".format(
                project=project_name,version=version.name,hash=patch_hash
            ))
            version.patch = urllib.parse.urljoin(
                url_base,
                "{project}/{version}/patch-{project}-{version}-{hash}.tar.gz".format(
                    project=project_name, version=version.name,hash=patch_hash
                ),
            )
            macros["patch_url"] = version.patch
            macros["patch_hash"] = patch_hash

    if version.wrap == "":
        path = out / "tmp.wrap"

        with path.open("w") as out_f:
            with (version_dir / "wrap.ini").open() as in_f:
                out_f.write(in_f.read().format_map(macros))
        wrap_hash=sha256(path)
        path.rename("{project}-{version}-{hash}.wrap".format(
            project=project_name, version=version.name, hash=wrap_hash
        ))
        version.wrap = urllib.parse.urljoin(
            url_base,
            "{project}/{version}/{project}-{version}-{hash}.wrap".format(
                project=project_name, version=version.name, hash=wrap_hash
            ),
        )
    logging.debug("version template: {0!s}\n".format(version))
    return version


def gen_project_dir(
    project_dir: pathlib.Path, output_dir: pathlib.Path, url_base: str
) -> Project:
    project_template: ProjectTemplate = ProjectTemplate()
    if (project_dir / "project.json").is_file():
        with (project_dir / "project.json").open() as project_f:
            project_template = ProjectTemplate.from_dict(json.load(project_f))
    if project_template.name == "":
        project_template.name = project_dir.name
    logging.info("Generating project {0}".format(project_template.name))
    logging.debug("Project template: {0!s}\n".format(project_template))
    dir_content: typing.Iterable[pathlib.Path] = itertools.filterfalse(lambda d_cont: not d_cont.is_dir(), project_dir.iterdir())
    versions: typing.Iterable[Version] = (
        gen_version_dir(pro, output_dir, project_template.name, url_base)
        for pro in dir_content
    )
    project:Project=project_template.to_project(versions)
    logging.info("Finished generating project {0}".format(project.name))
    logging.debug("Generated project: {0!s}\n".format(project))
    return project;


def gen_root_dir(input: pathlib.Path, output: pathlib.Path, url_base: str):
    output.mkdir(exist_ok=True)
    dir_content: typing.Iterable[pathlib.Path] = itertools.filterfalse(
        lambda d_cont: not d_cont.is_dir(), input.iterdir()
    )
    projects: typing.Iterable[Project] = (
        gen_project_dir(pro, output, url_base) for pro in dir_content
    )
    with (output / "index.json").open("w") as out_f:
        json.dump(
            [project.to_dict() for project in projects], out_f, indent=4, sort_keys=True
        )
    logging.info("Finished generating projects")

class LoggerConfigAction(argparse.Action):
    def __init__(self, option_strings, dest):
        super().__init__(option_strings, dest,required=False)

    def __call__(self, parser, namespace, values, option_string=None):
        logging.config.fileConfig(values);

def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("input_dir", type=to_ex_dir)
    parser.add_argument("output_dir", type=to_opt_dir)
    parser.add_argument("url_base")
    parser.add_argument("--logger-config",action=LoggerConfigAction)
    args = parser.parse_args()
    gen_root_dir(
        args.input_dir.resolve(True), args.output_dir.resolve(True), args.url_base
    )


if __name__ == "__main__":
    logging.basicConfig(level=logging.INFO)
    main()
