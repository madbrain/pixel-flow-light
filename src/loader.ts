import type { CatalogImage } from "./api";

export class ImageLoader {

    private canvas;
    private ctx;
    
    constructor() {
        // create Offline Canvas
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');
    }
    
    private changeImage(resolve: (value: any) => void, img: HTMLImageElement, filename: string) {
        // load image data
        this.canvas.width = img.width;
        this.canvas.height = img.height;
        this.ctx.drawImage(img, 0, 0);
        const imageData = this.ctx.getImageData(0, 0, img.width, img.height);
        resolve({ name: filename, data: imageData});
    }

    public load(file: File): Promise<CatalogImage> {
        return this.loadImage(file, file.name);
    }

    public loadURL(name: string, url: string): Promise<CatalogImage> {
        return fetch(url)
            .then(resp => resp.blob())
            .then(blob => this.loadImage(blob, name));
    }

    private loadImage(blob: Blob, name: string): Promise<CatalogImage> {
        return new Promise<CatalogImage>((resolve, reject) => {
            const reader = new FileReader();
            const img = new Image();
            img.onload = () => this.changeImage(resolve, img, name);
            img.onerror = () => reject();
            reader.onload = (e) => {
                img.src = <string>e.target.result;
            };
            reader.onerror = () => reject();
            reader.readAsDataURL(blob);
        });
    }
    
}

export const loader = new ImageLoader();