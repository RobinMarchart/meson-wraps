const TsconfigPathsPlugin = require('tsconfig-paths-webpack-plugin');
const path = require('path');
const child_process = require('child_process');
const process = require('process');
const {
  createRemoteFileNode,
  createFileNodeFromBuffer,
} = require('gatsby-source-filesystem');
const fetch = require('node-fetch');
const crypto = require('crypto');

exports.onCreateWebpackConfig = ({ actions }) => {
  actions.setWebpackConfig({
    resolve: {
      plugins: [new TsconfigPathsPlugin()],
    },
  });
};

async function pandocToMd(input_format, input_stream) {
  let pandoc = child_process.exec(`pandoc -f ${input_format} -t gfm -`, {
    encoding: 'binary',
    windowsHide: true,
  });
  let pandoc_promise = new Promise((resolve, reject) => {
    let exit_guard = { exit: false };
    pandoc.on('exit', (code) => {
      if (exit_guard.exit) return;
      exit_guard.exit = true;
      if (code == 0) {
        resolve();
      } else reject(new Error(`pandoc exited abnormally: exitcode ${code}`));
    });
    pandoc.on('error', (error) => {
      if (exit_guard.exit) return;
      exit_guard.exit = true;
      reject(error);
    });
  });
  input_stream.pipe(pandoc.stdin);
  pandoc.stderr.pipe(process.stderr);
  pandoc.stdout.setEncoding('binary');
  let bufferPromise = new Promise((resolve, reject) => {
    let bufs = [];
    pandoc.stdout.on('data', (d) => {
      if (!Buffer.isBuffer(d)) bufs.push(Buffer.from(d));
      else bufs.push(d);
    });
    pandoc.stdout.on('end', () => resolve(Buffer.concat(bufs)));
    pandoc.stdout.on('error', (e) => reject(e));
  });
  await pandoc_promise;
  return await bufferPromise;
}

async function getReadme(url, parentNode, getCache, createNode, createNodeId) {
  let ext = path.extname(url.pathname);
  switch (ext) {
    case '':
    case '.txt': {
      console.log(`adding plain-text Readme from ${url.href}`);
      return await createRemoteFileNode({
        url: url.href,
        parentNodeId: parentNode.id,
        getCache,
        createNode,
        createNodeId,
        ext: '.txt',
      });
    }
    case '.md': {
      console.log(`adding Markdown Readme from ${url.href}`);
      return await createRemoteFileNode({
        url: url.href,
        parentNodeId: parentNode.id,
        getCache,
        createNode,
        createNodeId,
        ext: '.md',
      });
    }
    case '.rst': {
      console.log(`converting rst Readme from ${url.href} to md using pandoc`);
      let response = await fetch(url.href);
      if (!response.ok) throw new Error(response.statusText);
      readme_buffer = await pandocToMd('rst', response.body);
      return await createFileNodeFromBuffer({
        buffer: readme_buffer,
        parentNodeId: parentNode.id,
        getCache,
        createNode,
        createNodeId,
        ext: '.md',
      });
    }
    default:
      throw new Error(`No way to include ${url.href} found`);
  }
}

exports.onCreateNode = async ({
  node,
  getCache,
  getNode,
  createNodeId,
  actions,
}) => {
  const { createNode, createParentChildLink, createNodeField } = actions;
  if (node.internal.type === 'ProjectsJson') {
    return await Promise.all(
      node.versions.map(async (version) => {
        if (version.readme.url !== '') {
          try {
            //createParentChildLink({ parent: node, child: relationNode });
            let childNode = await getReadme(
              new URL(version.readme.url),
              node,
              getCache,
              createNode,
              createNodeId,
            );
            //createParentChildLink({ parent: relationNode, child: childNode });
            let relationNode = await createNode({
              source_url: version.readme.url,

              id: createNodeId(
                `${node.name}${version.name}${version.readme.url}`,
              ),
              parent: childNode.id,
              children: [],
              internal: {
                type: 'ReadmeRelationHelper',
                contentDigest: crypto
                  .createHash('md5')
                  .update(version.readme.url)
                  .digest('hex'),
                description:
                  'Relation helper correlating a file child with a source url',
              },
            });
            console.log(`added readme from ${version.readme.url}`);
          } catch (e) {
            console.error(e);
          }
        }
      }),
    );
  }
};

exports.createPages = async ({ graphql, actions }) => {
  function formatProject(data) {
    return new Map(
      data.allProjectsJson.nodes.map((project) => [
        project.name,
        project.versions.map((version) => version.name),
      ]),
    );
  }
  const { createPage } = actions;
  const result = await graphql(`
    {
      allProjectsJson {
        nodes {
          name
          versions {
            name
          }
        }
      }
    }
  `);

  formatProject(result.data).forEach((versions, project_name) => {
    createPage({
      path: encodeURIComponent(project_name) + '/',
      component: path.resolve(`./src/templates/project.tsx`),
      context: {
        // Data passed to context is available
        // in page queries as GraphQL variables.
        project: project_name,
      },
    });
    versions.forEach((version) => {
      createPage({
        path: `${encodeURIComponent(project_name)}/${encodeURIComponent(
          version,
        )}/`,
        component: path.resolve(`./src/templates/version.tsx`),
        context: {
          project: project_name,
          version: version,
        },
      });
    });
  });
};
