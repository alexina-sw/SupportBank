import { expect, test } from "vitest";

import { TransactionImportValidationError } from "../../src/services/import/validation/TransactionImportValidationError.js";

test("formats a transaction validation issue", () => {
    const issues = [{
        location: "Line 4",
        field: "Amount",
        message: '"invalid" is not a valid amount'
    }];

    const error = new TransactionImportValidationError(issues);

    expect(error.name).toBe("TransactionImportValidationError");
    expect(error.issues).toBe(issues);
    expect(error.message).toBe(
        "Invalid amount at line 4: " +
        '"invalid" is not a valid amount'
    );
});
