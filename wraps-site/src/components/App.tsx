import React from 'react';
import { useStaticQuery, graphql } from 'gatsby';
import Title from './Title';
import Body from './Body';

const defaultLocation = {
  project: null,
  version: null,
};

export type Location = {
  project: string | null;
  version: string | null;
};

type QueryData = {
  allReadmeRelationHelper: {
    nodes: {
      source_url: string;
      parent: {
        publicUrl: string;
        extension: 'md' | 'txt';
      };
    }[];
  };
  allIndexJson: {
    nodes: {
      descr: string;
      name: string;
      versions: {
        name: string;
        patch: string;
        wrap: string;
        readme: {
          href: string;
          url: string;
        };
      }[];
    }[];
  };
};
export type VersionInfo = {
  name: string;
  readme: {
    href: string;
    text_url: string;
    md: boolean;
  };
  wrap_url: string;
  patch_url: string;
};

export type VersionsFormat = Map<string, VersionInfo>;

export type ProjectInfo = {
  name: string;
  descr: string;
  versions: VersionsFormat;
};

export type ProjectsFormat = Map<string, ProjectInfo>;

function formatProject(data: QueryData): ProjectsFormat {
  return new Map(
    data.allIndexJson.nodes.map((project) => [
      project.name,
      {
        name: project.name,
        descr: project.descr,
        versions: new Map(
          project.versions.map((version) => [
            version.name,
            {
              name: version.name,
              readme: {
                href: version.readme.href,
                text_url: data.allReadmeRelationHelper.nodes.find(
                  (x) => x.source_url === version.readme.url,
                ).parent.publicUrl,
                md:
                  data.allReadmeRelationHelper.nodes.find(
                    (x) => x.source_url === version.readme.url,
                  ).parent.extension === 'md',
              },
              wrap_url: version.wrap,
              patch_url: version.patch,
            },
          ]),
        ),
      },
    ]),
  );
}

class App extends React.Component<
  { projects: ProjectsFormat; location: Location;},
  {}
> {
  render() {
    return (
      <div>
        <Title
          project={this.props.location.project}
          version={this.props.location.version}
        />
        <Body
          projects={this.props.projects}
          location={this.props.location}
        />
      </div>
    );
  }
}

export default function AppWrapper(props: Location & typeof defaultLocation) {
  const data = useStaticQuery<QueryData>(graphql`
    {
      allReadmeRelationHelper {
        nodes {
          source_url
          parent {
            ... on File {
              publicURL
              extension
            }
          }
        }
      }
      allIndexJson {
        nodes {
          descr
          name
          versions {
            name
            patch
            wrap
            readme {
              href
              url
            }
          }
        }
      }
    }
  `);
  console.log(data);
  return (
    <App
      projects={formatProject(data)}
      location={props}
    />
  );
}

AppWrapper.defaultProps = defaultLocation;
