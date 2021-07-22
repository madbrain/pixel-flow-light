
export enum ImageMode {
    COLOR,
    GRAYSCALE,
    BINARY
}

export enum PixelValue {
    BLACK = 0,
    WHITE = 0xFF
}

export function flipColour(x: PixelValue) {
    if (x == PixelValue.BLACK) {
        return PixelValue.WHITE;
    }
    return PixelValue.BLACK;
}

export interface Image {
    mode: ImageMode;
    width: number;
    height: number;

    getPixel(x: number, y: number);
}