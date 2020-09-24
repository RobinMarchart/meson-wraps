import React from 'react';
import { AppBar, Toolbar, Breadcrumbs, Typography, Box, IconButton } from '@material-ui/core';
import { GitHub } from '@material-ui/icons';
import { Link } from 'gatsby-theme-material-ui';
import { NavigateNext } from '@material-ui/icons';
import { Location } from './App';
function createBreadcrumbs(loc: Location) {
    if (loc.project == null) {
        return (
            <Breadcrumbs>
                <Box color="text.primary">
                    <Typography variant="h6">Overview</Typography>
                </Box>
            </Breadcrumbs>
        );
    }
    if (loc.version == null) {
        return (
            <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
                <Box color="text.primary">
                    <Link color="inherit" variant="h6" to="/">
                        Overview
                    </Link>
                </Box>
                <Box color="text.primary">
                    <Typography variant="h6">{loc.project}</Typography>
                </Box>
            </Breadcrumbs>
        );
    }
    return (
        <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
            <Box color="text.primary">
                <Link color="inherit" variant="h6" to="/">
                    Overview
            </Link>
            </Box>
            <Box color="text.primary">
                <Link color="inherit" variant="h6" to={`/${loc.project}`}>
                    {loc.project}
                </Link>
            </Box>
            <Box color="text.primary">
                <Typography variant="h6">{loc.version}</Typography>
            </Box>
        </Breadcrumbs>
    );
}

export default function Title(props: Location) {
    return (
        <AppBar position="sticky">
            <Toolbar>
                <Box display="flex" justifyContent="space-between" width="100%" flexWrap="wrap-reverse" color="text.primary" alignContent="space-around" alignItems="center">
                    <Box padding="7px">
                        {createBreadcrumbs(props)}
                    </Box>
                    <Box padding="7px">
                        <Typography variant="h5">Meson wraps collection</Typography>
                    </Box>
                    <Box padding="7px">
                        <IconButton color="inherit" href="https://github.com/robinmarchart/meson-wraps/" target="_blank" rel="noopener noreferrer" aria-label="View source on GitHub">
                            <GitHub color="inherit" />
                        </IconButton>
                    </Box>
                </Box>
            </Toolbar>
        </AppBar>
    );
}
