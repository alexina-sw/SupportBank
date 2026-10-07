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

        return accounts.join("\n");
    }

    listAccount(name: string): string {
        const account = this.bank.getAccount(name);

        if (!account) {
            return `Account "${name}" not found.`;
        }

        return account.getTransactions().join("\n");
    }

    process(command: string): string {
        const trimmedCommand = command.trim();

        if (/^list\s+all$/i.test(trimmedCommand)) {
            return this.listAll();
        }

        const accountName = /^list\s+(.+)$/i.exec(trimmedCommand)?.[1];

        if (accountName) {
            return this.listAccount(accountName.trim());
        }

        return 'Invalid command. Use "List All" or "List <account>".';
    }
}
