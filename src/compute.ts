
const canvas = document.createElement("canvas");
const ctx = canvas.getContext("2d");

export function clipToRange(value: number, min: number, max: number) {
    return Math.max(Math.min(value, max), min);
}

export function toGrayscale(imageData: ImageData) {
    // https://en.wikipedia.org/wiki/SRGB
    const newImage = ctx.createImageData(imageData);
    function putPixel(i, c) {
        newImage.data[i] = c & 0xFF;
        newImage.data[i+1] = c & 0xFF;
        newImage.data[i+2] = c & 0xFF;
        newImage.data[i+3] = 0xFF;
    }
    for (let i = 0; i < imageData.data.length; i += 4) {
        const R = imageData.data[i];
        const G = imageData.data[i+1];
        const B = imageData.data[i+2];
        const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
        putPixel(i, Y);
    }
    return newImage;
}

export function buildHistogram(imageData: ImageData) {
    const histogram = new Array(256).fill(0);
    for (let i = 0; i < imageData.data.length; i += 4) {
        const c = imageData.data[i];
        histogram[c]++;
    }
    return histogram;
}

// https://en.wikipedia.org/wiki/Otsu%27s_method
export function otsuLevels(histogram: number[]) {
    let total = 0;
    
    for (let i = 0; i < histogram.length; ++i) {
        total += histogram[i];
    }
    
    let sumF = 0;
    for (let i = 0; i < histogram.length; ++i) {
        sumF += i * histogram[i] / total;
    }
    let sumB = 0;
    let wB = 0;
    const levels = [];
    for (let i = 0; i < histogram.length; ++i) {
        const wF = 1 - wB;
        if (wB > 0 && wF > 0) {
            const mF = (sumF - sumB) / wF;
            const mB = sumB / wB;
            const val = wB * wF * Math.pow(mB - mF, 2);
            levels.push(val);
        } else {
            levels.push(0);
        }
        wB += histogram[i] / total;
        sumB += i * histogram[i] / total;
    }
    return levels;
}

export function argmax(values: number[]) {
    let maxValue = 0;
    let maxIndex = -1;
    for (let i = 0; i < values.length; ++i) {
        const val = values[i];
        if (val >= maxValue) {
            maxIndex = i;
            maxValue = val;
        }
    }
    return maxIndex;
}

export function binarization(imageData: ImageData, threshold: number) {
    const newImage = ctx.createImageData(imageData);
    function putPixel(i, c) {
        newImage.data[i] = c & 0xFF;
        newImage.data[i+1] = c & 0xFF;
        newImage.data[i+2] = c & 0xFF;
        newImage.data[i+3] = 0xFF;
    }
    for (let i = 0; i < imageData.data.length; i += 4) {
        putPixel(i, imageData.data[i] > threshold ? 0xFF : 0);
    }
    return newImage;
}

export function distanceImage(image: ImageData) {
    const result = new Uint8Array(image.width * image.height);
    function setValue(i, j, v) {
        result[i * image.width + j] = v;
    }
    function getValue(i, j) {
        return result[i * image.width + j];
    }
    for (let i = 0; i < image.height; i++) {
        for (let j = 0; j < image.width; j++) {
            setValue(i, j, image.data[(i * image.width + j) * 4] == 0 ? 1 : 0);
        }
    }
    let max = 0;
    for (let i = 1; i < image.height; i++) {
        for (let j = 1; j < image.width; j++) {
            const val = getValue(i, j);
            if (val > 0) {
                const val2 = getValue(i - 1, j);
                const val4 = getValue(i, j - 1);
                const minval = Math.min(Math.min(val2, val4) + 1, 255);
                max = Math.max(max, minval);
                setValue(i, j, minval);
            }
        }
    }
    for (let i = image.height - 1; i > 0; i--) {
        for (let j = image.width - 1; j > 0; j--) {
            const val = getValue(i, j);
            if (val > 0) {
                const val7 = getValue(i + 1, j);
                const val5 = getValue(i, j + 1);
                const minval = Math.min(Math.min(val5, val7) + 1, val);
                max = Math.max(max, minval);
                setValue(i, j, minval);
            }
        }
    }
    const newImage = ctx.createImageData(image.width, image.height);
    function putPixel(i: number, c: number) {
        newImage.data[i+0] = c & 0xFF;
        newImage.data[i+1] = c & 0xFF;
        newImage.data[i+2] = c & 0xFF;
        newImage.data[i+3] = 0xFF;
    }
    for (let i = 0; i < newImage.height; i++) {
        for (let j = 0; j < newImage.width; j++) {
            const v = Math.floor(255 * getValue(i, j) / max);
            putPixel((i * newImage.width + j) * 4, v);
        }
    }
    return { max, result, image: newImage };
}