import { CCKey, SecretStorage } from "codechain-keystore";

import { H256 } from "codechain-sdk/lib/core/classes";
import { blake256, getAccountIdFromPublic } from "codechain-sdk/lib/utils";
import * as _ from "lodash";

import { AccountType } from "../types";
import { getAddressFromPublic } from "../util";

export async function importKey(
    cckey: CCKey,
    accountType: AccountType,
    secret: SecretStorage,
    passphrase: string
): Promise<void> {
    const publicKey = await cckey[accountType].importKey({
        secret,
        passphrase
    });
    if (accountType === "platform") {
        const accountId = getAccountIdFromPublic(publicKey);
        cckey.mapping.add({ key: accountId, value: publicKey });
    }
    if (accountType === "asset") {
        const hash = H256.ensure(blake256(publicKey)).value;
        cckey.mapping.add({ key: hash, value: publicKey });
    }

    console.log(getAddressFromPublic(accountType, publicKey));
}