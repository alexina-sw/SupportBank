import type { Transaction } from "./Transaction.js";

export class Account {
    readonly name: string;
    private readonly transactions: Transaction[];
    private balance: number;

    constructor(name: string) {
        this.name = name;
        this.transactions = [];
        this.balance = 0;
    }

    toString(): string {
        return `${this.name}: ${this.balance.toFixed(2)}`;
    }

    applyTransaction(transaction: Transaction): void {
        const isSender = transaction.from === this.name;
        const isRecipient = transaction.to === this.name;

        if (!isSender && !isRecipient) {
            return;
        }

        this.transactions.push(transaction);

        if (isSender) {
            this.balance -= transaction.amount;
        } else {
            this.balance += transaction.amount;
        }
    }

    getTransactions(): readonly Transaction[] {
        return this.transactions;
    }

    getBalance(): number {
        return this.balance;
    }
}
