
import { file2image, simplepq, mean } from './util.js';
import { flickr } from './flickr.js';
import { getFeature, url2emb, embs2score } from './score.js';

const N_TAGS_USED = 10;
const N_ITERATIONS = 10;
const N_PARALLEL_QUERIES = 10;
const N_INITIAL_CLASSES = 10;
const N_PARALLEL_EVALUATIONS = 1;

const get_result = async (tag, model, source_emb) => {
    let winner = [null, null, null, null];
    const images = await flickr.tag2images(tag, N_PARALLEL_EVALUATIONS);
    const embedding = await Promise.all(images.map(image => {return url2emb(image[flickr.URLType], model)}));
    for(let i = 0; i < images.length; i++){
        if(!embedding[i]){
            continue;
        }
        const x = images[i];
        const url = x[flickr.URLType];
        const page_url = 'https://www.flickr.com/photos/' + x['owner'] + '/' + x['id'];
        const tags = x['tags'].split(' ');
        const score = embs2score(source_emb, embedding[i]);
        embedding[i].dispose();
        if(!winner[1] || winner[1] < score){
            winner = [url, score, page_url, tags];
        }
    }
    return winner;
}

const CLEAR = async (source, modelPromise, setImgs, stopFlag) => {
    const tags = {'town': [], 'people': [], 'cat': [], 'car': [], 'nature': [], 'sea': []};
    const model = await modelPromise;

    const img = await file2image(source);
    const [source_class, source_emb] = await Promise.all([model.classify(img, N_INITIAL_CLASSES), getFeature(model, img)]);

    const imgs_scores = [];
    const pq = [];
    
    function add_results(res){
        for(let r of res){
            const [url, score, page_url, ctags] = r;
            if(!url){
                continue;
            }
            if(imgs_scores.map(x => x[1]).includes(url)){
                continue;
            }
            if(imgs_scores.length >= N_INITIAL_CLASSES && score < imgs_scores[N_INITIAL_CLASSES - 1][0]){
                continue;
            }
            imgs_scores.push([score, url, page_url]);
            imgs_scores.sort((a, b) => b[0] - a[0]);
            const utags = [];
            while(utags.length < N_TAGS_USED && utags.length < ctags.length){
                const tag = ctags[Math.floor(Math.random() * Object.keys(ctags).length)];
                if(!utags.includes(tag)){
                    utags.push(tag);
                }
            }
            
            for(let tag of utags){
                if(!(tag in tags)){
                    tags[tag] = []
                }
                tags[tag].push(score);
                pq.push([mean(tags[tag]), tag, tags[tag].length]);
            }
        }
        setImgs(imgs_scores.slice());
    }

    const res = await Promise.all(source_class.map(t => get_result(t.className.replace(/,/g, ''), model, source_emb)));
    add_results(res);

    function next(){
        while(true){
            if(pq.length === 0){
                return Object.keys(tags)[Math.floor(Math.random() * Object.keys(tags).length)];
            } else {
                const pqres = simplepq(pq);
                const tag = pqres[1];
                if(pqres[2] === tags[tag].length){
                    return tag;
                }
            }
        }
    }

    for(let i = 0; i < N_ITERATIONS; i++){
        const ts = [];
        const ps = [];
        while(ts.length < N_PARALLEL_QUERIES){
            const t = next();
            if(!ts.includes(t)){
                ts.push(t);
                ps.push(get_result(t, model, source_emb));
            }
        }
        const res = await Promise.all(ps);
        if(stopFlag[0]){
            break;
        }
        add_results(res);
    }

    source_emb.dispose();
}

export default CLEAR;
