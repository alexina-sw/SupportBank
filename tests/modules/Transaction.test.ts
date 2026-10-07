import { expect, test } from "vitest";

import { Transaction } from "../../src/modules/Transaction.js";

test("formats a transaction as text", () => {
    const transaction = new Transaction(
        new Date(2014, 0, 1),
        "Jon A",
        "Sarah T",
        "Lunch",
        10
    );

    expect(transaction.toString()).toBe(
        "01/01/2014 | Jon A -> Sarah T | Lunch | 10"
    );
});

test("rejects a self-transfer", () => {
    expect(() => {
        new Transaction(
            new Date(2014, 0, 1),
            "Jon A",
            "Jon A",
            "Self-transfer",
            10
        );
    }).toThrow(
        "Transaction sender and recipient must be different"
    );
});
