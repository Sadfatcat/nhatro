import { RequestUser } from './jwt-payload.interface';

declare global {
  namespace Express {
    interface Request {
      user?: RequestUser;
    }
  }
}
