
export function clipToRange(value: number, min: number, max: number) {
    return Math.max(Math.min(value, max), min);
}



abstract class ImageBuffer {
    constructor (public width: number, public height: number) {}

    getPixelClamped(x: number, y: number) {
        const xx = Math.max(0, Math.min(this.width-1, x));
        const yy = Math.max(0, Math.min(this.height-1, y));
        return this.getPixel(xx, yy);
    }
    
    abstract getPixel(x: number, y: number);

    abstract putPixel(x: number, y: number, c: number);
}

class ImageDataBuffer extends ImageBuffer {
    constructor(private imageData: ImageData) { super(imageData.width, imageData.height); }
    
    putPixel(x: number, y: number, c: number) {
        this.imageData.data[(y*this.imageData.width + x)*4] = c & 0xFF;
        this.imageData.data[(y*this.imageData.width + x)*4+1] = c & 0xFF;
        this.imageData.data[(y*this.imageData.width + x)*4+2] = c & 0xFF;
        this.imageData.data[(y*this.imageData.width + x)*4+3] = 0xFF;
    }
    
    getPixel(x: number, y: number) {
        return this.imageData.data[(y*this.width + x)*4];
    }

    getRGB(x: number, y: number) {
        const i = (y*this.width+x)*4;
        const R = this.imageData.data[i];
        const G = this.imageData.data[i+1];
        const B = this.imageData.data[i+2];
        const A = this.imageData.data[i+2];
        return { R, G, B, A };
    }
}

class FloatBuffer extends ImageBuffer {
    public buffer: Float32Array;
    constructor(width: number, height: number) {
        super(width, height);
        this.buffer = new Float32Array(width * height);
    }

    getPixel(x: number, y: number) {
        return this.buffer[y*this.width + x];
    }
    
    putPixel(x: number, y: number, c: number) {
        this.buffer[y*this.width + x] = c;
    }
}

function convolve(input: ImageBuffer, kernel: number[][], output: ImageBuffer) {
    const size = (kernel.length - 1) / 2;
    for (let y = 0; y < input.height; ++y) {
        for (let x = 0; x < input.width; ++x) {
            let resultPixel = 0;
            for (let ky = 0; ky < kernel.length; ++ky) {
                for (let kx = 0; kx < kernel.length; ++kx) {
                    const inPixel = input.getPixelClamped(x - size + kx, y - size + ky);
                    resultPixel += inPixel * kernel[ky][kx];                    
                }
            }
            output.putPixel(x, y, resultPixel);
        }
    }
}

export function toGrayscale(imageData: ImageData) {
    // https://en.wikipedia.org/wiki/SRGB
    const newImage = new ImageData(imageData.width, imageData.height);
    const input = new ImageDataBuffer(imageData);
    const output = new ImageDataBuffer(newImage);
    for (let y = 0; y < imageData.height; ++y) {
        for (let x = 0; x < imageData.width; ++x) {
            const { R, G, B } = input.getRGB(x, y);
            const Y = 0.2126 * R + 0.7152 * G + 0.0722 * B;
            output.putPixel(x, y, Y);
        }
    }
    return newImage;
}

function makeGaussianKernel(size: number, sigma: number): number[][] {
    const result = [];
    for (let y = -size; y < size+1; ++y) {
        const row = [];
        for (let x = -size; x < size+1; ++x) {
            const c = 2.0 * sigma * sigma;
            const normal = 1 / (c * Math.PI);
            const g =  Math.exp(-((x*x + y*y) / c)) * normal;
            row.push(g);
        }
        result.push(row);
    }
    return result
}

export function gaussianBlur(imageData: ImageData, size: number, sigma: number) {
    const kernel = makeGaussianKernel(size, sigma);
    const newImage = new ImageData(imageData.width, imageData.height);
    convolve(new ImageDataBuffer(imageData), kernel, new ImageDataBuffer(newImage));
    return newImage;
}

function rectToPolar(ix: Float32Array, iy: Float32Array) {
    let max = 0;
    const h = new Float32Array(ix.length);
    const arg = new Float32Array(ix.length);
    for (let i = 0; i < ix.length; ++i) {
        h[i] = Math.sqrt(ix[i]*ix[i] + iy[i]*iy[i]);
        max = Math.max(max, h[i]);
        arg[i] = Math.atan2(ix[i], iy[i]) * 180 / Math.PI;
        if (arg[i] < 0) arg[i] += 180;
    }
    return { h, arg, max };
}

