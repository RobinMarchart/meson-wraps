import React from 'react';
import {
    Box,
    Paper,
    Typography,
    Grid,
    Button,
    IconButton,
} from '@material-ui/core';
import ReactMarkdown from 'react-markdown';
import { OpenInNew, SentimentVeryDissatisfied } from '@material-ui/icons';
import { VersionInfo, ProjectInfo } from './App';
import ReadmeViewer from './ReadmeViewer';

export default function VersionView(
    props: {
        version: string;
        project: ProjectInfo;
    },
) {
    return (
        <Box>
            <Paper variant="outlined">
                <Box
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                    padding="10px"
                    marginBottom="30px"
                    flexDirection="column"
                >
                    <Typography variant="h3">
                        {`${props.project.name} - ${props.version}`}
                    </Typography>
                    <Box marginLeft="30px" marginRight="30px">
                        <Typography variant="subtitle1">
                            <ReactMarkdown source={props.project.descr} />
                        </Typography>
                    </Box>
                </Box>
            </Paper>
            <Paper variant="outlined">
                <Box padding="20px" paddingBottom="30px" marginBottom="30px">
                    <Grid container spacing={4}>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" justifyContent="center" padding="10px">
                                <Box
                                    display="flex"
                                    justifyContent="space-between"
                                    width="230px"
                                >
                                    <Button
                                        variant="contained"
                                        color="secondary"
                                        href={props.project.versions.get(props.version).wrap_url}
                                    >
                                        Download Wrap File
                  </Button>
                                    <IconButton
                                        size="small"
                                        color="secondary"
                                        href={props.project.versions.get(props.version).wrap_url}
                                    >
                                        <OpenInNew />
                                    </IconButton>
                                </Box>
                            </Box>
                        </Grid>
                        <Grid item xs={12} md={6}>
                            <Box display="flex" justifyContent="center" padding="10px">
                                <Button
                                    variant="contained"
                                    color="secondary"
                                    href={props.project.versions.get(props.version).patch_url}
                                >
                                    Download Patch
                </Button>
                            </Box>
                        </Grid>
                    </Grid>
                </Box>
            </Paper>
            <Paper variant="outlined">
                <Box paddingBottom="30px">
                    <noscript>
                        <Box
                            height="300px"
                            padding="20px"
                            display="flex"
                            justifyContent="space-around"
                            flexDirection="column"
                            flexWrap="nowrap"
                            alignItems="center"
                            alignContent="center"
                        >
                            <Typography variant="h5">Enable JavaScript to show Readme</Typography>
                            <Box fontSize="120pt">
                                <SentimentVeryDissatisfied fontSize="inherit" />
                            </Box>
                        </Box>
                    </noscript>
                    <ReadmeViewer url={props.project.versions.get(props.version).readme.text_url} />
                </Box>
            </Paper>
        </Box>
    );
}
