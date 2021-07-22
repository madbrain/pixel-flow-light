import type { Block } from "./block";
import { Point, pointAt, Rectangle } from "../geometry";
import { Histogram } from "./histogram";
import type { Outline } from "./outline";

const BUCKETSIZE = 16;

class Buckets<T> {
    private bxdim: number;
    private bydim: number;
    private cells: T[][];

    constructor(private bounds: Rectangle) {
        this.bxdim = Math.floor(bounds.width / BUCKETSIZE) + 1;
        this.bydim = Math.floor(bounds.height / BUCKETSIZE) + 1;
        this.cells = new Array(this.bxdim * this.bydim);
        for (let i = 0; i < this.cells.length; ++i) {
            this.cells[i] = [];
        }
    }

    get(p: Point) {
        const cellCoords = this.getCellCoords(p);
        return this.cells[this.bxdim * cellCoords.y + cellCoords.x];
    }

    private getCellCoords(p: Point) {
        return pointAt(
            Math.floor((p.x - this.bounds.x) / BUCKETSIZE),
            Math.floor((p.y - this.bounds.y) / BUCKETSIZE));
    }

    fillWith(outlines: T[], getLocation: (a: T) => Point) {
        outlines.forEach(outline => {
            this.get(getLocation(outline)).push(outline);
        });
    }

    forEach(func: (outlines: T[]) => void) {
        this.cells.forEach(cell => {
            if (cell.length > 0) {
                func(cell);
            }
        })
    }

    forEachIn(rect: Rectangle, func: (outlines: T[]) => boolean) {
        const min = this.getCellCoords(rect.origin());
        const max = this.getCellCoords(rect.corner());
        for (let yIndex = min.y; yIndex <= max.y; ++yIndex) {
            for (let xIndex = min.x; xIndex <= max.x; ++xIndex) {
                const outlines = this.cells[this.bxdim * yIndex + xIndex];
                if (outlines.length > 0) {
                    if (!func(outlines)) {
                        return;
                    };
                }
            }
        }
    }
}

export class Blob {
    outlines: Outline[] = [];
    
    horzStrokeWidth = 0;
    vertStrokeWidth = 0;
    area: number;

    constructor(outline: Outline) {
        this.outlines.push(outline);
        this.area = this.computeArea();
    }

    private computeArea() {
        let area = 0;
        this.outlines.forEach(outline => {
            area += outline.area();
        })
        return area;
    }

    boundingBox(): Rectangle {
        let rect: Rectangle = null;
        this.outlines.forEach(outline => {
            rect = rect ? rect.union(outline.bounds) : outline.bounds;
        });
        return rect;
    }

    setBlobStrokeWidth(image) {
        const rect = this.boundingBox();
        const hStats = new Histogram(0, 256);
        for (let y = 0; y < rect.height; ++y) {
            let prevPixel = 0;
            let pixel = image.getPixel(rect.x + 0, rect.y + y);
            for (let x = 1; x < rect.width; ++x) {
                const nextPixel = image.getPixel(rect.x + x, rect.y + y);
                // We are looking for a pixel that is equal to its vertical neighbours,
                // yet greater than its left neighbour.
                if (prevPixel < pixel
                        && (y == 0 || pixel == image.getPixel(rect.x + x - 1, rect.y + y - 1))
                        && (y == rect.height - 1 || pixel == image.getPixel(rect.x + x - 1, rect.y + y + 1))) {
                    if (pixel > nextPixel) {
                        // Single local max, so an odd width.
                        hStats.add(pixel * 2 - 1, 1);
                    } else if (pixel == nextPixel
                            && x + 1 < rect.width
                            && pixel > image.getPixel(rect.x + x + 1, rect.y + y)) {
                        // Double local max, so an even width.
                        hStats.add(pixel * 2, 1);
                    }
                }
                prevPixel = pixel;
                pixel = nextPixel;
            }
        }
        const vStats = new Histogram(0, 256);
        for (let x = 0; x < rect.width; ++x) {
            let prevPixel = 0;
            let pixel = image.getPixel(rect.x + x, rect.y + 0);
            for (let y = 1; y < rect.height; ++y) {
                const nextPixel = image.getPixel(rect.x + x, rect.y + y);
                // We are looking for a pixel that is equal to its horizontal neighbours,
                // yet greater than its upper neighbour.
                if (prevPixel < pixel
                        && (x == 0 || pixel == image.getPixel(rect.x + x - 1, rect.y + y - 1))
                        && (x == rect.width - 1 || pixel == image.getPixel(rect.x + x + 1, rect.y + y - 1))) {
                    if (pixel > nextPixel) {
                        // Single local max, so an odd width.
                        vStats.add(pixel * 2 - 1, 1);
                    } else if (pixel == nextPixel
                            && y + 1 < rect.height
                            && pixel > image.getPixel(rect.x + x, rect.y + y + 1)) {
                        // Double local max, so an even width.
                        vStats.add(pixel * 2, 1);
                    }
                }
                prevPixel = pixel;
                pixel = nextPixel;
            }
        }
        this.horzStrokeWidth = 0;
        this.vertStrokeWidth = 0;
        if (hStats.total >= (rect.width + rect.height) / 4) {
            this.horzStrokeWidth = hStats.ile(0.5);
            if (vStats.total >= (rect.width + rect.height) / 4) {
                this.vertStrokeWidth = vStats.ile(0.5);
            }
        } else if (vStats.total >= (rect.width + rect.height) / 4
                    || vStats.total > hStats.total) {
            this.vertStrokeWidth = vStats.ile(0.5);
        } else if (hStats.total > 2) {
            this.horzStrokeWidth = hStats.ile(0.5);
        }
    }

}

