import { Account } from "../modules/Account.js";
import type { Transaction } from "../modules/Transaction.js";

export class SupportBank {
    private readonly accounts: Map<string, Account>;

    constructor() {
        this.accounts = new Map();
    }

    recordTransaction(transaction: Transaction): void {
        const sender = this.getAccount(transaction.from) ?? this.createAccount(transaction.from);
        const recipient = this.getAccount(transaction.to) ?? this.createAccount(transaction.to);

        sender.applyTransaction(transaction);
        recipient.applyTransaction(transaction);
    }

    recordTransactions(transactions: readonly Transaction[]): void {
        for (const transaction of transactions) {
            this.recordTransaction(transaction);
        }
    }

    getAccount(name: string): Account | undefined {
        return this.accounts.get(name);
    }

    getAccounts(): readonly Account[] {
        return Array.from(this.accounts.values());
    }

    private createAccount(name: string): Account {
        const account = new Account(name);
        this.accounts.set(name, account);
        return account;
    }
}
