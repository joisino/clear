import axios from 'axios';
import { now } from './util.js';

class FlickrEnv  {
    constructor () {
        this.URLType = 'url_n'
        this.tagCache = {};
    }
    
    async flickrapi_photo (tag, maxUploadDate) {
        const key = process.env.REACT_APP_FLICKR_KEY;
        return axios.get('https://www.flickr.com/services/rest/', {
            params: {
                method: 'flickr.photos.search',
                api_key: key,
                text: tag,
                max_upload_date: maxUploadDate,
                per_page: 30,
                extras: 'tags,' + this.URLType,
                format: 'json',
                nojsoncallback: true
            }
        });
    }
    
    async tag2images (tag, size) {
        if (!(tag in this.tagCache)) {
            const maxUploadDate = Math.floor(now() / 1000 - 60 * 60 * 24 * 365 * 3 * Math.random());
            const res = await this.flickrapi_photo(tag, maxUploadDate);
            this.tagCache[tag] = [0, res.data.photos.photo];
        }
        const photo_list = this.tagCache[tag][1];
        const start = this.tagCache[tag][0];
        const res = [];
        for(; this.tagCache[tag][0] < photo_list.length && this.tagCache[tag][0] < start + size; this.tagCache[tag][0]++){
            res.push(photo_list[this.tagCache[tag][0]]);
        }
        return res;
    }
}

export const flickr = new FlickrEnv();
