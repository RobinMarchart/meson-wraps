import React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Button,
  IconButton,
  Box,
  Typography,
} from '@material-ui/core';
import ReactMarkdown from 'react-markdown';
import { OpenInNew } from '@material-ui/icons';
import { ProjectInfo } from './App';
import ChildPopup from './ChildPopup';
import VersionView from './VersionView';

export function VersionsTable(props: {
  project: ProjectInfo;
  pathPrefix: string;
  setVersion: (version: string) => void;
}) {
  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            <TableCell>Version</TableCell>
            <TableCell>Wrap File</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array.from(props.project.versions.values()).map((version) => (
            <TableRow key={version.name}>
              <TableCell component="th" scope="row">
                <Button
                  href={`${props.pathPrefix}/${version.name}`}
                  variant="outlined"
                  onClick={(e) => {
                    e.preventDefault();
                    props.setVersion(version.name);
                  }}
                >
                  {version.name}
                </Button>
                <IconButton
                  href={`${props.pathPrefix}/${version.name}`}
                  target="_blank"
                  size="small"
                >
                  <OpenInNew />
                </IconButton>
              </TableCell>
              <TableCell>
                <Button
                  href={version.wrap_url}
                  download={`${props.project.name}.wrap`}
                >
                  Download
                </Button>
                <IconButton
                  href={version.wrap_url}
                  target="_blank"
                  size="small"
                >
                  <OpenInNew />
                </IconButton>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default class VersionsView extends React.Component<
  { project: ProjectInfo; pathPrefix: string },
  { version: string | null }
> {
  state: { version: string | null } = {
    version: null,
  };

  setVersion(version: string | null) {
    if (version == null) {
    { history.pushState(
      {},
      ``,
      `${this.props.pathPrefix}/${this.props.project.name}`,
    ); } else { window.history.pushState(
      {},
      ``,
      `${this.props.pathPrefix}/${this.props.project.name}/${version}`,
    );
    }
    this.setState({ version });
  }

  render() {
    return (
      <Box>
        <Paper>
          <Box
            display="flex"
            justifyContent="center"
            alignItems="center"
            padding="10px"
            marginBottom="10px"
            flexDirection="column"
          >
            <Typography variant="h3">{this.props.project.name}</Typography>
            <Box marginLeft="30px" marginRight="30px">
              <Typography variant="subtitle1">
                <ReactMarkdown source={this.props.project.descr} />
              </Typography>
            </Box>
          </Box>
        </Paper>
        <Paper>
          <VersionsTable
            project={this.props.project}
            pathPrefix={this.props.pathPrefix}
            setVersion={(version) => this.setVersion(version)}
          />
        </Paper>
        <ChildPopup
          closeHandler={() => this.setVersion(null)}
          open={this.state.version !== null}
        >
          <VersionView
            project={this.props.project}
            version={this.state.version}
          />
        </ChildPopup>
      </Box>
    );
  }
}