/**
 * Find outline hierarchy in order to build blobs,
 * excluding outlines composed of too many sub-outlines.
 * 
 * @param block
 * @param outlines 
 */
// src/textord/edgblob.cpp 393
export function processOutlines(block: Block, outlines: Outline[]) {

    const buckets = new Buckets<Outline>(block.bounds);
    buckets.fillWith(outlines, (outline) => outline.bounds.origin());

    buckets.forEach(outlines => {
        while (outlines.length > 0) {
            const pendingOutlines = [];
            // find outermost in bucket
            let parentIndex = 0;
            for (let index = parentIndex + 1; index < outlines.length; ++index) {
                if (outlines[parentIndex].isInside(outlines[index])) {
                    parentIndex = index;
                }
            }
            const parent = outlines.splice(parentIndex, 1)[0];
            pendingOutlines.push(parent);
            const isGoodBlob = captureChildren(buckets, parent, pendingOutlines);
            constructBlobsFromOutlines(isGoodBlob, pendingOutlines, block);
        }
    });
}

const MAX_CHILDREN_COUNT = 45;
const MAX_CHILDREN_LAYERS = 5;
const MAX_CHILDREN_PER_OUTLINE = 10;
const CHILDREN_PER_CHILD_FACTOR = 10;

function captureChildren(buckets: Buckets<Outline>, parent: Outline, pendingOutlines: Outline[]) {
    const childCount = countChildren(buckets, parent, MAX_CHILDREN_COUNT, 0);
    if (childCount > MAX_CHILDREN_COUNT) {
        return false;
    }
    extractChildren(buckets, parent, pendingOutlines);
    return true;
}

function countChildren(buckets: Buckets<Outline>, parent: Outline, maxCount: number, depth: number) {
    depth += 1
    if (depth > MAX_CHILDREN_LAYERS) {
        return maxCount + depth;
    }
    let childCount = 0;
    let grandchildCount = 0;
    buckets.forEachIn(parent.bounds, outlines => {
        for (let outline of outlines) {
            if (outline != parent && outline.isInside(parent)) {
                childCount += 1;
                if (childCount > MAX_CHILDREN_PER_OUTLINE) {
                    return false;
                }
                const remainingCount = maxCount - childCount - grandchildCount;
                if (remainingCount > 0) {
                    grandchildCount += CHILDREN_PER_CHILD_FACTOR * countChildren(buckets, outline, remainingCount, depth);
                }
                if (childCount + grandchildCount > maxCount) {
                    return false;
                }
            }
        }
        return true;
    });
    return childCount + grandchildCount;
}

function extractChildren(buckets: Buckets<Outline>, parent: Outline, pendingOutlines: Outline[]) {
    buckets.forEachIn(parent.bounds, outlines => {
        for (let i = 0; i < outlines.length;) {
            const outline = outlines[i];
            if (outline.isInside(parent)) {
                outlines.splice(i, 1);
                pendingOutlines.push(outline);
            } else {
                ++i;
            }
        }
        return true;
    });
}

function constructBlobsFromOutlines(isGoodBlob: boolean, outlines: Outline[], block: Block) {
    const outlineRoots: Outline[] = [];
    outlines.forEach(outline => {
        positionOutline(outline, outlineRoots);
    })
    while (outlineRoots.length > 0) {
        const outline = outlineRoots.shift()
        if (! outline.isLegallyNested()) {
            outline.children.forEach(o => outlineRoots.push(o));
            isGoodBlob = false;
        }
        if (isGoodBlob) {
            block.blobs.push(new Blob(outline));
        } else {
            block.noises.push(new Blob(outline));
        }
    }
}

export function positionOutline(outline: Outline, roots: Outline[]) {
    for (let rootIndex = 0; rootIndex < roots.length; ++rootIndex) {
        const destOutline = roots[rootIndex];
        if (destOutline.isInside(outline)) {
            roots.splice(rootIndex, 1, outline);
            outline.children.push(destOutline);

            while (++rootIndex < roots.length) {
                const otherOutline = roots[rootIndex];
                if (otherOutline.isInside(outline)) {
                    roots.splice(rootIndex, 1);
                    outline.children.push(otherOutline);
                }
            }
            return;
        }
        else if (outline.isInside(destOutline)) {
            positionOutline(outline, destOutline.children);
            return;
        }
    }
    roots.push(outline);
}