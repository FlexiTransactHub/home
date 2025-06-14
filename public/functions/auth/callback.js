const { google } = require('google-auth-library');
const fetch = require('node-fetch');

exports.handler = async (event, context) => {
  if (event.httpMethod !== 'GET') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const code = event.queryStringParameters.code;
  if (!code) {
    return { statusCode: 400, body: 'Authorization code missing' };
  }

  const clientId = 'YOUR_GOOGLE_CLIENT_ID'; // Replace with your Google Client ID
  const clientSecret = 'YOUR_GOOGLE_CLIENT_SECRET'; // Replace with your Google Client Secret
  const redirectUri = 'https://flexitransact.com.ng/.netlify/functions/auth/callback';

  const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, redirectUri);
  const { tokens } = await oAuth2Client.getToken(code);
  oAuth2Client.setCredentials(tokens);

  // Store token in local storage via redirect (simplified for static site)
  const redirectUrl = 'https://flexitransact.com.ng/?authToken=' + encodeURIComponent(tokens.id_token);
  return {
    statusCode: 302,
    headers: { Location: redirectUrl },
    body: ''
  };
};