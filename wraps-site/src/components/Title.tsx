import React from 'react';
import { AppBar, Toolbar, Breadcrumbs, Typography } from '@material-ui/core';
import { Link } from 'gatsby-theme-material-ui';
import { NavigateNext } from '@material-ui/icons';
import { Location } from './App';

function createBreadcrumbs(loc: Location) {
  if (loc.project == null) {
    return (
      <Breadcrumbs>
        <Typography variant="h6">Overview</Typography>
      </Breadcrumbs>
    );
  }
  if (loc.version == null) {
    return (
      <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
        <Link color="inherit" variant="h6" to="/">
          Overview
        </Link>
        <Typography variant="h6">{loc.project}</Typography>
      </Breadcrumbs>
    );
  }
  return (
    <Breadcrumbs separator={<NavigateNext fontSize="small" />}>
      <Link color="inherit" variant="h6" to="/">
        Overview
      </Link>
      <Link color="inherit" variant="h6" to={`/${loc.project}`}>
        {loc.project}
      </Link>
      <Typography variant="h6">{loc.version}</Typography>
    </Breadcrumbs>
  );
}

export default function Title(props: Location) {
  return (
    <AppBar position="sticky">
      <Toolbar>
        {createBreadcrumbs(props)}
        <Typography variant="h5">Meson wraps collection</Typography>
      </Toolbar>
    </AppBar>
  );
}
