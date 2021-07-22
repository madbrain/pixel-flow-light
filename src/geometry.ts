
export class Offset {
    
    constructor(public dx: number, public dy: number) { }

    add(other: Offset): Offset {
        return new Offset(this.dx + other.dx, this.dy + other.dy);
    }

    crossProduct(other: Offset) {
        return this.dx * other.dy - this.dy * other.dx;
    }
}

export class Point {
    
    constructor(public x: number, public y: number) { }

    min(other: Point) {
        return pointAt(Math.min(this.x, other.x), Math.min(this.y, other.y));
    }

    max(other: Point) {
        return pointAt(Math.max(this.x, other.x), Math.max(this.y, other.y));
    }

    move(offset: Offset) {
        return new Point(this.x + offset.dx, this.y + offset.dy);
    }

    subtract(point: Point) {
        return new Offset(this.x - point.x, this.y - point.y);
    }

    rect(width: number, height: number) {
        return new Rectangle(this, new Dimension(width, height));
    }

    rectAtCorner(corner: Point) {
        return new Rectangle(this, new Dimension(corner.x - this.x, corner.y - this.y));
    }
}

export function pointAt(x: number, y: number) { return new Point(x, y); }

export class Dimension {
    constructor(public width: number, public height: number) { }
}

export class Rectangle {
    x: number;
    y: number;
    width: number;
    height: number;

    constructor(origin: Point, size: Dimension) {
        this.x = origin.x;
        this.y = origin.y;
        this.width = size.width;
        this.height = size.height;
    }

    unionPoint(p: Point): Rectangle {
        return this.origin().min(p).rectAtCorner(this.corner().max(p));
    }

    union(other: Rectangle): Rectangle {
        return this.origin().min(other.origin()).rectAtCorner(this.corner().max(other.corner()));
    }
    

    containsPoint(p: Point) {
        return p.x >= this.x && p.y >= this.y && p.x < this.corner().x && p.y < this.corner().y;
    }

    containsRect(other: Rectangle) {
        return this.containsPoint(other.origin())
            && this.containsPoint(other.corner());
    }

    overlap(other: Rectangle) {
        return other.origin().x <= this.corner().x
            && other.origin().y <= this.corner().y
            && other.corner().x >= this.origin().x
            && other.corner().y >= this.origin().y;
    }

    origin() {
        return pointAt(this.x, this.y)
    }

    corner() {
        return pointAt(this.x + this.width, this.y + this.height)
    }

    bottomLeft() {
        return new Point(this.x, this.y + this.height);
    }

    topRight() {
        return new Point(this.x + this.width, this.y);
    }

    area() {
        return this.width * this.height;
    }
}