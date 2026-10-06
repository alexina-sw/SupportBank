import { describe, expect, test } from "vitest";

import { Transaction } from "../modules/Transaction.js";
import { SupportBank } from "./SupportBank.js";

describe("SupportBank", () => {
    test("starts with no accounts", () => {
        const bank = new SupportBank();

        expect(bank.getAccounts()).toEqual([]);
        expect(bank.getAccount("Jon A")).toBeUndefined();
    });

    test("creates accounts and adds a transaction to both", () => {
        const bank = new SupportBank();
        const transaction = new Transaction(
            new Date(2014, 0, 1),
            "Jon A",
            "Sarah T",
            "Lunch",
            10
        );

        bank.addTransaction(transaction);

        const jon = bank.getAccount("Jon A");
        const sarah = bank.getAccount("Sarah T");

        expect(jon).toBeDefined();
        expect(sarah).toBeDefined();

        expect(jon?.getTransactions()).toEqual([transaction]);
        expect(sarah?.getTransactions()).toEqual([transaction]);

        expect(jon?.getBalance()).toBe(-10);
        expect(sarah?.getBalance()).toBe(10);
    });

    test("returns all created accounts", () => {
        const bank = new SupportBank();

        bank.addTransaction(
            new Transaction(
                new Date(2014, 0, 1),
                "Jon A",
                "Sarah T",
                "Lunch",
                10
            )
        );

        const names = bank
            .getAccounts()
            .map((account) => account.name)
            .sort();

        expect(names).toEqual(["Jon A", "Sarah T"]);
    });

    test("reuses existing accounts when adding multiple transactions", () => {
        const bank = new SupportBank();

        const firstTransaction = new Transaction(
            new Date(2014, 0, 1),
            "Jon A",
            "Sarah T",
            "Lunch",
            10
        );

        const secondTransaction = new Transaction(
            new Date(2014, 0, 2),
            "Sarah T",
            "Todd",
            "Drinks",
            4
        );

        bank.addTransactions([
            firstTransaction,
            secondTransaction
        ]);

        expect(bank.getAccounts()).toHaveLength(3);

        const sarah = bank.getAccount("Sarah T");

        expect(sarah?.getTransactions()).toEqual([
            firstTransaction,
            secondTransaction
        ]);

        expect(sarah?.getBalance()).toBe(6);
    });
});