function normalizeBuffer(input: Float32Array, width: number, height: number, max: number, result: ImageBuffer) {
    for (let y = 0; y < height; ++y) {
        for (let x = 0; x < width; ++x) {
            const resultPixel = (input[y*width+x] * 255 / max) & 0xFF;
            result.putPixel(x, y, resultPixel);
        }
    }
}

export function sobelEdgeDetect(imageData: ImageData) {
    const kernelX = [[-1, 0, 1], [-2, 0, 2], [-1, 0, 1]];
    const kernelY = [[1, 2, 1], [0, 0, 0], [-1, -2, -1]];
    const ix = new FloatBuffer(imageData.width, imageData.height);
    convolve(new ImageDataBuffer(imageData), kernelX, ix);
    const iy = new FloatBuffer(imageData.width, imageData.height);
    convolve(new ImageDataBuffer(imageData), kernelY, iy);
    const newImage = new ImageData(imageData.width, imageData.height);
    const { h, arg, max } = rectToPolar(ix.buffer, iy.buffer);
    normalizeBuffer(h, imageData.width, imageData.height, max, new ImageDataBuffer(newImage));
    return {
        image: newImage,
        arg: arg
    }
}

// Canny Edge Detector algorithm taken from
// https://towardsdatascience.com/canny-edge-detection-step-by-step-in-python-computer-vision-b49c3a2d8123
export function cannyPostProcess(imageData: ImageData, angles: Float32Array) {
    const newImage = new ImageData(imageData.width, imageData.height);
    const input = new ImageDataBuffer(imageData);
    const output = new ImageDataBuffer(newImage);
    let max = 0;
    for (let y = 0; y < input.height; ++y) {
        for (let x = 0; x < input.width; ++x) {
            let q = 255;
            let r = 255;
            const angle = angles[y*input.width+x];
            // get neighbors adjacent to edge direction
            if (0 <= angle && angle < 22.5 || 157.5 <= angle && angle <= 180) {
                q = input.getPixelClamped(x, y+1);
                r = input.getPixelClamped(x, y-1);
            } else if (22.5 <= angle && angle < 67.5) {
                q = input.getPixelClamped(x+1, y-1);
                r = input.getPixelClamped(x-1, y+1);
            } else if (67.5 <= angle && angle < 112.5) {
                q = input.getPixelClamped(x+1, y);
                r = input.getPixelClamped(x-1, y);
            } else if (112.5 <= angle && angle < 157.5) {
                q = input.getPixelClamped(x-1, y-1);
                r = input.getPixelClamped(x+1, y+1);
            }

            // keep maximum in neighbors
            const p = input.getPixelClamped(x, y);
            if (p >= q && p >= r) {
                output.putPixel(x, y, p);
                max = Math.max(max, p);
            } else {
                output.putPixel(x, y, 0);
            }
        }
    }

    // Double threshold
    const lowThresholdRatio = 0.05;
    const highThresholdRatio = 0.09;
    
    const highThreshold = max * highThresholdRatio;
    const lowThreshold = highThreshold * lowThresholdRatio;
    
    for (let y = 0; y < output.height; ++y) {
        for (let x = 0; x < output.width; ++x) {
            const p = output.getPixel(x, y);
            if (p >= highThreshold) {
                output.putPixel(x, y, 255);
            } else if (p >= lowThreshold) {
                output.putPixel(x, y, 25);
            } else {
                output.putPixel(x, y, 0);
            }   
        }
    }

    function testPixel(x, y) {
        if (x < 0 || x >= imageData.width || y < 0 || y >= imageData.height) {
            return false;
        }
        return output.getPixel(x, y) == 255;
    }

    // Remove Weak if it has no strong in neighborhood
    for (let y = 0; y < output.height; ++y) {
        for (let x = 0; x < output.width; ++x) {
            const p = output.getPixel(x, y);
            if (p == 25) {
                if (testPixel(x-1, y-1) || testPixel(x, y-1) || testPixel(x+1, y-1)
                        || testPixel(x-1, y) || testPixel(x+1, y)
                        || testPixel(x-1, y-1) || testPixel(x, y-1) || testPixel(x+1, y-1)) {
                    output.putPixel(x, y, 255);
                } else {
                    output.putPixel(x, y, 0);
                }
            }   
        }
    }
    return newImage;
}

