import { CCKey, SecretStorage } from "codechain-keystore";

import { AccountType } from "../types";
import { findKey } from "../util";

export async function exportKey(
    cckey: CCKey,
    accountType: AccountType,
    address: string,
    passphrase: string
): Promise<SecretStorage> {
    const keys = await cckey[accountType].getKeys();
    const key = findKey(accountType, keys, address);
    return cckey[accountType].exportKey({
        key,
        passphrase
    });
}
