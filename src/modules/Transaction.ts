export class Transaction {
    readonly date: Date;
    readonly from: string;
    readonly to: string;
    readonly narrative: string;
    readonly amount: number;

    constructor(date: Date, from: string, to: string, narrative: string, amount: number) {
        this.date = date;
        this.from = from;
        this.to = to;
        this.narrative = narrative;
        this.amount = amount;
    }
}
