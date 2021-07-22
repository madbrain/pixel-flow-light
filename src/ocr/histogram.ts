import { clipToRange } from "../compute";

export class Histogram {
    total = 0;
    values: number[];
    constructor(public min: number, public max: number) {
        this.values = new Array(max - min).fill(0);
    }

    add(value: number, count: number) {
        this.values[value - this.min] += count;
        this.total += count;
    }

    ile(frac: number) {
        const target = clipToRange(frac * this.total, 1.0, this.total);
        let sum = 0;
        let index = 0;
        while (index < this.values.length && sum < target) {
            sum += this.values[index++];
        }
        if (index > 0) {
            return this.min + index - (sum - target) / this.values[index - 1];
        } else {
            return this.min;
        }
    }
}