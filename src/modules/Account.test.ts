import { expect, test } from "vitest";

import { Account } from "./Account.js";
import { Transaction } from "./Transaction.js";

test("subtracts money sent by the account", () => {
    const account = new Account("Jon A");
    const transaction = new Transaction(
        new Date(2014, 0, 1),
        "Jon A",
        "Sarah T",
        "Pokemon Training",
        7.8
    );

    account.addTransaction(transaction);

    expect(account.getTransactions()).toEqual([transaction]);
    expect(account.getBalance()).toBe(-7.8);
});

test("adds money received by the account", () => {
    const account = new Account("Sarah T");
    const transaction = new Transaction(
        new Date(2014, 0, 1),
        "Jon A",
        "Sarah T",
        "Pokemon Training",
        7.8
    );

    account.addTransaction(transaction);

    expect(account.getTransactions()).toEqual([transaction]);
    expect(account.getBalance()).toBe(7.8);
});

test("does not add a transaction unrelated to the account", () => {
    const account = new Account("Todd");
    const transaction = new Transaction(
        new Date(2014, 0, 1),
        "Jon A",
        "Sarah T",
        "Pokemon Training",
        7.8
    );

    account.addTransaction(transaction);

    expect(account.getTransactions()).toHaveLength(0);
    expect(account.getBalance()).toBe(0);
});

test("does not add a self-transfer", () => {
    const account = new Account("Jon A");
    const transaction = new Transaction(
        new Date(2014, 0, 1),
        "Jon A",
        "Jon A",
        "Correction",
        10
    );

    account.addTransaction(transaction);

    expect(account.getTransactions()).toHaveLength(0);
    expect(account.getBalance()).toBe(0);
});

test("updates the balance for multiple transactions", () => {
    const account = new Account("Jon A");

    const outgoing = new Transaction(
        new Date(2014, 0, 1),
        "Jon A",
        "Sarah T",
        "Lunch",
        10
    );

    const incoming = new Transaction(
        new Date(2014, 0, 2),
        "Sarah T",
        "Jon A",
        "Repayment",
        4
    );

    account.addTransaction(outgoing);
    account.addTransaction(incoming);

    expect(account.getTransactions()).toEqual([outgoing, incoming]);
    expect(account.getBalance()).toBe(-6);
});
