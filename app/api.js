// import axios from 'axios';
import config from './config';

export default class APIService {
    getApiUrl = (entry) => `${ config.api.endpoints[entry] || '' }`;

    requestGet(entry, uri) {
        console.log(`Requesting GET ${ this.getApiUrl(entry) }${ uri || '' }`);
        // return axios.get(`${ this.getApiUrl(entry) }${ uri || '' }`);
    }

    requestPost(entry, params, uri) {
        console.log(`Sending POST request to ${ this.getApiUrl(entry) }${ uri || '' }`);
        // return axios.post(`${ this.getApiUrl(entry) }${ uri || '' }`, params);
    }
};
