export const file2image = async (file) => {
    const bitmap = await createImageBitmap(file);
    const [width, height] = [bitmap.width, bitmap.height];
    const canvas = document.createElement('canvas');
    canvas.setAttribute('width', width);
    canvas.setAttribute('height', height);
    const ctx = canvas.getContext('2d');
    ctx.drawImage(bitmap, 0, 0);
    return ctx.getImageData(0, 0, width, height);    
}

// A simple yet slow implementation of a priority queue
export const simplepq = (pq) => {
    let mind = null;
    for(let i = 0; i < pq.length; i += 1){
        if((!mind) || pq[i][0] > pq[mind][0]){
            mind = i;
        }
    }
    const res = pq[mind].slice();
    pq.splice(mind, 1);
    return res;
}

export const mean = (array) => {
    const sum = array.reduce((a, b) => a + b, 0);
    return sum / array.length;
}

export const now = () => {
    var date = new Date();
    return date.getTime();
}