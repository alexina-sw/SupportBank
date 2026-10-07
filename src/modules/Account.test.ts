import { expect, test as baseTest } from "vitest";

import { Account } from "./Account.js";
import { Transaction } from "./Transaction.js";

const test = baseTest.extend(
    "pokemonTransaction",
    new Transaction(
        new Date(2014, 0, 1),
        "Jon A",
        "Sarah T",
        "Pokemon Training",
        7.8
    )
);

test("formats an account as text",
    ({ pokemonTransaction }) => {
    const account = new Account("Jon A");

    account.applyTransaction(pokemonTransaction);

    expect(account.toString()).toBe("Jon A: -7.80");
});

test("subtracts money sent by the account",
    ({ pokemonTransaction }) => {
    const account = new Account("Jon A");

    account.applyTransaction(pokemonTransaction);

    expect(account.getTransactions()).toEqual([pokemonTransaction]);
    expect(account.getBalance()).toBe(-7.8);
});

test("adds money received by the account",
    ({ pokemonTransaction }) => {
    const account = new Account("Sarah T");

    account.applyTransaction(pokemonTransaction);

    expect(account.getTransactions()).toEqual([pokemonTransaction]);
    expect(account.getBalance()).toBe(7.8);
});

test("does not add a transaction unrelated to the account",
    ({ pokemonTransaction }) => {
    const account = new Account("Todd");

    account.applyTransaction(pokemonTransaction);

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

    account.applyTransaction(outgoing);
    account.applyTransaction(incoming);

    expect(account.getTransactions()).toEqual([outgoing, incoming]);
    expect(account.getBalance()).toBe(-6);
});
