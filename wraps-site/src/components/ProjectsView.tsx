import React from 'react';
import { ProjectsFormat } from './App';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  Modal,
  Fade,
  Typography,
  NoSsr,
} from '@material-ui/core';
import VersionsView from './VersionsView';
import ChildPopup from './ChildPopup';
import ReactMarkdown from 'react-markdown';
import { fixSlashUrl } from './utils';

export default class ProjectView extends React.Component<
  { projects: ProjectsFormat },
  { project: string | null }
> {
  state: { project: string | null } = {
    project: null,
  };

  setProjectUrl(project: string | null) {
    if (project === null) {
      window.history.pushState(
        {},
        '',
        new URL('..', window.location.href).toString(),
      );
    } else {
      window.history.pushState(
        {},
        '',
        new URL(project, window.location.href).toString(),
      );
    }
  }

  setProjectAndCancel<E>(
    e: React.MouseEvent<E, MouseEvent> | MouseEvent,
    project: string | null,
  ) {
    e.preventDefault();
    if (this.state.project !== project) {
      this.setProjectUrl(project);
      this.setState({ project: project });
    }
  }

  setProject(project: string | null) {
    if (this.state.project !== project) {
      this.setProjectUrl(project);
      this.setState({ project: project });
    }
  }

  render() {
    return (
      <div>
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Project</TableCell>
                <TableCell>Versions</TableCell>
                <TableCell>Description</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {Array.from(this.props.projects.values()).map((project) => {
                return (
                  <TableRow key={project.name}>
                    <TableCell component="th" scope="row">
                      <Button
                        href={`./${project.name}`}
                        variant="outlined"
                        onClick={(e) =>
                          this.setProjectAndCancel(e, project.name)
                        }
                      >
                        {project.name}
                      </Button>
                    </TableCell>
                    <TableCell>
                      <Typography>{project.versions.size}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography component="div">
                        <ReactMarkdown source={project.descr} />
                      </Typography>
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
        <ChildPopup
          open={this.state.project !== null}
          closeHandler={() => this.setProject(null)}
        >
          <VersionsView
            project={this.props.projects.get(this.state.project)}
            baseUrl={`./../${this.state.project}`}
          />
        </ChildPopup>
      </div>
    );
  }
}
