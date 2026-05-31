import { API_BASE_URL, USE_MOCK_API } from './config';

const getUrl = (path) => `${API_BASE_URL}${path}`;

const handleResponse = async (response) => {
  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`HTTP ${response.status}: ${errorText}`);
  }
  return response.json();
};

export async function httpGet(path) {
  if (USE_MOCK_API) {
    throw new Error('Mock API mode enabled; use service implementation instead.');
  }
  const response = await fetch(getUrl(path));
  return handleResponse(response);
}

export async function httpPost(path, body) {
  if (USE_MOCK_API) {
    throw new Error('Mock API mode enabled; use service implementation instead.');
  }
  const response = await fetch(getUrl(path), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });
  return handleResponse(response);
}
