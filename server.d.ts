import { Request } from 'express';
import { AuthObject } from '@clerk/express';

declare module 'express' {
  export interface Request {
    auth: AuthObject;
  }
}
