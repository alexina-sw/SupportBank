import { format as formatDate } from "date-fns";

import type { SupportBank } from "../services/SupportBank.js";

export class CommandProcessor {
    private readonly bank: SupportBank;

    constructor(bank: SupportBank) {
        this.bank = bank;
    }

    listAll(): string {
        const accounts = [...this.bank.getAccounts()];

        if (accounts.length === 0) {
            return "No accounts found.";
        }

        accounts.sort((first, second) =>
            first.name.localeCompare(second.name)
        );

        return accounts
            .map((account) => {
                const balance = account.getBalance();
                return `${account.name}: ${balance}`;
            }).join("\n");
    }

    listAccount(name: string): string {
        const account = this.bank.getAccount(name);

        if (!account) {
            return `Account "${name}" not found.`;
        }

        return account
            .getTransactions()
            .map((transaction) => {
                const date = formatDate(transaction.date, "dd/MM/yyyy");

                const amount = transaction.amount;

                return [
                    date,
                    `${transaction.from} -> ${transaction.to}`,
                    transaction.narrative,
                    amount
                ].join(" | ");
            }).join("\n");
    }
}
