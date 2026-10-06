import { expect, test } from "vitest";

import { Transaction } from "./Transaction.js";

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
