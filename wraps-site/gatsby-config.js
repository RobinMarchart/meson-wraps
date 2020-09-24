module.exports = {
  siteMetadata: {
    title: 'Meson wraps',
    description: 'Personal meson wraps collection',
    author: 'Robin Marchart',
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
    'gatsby-plugin-react-helmet'
  ],
  pathPrefix: `/meson-wraps`,
};
