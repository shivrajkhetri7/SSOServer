export default () => ({
    auth: {
      issuer: 'https://idp.topschool.co.in',
      accessTokenExpiresIn: 3600, // 1 hour
      refreshTokenExpiresIn: 86400 * 30, // 30 days
      authorizationCodeExpiresIn: 60000, // 1 minute
      sessionExpiresIn: 86400, // 24 hours
    },
    auth0: {
      domain: 'your-auth0-domain.auth0.com',
      clientId: 'your-auth0-client-id',
      clientSecret: 'your-auth0-client-secret',
      connection: 'Username-Password-Authentication',
    },
  });