import React from 'react';
import { ProjectsFormat, Location } from './App';
import { Container } from '@material-ui/core';
import ProjectsView from './ProjectsView';
import VersionsView from './VersionsView';
import VersionView from './VersionView';

function SelectBody(props: { projects: ProjectsFormat; location: Location }) {
  if (props.location.project == null) {
    return <ProjectsView projects={props.projects} />;
  } else if (props.location.version == null) {
    return (
      <VersionsView project={props.projects.get(props.location.project)} />
    );
  } else
    return (
      <VersionView
        ssr={true}
        project={props.projects.get(props.location.project)}
        version={props.location.version}
      />
    );
}

export default function Body(props: {
  projects: ProjectsFormat;
  location: Location;
}) {
  return (
    <Container>
      <SelectBody projects={props.projects} location={props.location} />
    </Container>
  );
}
