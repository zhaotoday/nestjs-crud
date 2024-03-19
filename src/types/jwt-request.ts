import { Request } from "express";
import { PlatformEnum } from "../enums/platform.enum";

export interface JwtRequest extends Request {
  user?: {
    id: string;
    account: string;
    name: string;
    phoneNumber: string;
    wxNickname: string;
    loggedIn: {
      platform: PlatformEnum;
      at: number;
    };
    passwordUpdatedAt: number;
    [property: string]: any;
  };
}
