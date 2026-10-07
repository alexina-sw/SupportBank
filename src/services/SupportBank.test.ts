import { describe, expect, test as baseTest } from "vitest";

import { Transaction } from "../modules/Transaction.js";
import { SupportBank } from "./SupportBank.js";

const test = baseTest
    .extend("bank", () => new SupportBank())
    .extend(
        "lunchTransaction",
        new Transaction(
            new Date(2014, 0, 1),
            "Jon A",
            "Sarah T",
            "Lunch",
            10
        )
    )
    .extend(
        "drinksTransaction",
        new Transaction(
            new Date(2014, 0, 2),
            "Sarah T",
            "Todd",
            "Drinks",
            4
        )
    );

describe("SupportBank", () => {
    test("starts with no accounts", ({ bank }) => {
        expect(bank.getAccounts()).toEqual([]);
        expect(bank.getAccount("Jon A")).toBeUndefined();
    });

    test(
        "creates accounts and records a transaction for both",
        ({ bank, lunchTransaction }) => {
            bank.recordTransaction(lunchTransaction);

            const jon = bank.getAccount("Jon A");
            const sarah = bank.getAccount("Sarah T");

            expect(jon?.getTransactions()).toEqual([
                lunchTransaction
            ]);
            expect(sarah?.getTransactions()).toEqual([
                lunchTransaction
            ]);

            expect(jon?.getBalance()).toBe(-10);
            expect(sarah?.getBalance()).toBe(10);
        }
    );

    test("returns all created accounts",
        ({ bank, lunchTransaction }) => {
        bank.recordTransaction(lunchTransaction);

        const names = bank
            .getAccounts()
            .map((account) => account.name)
            .sort();

        expect(names).toEqual(["Jon A", "Sarah T"]);
    });

    test(
        "reuses existing accounts when recording multiple transactions",
        ({
            bank,
            lunchTransaction,
            drinksTransaction
        }) => {
            bank.recordTransactions([
                lunchTransaction,
                drinksTransaction
            ]);

            expect(bank.getAccounts()).toHaveLength(3);

            expect(
                bank.getAccount("Sarah T")?.getTransactions()
            ).toEqual([
                lunchTransaction,
                drinksTransaction
            ]);

            expect(
                bank.getAccount("Sarah T")?.getBalance()
            ).toBe(6);
        }
    );
});
