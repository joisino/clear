
import * as tf from '@tensorflow/tfjs';
import { file2image } from './util.js';

const IMAGE_SIZE = 224;
export const getFeature = async (model, img) => {
    return tf.tidy(() => {
        if (!(img instanceof tf.Tensor)) {
          img = tf.browser.fromPixels(img);
        }
  
        // Normalize the image from [0, 255] to [inputMin, inputMax].
        const normalized = tf.add(
            tf.mul(tf.cast(img, 'float32'), model.normalizationConstant),
            model.inputMin);
  
        // Resize the image to
        let resized = normalized;
        if (img.shape[0] !== IMAGE_SIZE || img.shape[1] !== IMAGE_SIZE) {
          const alignCorners = true;
          resized = tf.image.resizeBilinear(
              normalized, [IMAGE_SIZE, IMAGE_SIZE], alignCorners);
        }
  
        // Reshape so we can pass it to predict.
        const batched = tf.reshape(resized, [-1, IMAGE_SIZE, IMAGE_SIZE, 3]);

        const embeddingName = 'module_apply_default/MobilenetV2/expanded_conv_16/project/BatchNorm/FusedBatchNorm';
        const internal = model.model.execute(batched, embeddingName);
        return tf.reshape(internal, [-1]);
    });
}

export const url2emb = async (url, model) => {
    try {
        const response = await fetch(url);
        const file = await response.blob();
        const img = await file2image(file);
        const emb = await getFeature(model, img);
        return emb;
    } catch {
        return null;
    }
}

export const embs2score = (emb1, emb2) => {
    return tf.tidy(() => {
        return Math.exp(emb1.mul(emb2).sum().dataSync()[0] / 1000);
    });
}