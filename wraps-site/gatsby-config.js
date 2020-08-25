module.exports = {
  siteMetadata: {
    title: 'personal Meson wraps collection',
  },
  // Since `gatsby-plugin-typescript` is automatically included in Gatsby you
  // don't need to define it here (just if you need to change the options)
  plugins: [
    {
      resolve: 'gatsby-source-filesystem',
      options: {
        name: 'wraps',
        path: `${__dirname}/../wraps_gen/`,
      },
    },
    'gatsby-transformer-json',
    'gatsby-theme-material-ui',
    'gatsby-transformer-remark',
    'gatsby-transformer-plaintext',
  ],
  pathPrefix: `/meson-wraps`,
};
