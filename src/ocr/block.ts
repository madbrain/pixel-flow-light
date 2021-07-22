import type { Rectangle } from "../geometry";
import type { Blob } from "./blob";
import { kAscenderFraction, kDescenderFraction, kXHeightCapRatio, kXHeightFraction, options } from "./options";
import { Histogram } from "./histogram";

/**
 * Unit of an image to be independently analysed
 */
export class Block {
    blobs: Blob[] = [];
    noises: Blob[] = [];
    smalls: Blob[] = [];
    larges: Blob[] = [];
    lineSize: number;
    lineSpacing: number;
    maxBlobSize: number;

    /**
     * use a simple rectangle as block shape, tesseract allows more complex shapes (rectangle slices or even polygon)
     */
    constructor(public bounds: Rectangle) { }

    filterBlobs() {
        let blobs = this.blobs;
        let noises = this.noises;
        let smalls = [];
        let larges = [];
        
        let maxHeightHisto = 0;
        let other = [];
        blobs.forEach(blob => {
            const bbox = blob.boundingBox();
            if (bbox.height < options.textord_max_noise_size) {
                noises.push(blob);
            } else if (blob.area >= bbox.area() * options.textord_noise_area_ratio) {
                smalls.push(blob);
            } else {
                other.push(blob);
                maxHeightHisto = Math.max(maxHeightHisto, bbox.height);
            }
        });
        blobs = other;
        
        let sizeStats = new Histogram(0, maxHeightHisto+1);
        blobs.forEach(blob => sizeStats.add(blob.boundingBox().height, 1));
        let initialX = sizeStats.ile(options.textord_initialx_ile);
        const max_y = Math.ceil(initialX * (kDescenderFraction + kXHeightFraction + 2 * kAscenderFraction) / kXHeightFraction);
        const min_y = Math.floor (initialX / 2);
        const max_x = Math.ceil (initialX * options.textord_width_limit);

        other = [];
        smalls.forEach(blob => {
            const height = blob.boundingBox().height;
            if (height > max_y) {
                larges.push(blob);
            } else if (height >= min_y) {
                blobs.push(blob);
            } else {
                other.push(blob);
            }
        });
        smalls = other;

        sizeStats = new Histogram(0, maxHeightHisto+1);
        other = [];
        blobs.forEach(blob => {
            const height = blob.boundingBox ().height;
            const width = blob.boundingBox ().width;
            if (height < min_y) {
                smalls.push(blob);
            } else if (height > max_y || width > max_x) {
                larges.push (blob);
            } else {
                other.push(blob);
                sizeStats.add (height, 1);
            }
        });
        blobs = other;

        this.blobs = blobs;
        this.noises = noises;
        this.smalls = smalls;
        this.larges = larges;

        const maxHeight = sizeStats.ile (options.textord_initialasc_ile) * kXHeightCapRatio;
        if (maxHeight > initialX) {
            initialX = maxHeight;
        }
        this.lineSize = initialX;
        if (this.lineSize == 0) {
            this.lineSize = 1;
        }
        this.lineSpacing = this.lineSize * (kDescenderFraction + kXHeightFraction + 2 * kAscenderFraction) / kXHeightFraction;
        this.lineSize *= options.textord_min_linesize;
        this.maxBlobSize = this.lineSize * options.textord_excess_blobsize;
    }
}

/**
 * Used to hold information of an analysed blob :
 * - baseline
 * - neighbors
 * - etc.
 */
export class BlobAndBox {

    constructor(private blob: Blob) {}
}

export class ToBlock {
    blobs: BlobAndBox[];
    noise: BlobAndBox[];
    constructor(public srcBlock: Block) {}
}