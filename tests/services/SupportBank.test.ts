import { describe, expect, test as baseTest } from "vitest";

import { Transaction } from "../../src/modules/Transaction.js";
import { SupportBank } from "../../src/services/SupportBank.js";

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
    });

    describe("findAccount", () => {
        test("returns undefined without creating a missing account",
            ({ bank }) => {
                expect(bank.findAccount("Jon A")).toBeUndefined();
                expect(bank.getAccounts()).toEqual([]);
            }
        );

        test("returns an existing account",
            ({ bank }) => {
                const account = bank.getAccount("Jon A");

                expect(bank.findAccount("Jon A")).toBe(account);
            }
        );
    });

    describe("getAccount", () => {
        test("creates and returns a missing account",
            ({ bank }) => {
                const account = bank.getAccount("Jon A");

                expect(account.name).toBe("Jon A");
                expect(bank.getAccounts()).toEqual([account]);
            }
        );

        test("returns an existing account",
            ({ bank }) => {
                const first = bank.getAccount("Jon A");
                const second = bank.getAccount("Jon A");
 
                expect(second).toBe(first);
                expect(bank.getAccounts()).toHaveLength(1);
            }
        );
    });

    describe("recordTransaction", () => {
        test("records a transaction for both accounts",
            ({ bank, lunchTransaction }) => {
                bank.recordTransaction(lunchTransaction);

                const jon = bank.getAccount("Jon A");
                const sarah = bank.getAccount("Sarah T");

                expect(jon.getTransactions()).toEqual([
                    lunchTransaction
                ]);
                expect(sarah.getTransactions()).toEqual([
                    lunchTransaction
                ]);

                expect(jon.getBalance()).toBe(-10);
                expect(sarah.getBalance()).toBe(10);

                expect(
                    bank.getAccounts().map(
                        (account) => account.name
                    )
                ).toEqual(["Jon A", "Sarah T"]);
            }
        );
    });

    describe("recordTransactions", () => {
        test("reuses accounts across multiple transactions",
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

                const sarah = bank.getAccount("Sarah T");

                expect(sarah.getTransactions()).toEqual([
                    lunchTransaction,
                    drinksTransaction
                ]);

                expect(sarah.getBalance()).toBe(6);
            }
        );
    });
});
