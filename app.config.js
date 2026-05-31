const appJson = require('./app.json');

const googleMapsApiKey =
  process.env.GOOGLE_MAPS_API_KEY || process.env.EXPO_PUBLIC_GOOGLE_MAPS_API_KEY || '';

module.exports = () => {
  const config = appJson.expo;

  return {
    ...config,
    android: {
      ...config.android,
      config: {
        ...(config.android?.config || {}),
        googleMaps: {
          apiKey: googleMapsApiKey,
        },
      },
    },
    plugins: [
      ...(config.plugins || []),
      [
        'react-native-maps',
        {
          androidGoogleMapsApiKey: googleMapsApiKey,
        },
      ],
    ],
    extra: {
      ...(config.extra || {}),
      googleMapsApiKeyConfigured: Boolean(googleMapsApiKey),
      googleMapsApiKey,
    },
  };
};
