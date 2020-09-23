module.exports = {
  siteMetadata: {
    title: 'personal Meson wraps collection',
  },
  // Since `gatsby-plugin-typescript` is automatically included in Gatsby you
  // don't need to define it here (just if you need to change the options)
  plugins: [
    {
      resolve: `gatsby-source-filesystem`,
      options: {
        name: `data`,
        path: `${__dirname}/`,
        ignore: [`**`], // ignore files starting with a dot
      },
    },
    'gatsby-transformer-json',
    'gatsby-theme-material-ui',
    'gatsby-source-wraps-gen',
  ],
  pathPrefix: `/meson-wraps`,
};
