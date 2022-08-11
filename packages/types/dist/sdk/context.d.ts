import { User, Account } from "../documents";
import { IdentityType } from "./events/identification";
export interface BaseContext {
    _id: string;
    type: IdentityType;
    tenantId?: string;
}
export interface AccountUserContext extends BaseContext {
    tenantId: string;
    account: Account;
}
export interface UserContext extends BaseContext, User {
    _id: string;
    tenantId: string;
    account?: Account;
}
export declare type IdentityContext = BaseContext | AccountUserContext | UserContext;