export function houghTransform(imageData: ImageData) {
    const maxR = Math.max(imageData.width, imageData.height);
    const outputFloat = new FloatBuffer(360, maxR);
    const input = new ImageDataBuffer(imageData);
    for (let y = 0; y < input.height; ++y) {
        for (let x = 0; x < input.width; ++x) {
            const p = input.getPixel(x, y);
            if (p > 0) {
                for (let theta = 0; theta < 360; ++theta) {
                    const t = theta * Math.PI / 180;
                    const r = Math.floor(x*Math.cos(t) + y*Math.sin(t));
                    if (r < maxR) {
                        outputFloat.putPixel(theta, r, outputFloat.getPixel(theta, r) + 1);
                    }
                }
            }
        }
    }
    const newImage = new ImageData(360, maxR);
    const output = new ImageDataBuffer(newImage);
    let max = 0;
    for (let y = 0; y < output.height; ++y) {
        for (let x = 0; x < output.width; ++x) {
            const p = outputFloat.getPixel(x, y);
            max = Math.max(max, p);
        }
    }
    for (let y = 0; y < output.height; ++y) {
        for (let x = 0; x < output.width; ++x) {
            const p = outputFloat.getPixel(x, y);
            output.putPixel(x, y, (p * 255 / max) & 0xFF);
        }
    }
    return newImage;
}

export function houghToLines(houghData: ImageData, imageData: ImageData, threshold: number, count: number) {
    
    const input = new ImageDataBuffer(houghData);
    const histo = new Array(input.width)
    for (let theta = 0; theta < input.width; ++theta) {
        for (let rho = 0; rho < input.height; ++rho) {
            const p = input.getPixel(theta, rho);
            let h = histo[theta] || 0;
            if (p >= threshold) {
                h += p;
            }
            histo[theta] = h;
        }
    }
    const peaks = [];
    let up = true;
    for (let i = 1; i < histo.length; ++i) {
        if (up && histo[i-1] > histo[i]) {
            peaks.push({ theta: i, value: histo[i-1]});
            up = false;
        } else if (!up && histo[i-1] < histo[i]) {
            up = true;
        }
    }
    peaks.sort((a, b) => b.value - a.value);
    const all = [];
    peaks.slice(0, 2).forEach(peak => {
        let bests = [];
        let count = 0;
        for (let rho = 0; rho < input.height; ++rho) {
            for (let theta = peak.theta - 10; theta < peak.theta + 10; ++theta) {
                const p = input.getPixel(theta, rho);
                if (p >= threshold) {
                    count++;
                    let i = 0
                    let merged = false;
                    while (i < bests.length) {
                        if (Math.abs(rho - bests[i].rho) < 10) {
                            bests[i] = { rho: (bests[i].rho + rho) / 2, theta: (bests[i].theta + theta * Math.PI / 180) / 2 };
                            merged = true
                            break;
                        }
                        ++i
                    }
                    if (! merged) {
                        bests.splice(i, 0, { rho, theta: theta * Math.PI / 180 });
                        bests = bests.slice(0, count);
                    }
                }
            }
        }
        console.log("PEAK", peak.theta, count, bests);
        all.push(...bests);
    });
    const lines = [];
    for (let { rho, theta } of all) {
        const a = Math.cos(theta);
        const b = Math.sin(theta);
        const x0 = a*rho;
        const y0 = b*rho;
        lines.push({ from: {
            x: Math.round(x0 + 1000*(-b)),
            y: Math.round(y0 + 1000*(a))
        }, to: {
            x: Math.round(x0 - 1000*(-b)),
            y: Math.round(y0 - 1000*(a))
        }})
    }
    return { lines , histo };
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
    const newImage = new ImageData(imageData.width, imageData.height);
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
    const newImage = new ImageData(image.width, image.height);
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