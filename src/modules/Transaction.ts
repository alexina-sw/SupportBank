import { format } from "date-fns";

export class Transaction {
    readonly date: Date;
    readonly from: string;
    readonly to: string;
    readonly narrative: string;
    readonly amount: number;

    constructor(date: Date, from: string, to: string, narrative: string, amount: number) {
        if (from === to) {
            throw new Error("Transaction sender and recipient must be different");
        }
        
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.amount = amount;
    }

    toString(): string {
        const date = format(this.date, "dd/MM/yyyy");

        return [
            date,
            `${this.from} -> ${this.to}`,
            this.narrative,
            this.amount
        ].join(" | ");
    }
}
