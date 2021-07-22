import { Offset, Point, Rectangle } from "../geometry";

const INTERSECTING = Number.MAX_SAFE_INTEGER;

export enum Direction {
    LEFT,
    UP,
    RIGHT,
    DOWN
}

export const directionOffset = {
    [Direction.LEFT]: new Offset(-1, 0),
    [Direction.RIGHT]: new Offset(1, 0),
    [Direction.UP]: new Offset(0, -1),
    [Direction.DOWN]: new Offset(0, 1)
}

export class Outline {

    children: Outline[] = [];

    constructor(public bounds: Rectangle, public start: Point, public steps: Direction[]) { }

    step(stepIndex: number) {
        return directionOffset[this.steps[stepIndex]];
    }

    isInside(other: Outline): boolean {
        if (!this.bounds.overlap(other.bounds)) {
            return false;
        }
        if (this.steps.length == 0) {
            return other.bounds.containsRect(this.bounds);
        }
        let count;
        let pos = this.start;
        for (let stepIndex = 0; stepIndex < this.steps.length
            && (count = other.windingNumber(pos)) == INTERSECTING; stepIndex++) {
            //try all points
            pos = pos.move(this.step(stepIndex));
        }
        if (count == INTERSECTING) {
            //all intersected
            pos = other.start;
            for (let stepIndex = 0; stepIndex < other.steps.length
                && (count = this.windingNumber(pos)) == INTERSECTING; stepIndex++) {
                //try other way round
                pos = pos.move(this.step(stepIndex));
            }
            return count == INTERSECTING || count == 0;
        }
        return count != 0;
    }

    windingNumber(point: Point): number {
        let vec = this.start.subtract(point);
        let count = 0;
        for (let stepIndex = 0; stepIndex < this.steps.length; stepIndex++) {
            const stepVec = this.step(stepIndex);
            const nextVec = vec.add(stepVec);
            // find vertical steps of the outline that overlap the y of the test point and are on its right
            if (vec.dy <= 0 && nextVec.dy > 0) {
                // crossing down step
                const cross = vec.crossProduct(stepVec);
                if (cross < 0) {
                    // outline is on the right
                    count++;
                } else if (cross == 0) {
                    return INTERSECTING;
                }
            } else if (vec.dy > 0 && nextVec.dy <= 0) {
                // crossing up step
                const cross = vec.crossProduct(stepVec);
                if (cross > 0) {
                    // outline is on the right
                    count--;
                } else if (cross == 0) {
                    return INTERSECTING;
                }
            }
            vec = nextVec;
        }
        return count;
    }

    isLegallyNested(): boolean {
        if (this.steps.length == 0) {
            return true;
        }
        const parentArea = this.outerArea();
        for (let child of this.children) {
            if (child.outerArea() * parentArea > 0 || !child.isLegallyNested()) {
                return false;
            }
        }
        return true;
    }

    outerArea(): number {
        if (this.steps.length == 0) {
            return this.bounds.area();
        }
        let pos = this.start;
        let total = 0;
        for (let stepIndex = 0; stepIndex < this.steps.length; stepIndex++) {
            const nextStep = this.step(stepIndex);
            if (nextStep.dx > 0) {
                total += pos.y;
            } else if (nextStep.dx < 0) {
                total -= pos.y;
            }
            pos = pos.move(nextStep);
        }
        return total;
    }

    area(): number {
        let total = this.outerArea();
        this.children.forEach(child => {
            total += child.area ();
        });
        return total;
    }
}