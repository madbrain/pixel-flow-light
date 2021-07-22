import { Point, Rectangle, pointAt } from "../geometry";
import { PixelValue, Image } from "./image";
import { Direction, directionOffset, Outline } from "./outline";

const MIN_EDGE_LENGTH = 8;

export class Edge {
    
    prev: Edge;
    next: Edge;

    constructor(public pos: Point, public stepDir: Direction) {
        this.prev = this;
        this.next = this;
    }

    nextPoint() {
        return this.pos.move(directionOffset[this.stepDir]);
    }

    joinWith(join: Edge) {
        const nextPt = this.nextPoint();
        if (nextPt.x == join.pos.x && nextPt.y == join.pos.y) {
            // place join next
            this.prev = join.prev;
            this.prev.next = this;
            this.next = join;
            join.prev = this;
        } else {
            // place join before
            this.next = join.next;
            this.next.prev = this;
            this.prev = join;
            join.next = this;
        }
    }

    buildOutline() {
        // tesseract packs 4 steps in a byte to save space
        const steps = [];
        let current = <Edge>this;
        let pos = this.pos;
        let bounds = pos.rect(0, 0);
        do {
            steps.push(current.stepDir);
            pos = pos.move(directionOffset[current.stepDir]);
            bounds = bounds.unionPoint(pos);
            current = current.next;
        } while (current != this);
        return new Outline(bounds, this.pos, steps);
    }
}

export class MarchingSquare {

    private scanX = 0;
    private scanY = 0;
    private outlines: Array<Outline> = [];
    private pendingEdges: Array<Edge>;
    private current = null;

    constructor(private image: Image, private block: Rectangle) {
        this.pendingEdges = new Array(block.width + 1);
        this.scanX = block.x;
        this.scanY = block.y;
    }

    process() {
        while (!this.step()) {
            // nothing
        }
        return this.outlines;
    }

    private getPixel(x: number, y: number) {
        if (!this.block.containsPoint(pointAt(x, y))) {
            return 0xFF;
        }
        return this.image.getPixel(x, y);
    }

    step() {
        const colour = this.getPixel(this.scanX, this.scanY);
        const prevColour = this.getPixel(this.scanX - 1, this.scanY);
        const upperColour = this.getPixel(this.scanX, this.scanY - 1);
        const pendingIndex = this.scanX - this.block.x;

        if (this.pendingEdges[pendingIndex]) {
            if (colour == prevColour) {
                if (colour == upperColour) {
                    this.joinEdges(this.current, this.pendingEdges[pendingIndex]);
                    this.current = null;
                } else {
                    this.current = this.horizontalEdge(upperColour - colour, this.pendingEdges[pendingIndex]);
                }
                this.pendingEdges[pendingIndex] = null;
            } else {
                if (colour == upperColour) {
                    this.pendingEdges[pendingIndex] = this.verticalEdge(colour - prevColour, this.pendingEdges[pendingIndex]);
                } else if (colour == PixelValue.WHITE) {
                    this.joinEdges(this.current, this.pendingEdges[pendingIndex]);
                    this.current = this.horizontalEdge(upperColour - colour, null);
                    this.pendingEdges[pendingIndex] = this.verticalEdge(colour - prevColour, this.current);
                } else {
                    const newCurrent = this.horizontalEdge(upperColour - colour, this.pendingEdges[pendingIndex]);
                    this.pendingEdges[pendingIndex] = this.verticalEdge(colour - prevColour, this.current);
                    this.current = newCurrent;
                }
            }
        } else {
            if (colour != prevColour) {
                this.pendingEdges[pendingIndex] = this.current = this.verticalEdge(colour - prevColour, this.current);
            }
            if (colour != upperColour) {
                this.current = this.horizontalEdge(upperColour - colour, this.current);
            } else {
                this.current = null;
            }
        }

        this.scanX += 1;
        if (this.scanX > this.block.corner().x) {
            this.scanY += 1;
            this.scanX = this.block.x - 1;
        }
        if (this.scanY > this.block.corner().y) {
            return true;
        } else {
            return false;
        }
    }

    private horizontalEdge(sign: number, join: Edge): Edge {

        const newEdge = sign > 0
            ? new Edge(pointAt(this.scanX + 1, this.scanY), Direction.LEFT)
            : new Edge(pointAt(this.scanX, this.scanY), Direction.RIGHT);

        if (join != null) {
            newEdge.joinWith(join);
        }
        return newEdge;
    }

    private verticalEdge(sign: number, join: Edge): Edge {

        const newEdge = sign < 0
            ? new Edge(pointAt(this.scanX, this.scanY), Direction.DOWN)
            : new Edge(pointAt(this.scanX, this.scanY + 1), Direction.UP);

        if (join != null) {
            newEdge.joinWith(join);
        }
        return newEdge;
    }

    private joinEdges(edge1: Edge, edge2: Edge) {
        const nextPt = edge1.nextPoint();
        if (nextPt.x != edge2.pos.x || nextPt.y != edge2.pos.y) {
            const tempEdge = edge1;
            edge1 = edge2;
            edge2 = tempEdge;
        }

        if (edge1.next == edge2) {
            const outline = edge1.buildOutline();
            if (outline.steps.length >= MIN_EDGE_LENGTH) {
                this.outlines.push(outline);
            }
        } else {
            edge2.prev.next = edge1.next;
            edge1.next.prev = edge2.prev;
            edge1.next = edge2;
            edge2.prev = edge1;
        }
    }
}