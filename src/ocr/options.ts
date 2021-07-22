
export class Options {
    textord_max_noise_size = 7; // "Pixel size of noise"
    textord_noise_area_ratio = 0.7; // "Fraction of bounding box for noise"
    textord_initialx_ile = 0.75; // "Ile of sizes for xheight guess"
    textord_initialasc_ile = 0.90; // "Ile of sizes for xheight guess"
    textord_width_limit = 8; // "Max width of blobs to make rows (with in xheight guess)"
    textord_min_linesize = 1.25; // "blob height for initial linesize"
    textord_excess_blobsize = 1.3; // "New row made if blob makes row this big"
}

export const options = new Options();

export const kDescenderFraction = 0.25;
export const kXHeightFraction = 0.5;
export const kAscenderFraction = 0.25;
export const kXHeightCapRatio = kXHeightFraction / (kXHeightFraction + kAscenderFraction);