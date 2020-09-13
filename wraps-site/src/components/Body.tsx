import React from 'react';
import { Container } from '@material-ui/core';
import { ProjectsFormat, Location } from './App';
import ProjectsView from './ProjectsView';
import VersionsView from './VersionsView';
import VersionView from './VersionView';

function SelectBody(props: {
  projects: ProjectsFormat;
  location: Location;
  pathPrefix: string;
}) {
  if (props.location.project == null) {
    return (
      <ProjectsView projects={props.projects} pathPrefix={props.pathPrefix} />
    );
  }
  if (props.location.version == null) {
    return (
      <VersionsView project={props.projects.get(props.location.project)} />
    );
  }
  return (
    <VersionView
      ssr
      project={props.projects.get(props.location.project)}
      version={props.location.version}
    />
  );
}

export default function Body(props: {
  projects: ProjectsFormat;
  location: Location;
  pathPrefix: string;
}) {
  return (
    <Container>
      <SelectBody
        projects={props.projects}
        location={props.location}
        pathPrefix={props.pathPrefix}
      />
    </Container>
  );
}
