// @flow weak

import axios from 'axios';
import {
  getMethod,
  jsonHeader,
  defaultOptions,
  getLocationOrigin,
  postMethod
} from '../fetchTools';

export const login = (endpoint = 'api/login') => {
  const method  = postMethod.method;
  const headers = jsonHeader;
  const url     = `${getLocationOrigin()}/login`; // ${endpoint}
  const options = {...defaultOptions};

  return axios.request({
    method,
    url,
    withCredentials: true,
    ...headers,
    ...options
  })
  // .then(data => data)
  .catch(error => Promise.reject(error));
};
