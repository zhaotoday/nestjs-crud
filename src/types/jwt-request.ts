import { Request } from "express";

export interface JwtRequest extends Request {
  user?: {
    id: string;
    account: string;
    name: string;
    phoneNumber: string;
    wxNickname: string;
    passwordUpdatedAt: number;
    [property: string]: any;
  };
}
