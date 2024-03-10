import { Request } from 'express';

export interface AuthRequest extends Request {
  user: AuthRequest;
  userId: bigint;
  gender: boolean;
  grade: number;
  role?: number;
}

export interface KgRequest extends Request {
  kg: KgRequest;
  name: string;
  gender: boolean;
  birthDate: Date;
  ci: string;
  di: string;
  phone: string;
}
// export interface FileRequest {
//   file: Express.Multer.File[] & Request;
// }
export type UserStatus = 'registered' | 'profiled' | 'hexagonProfiled';

export class SavedKg {
  name: string;
  gender: boolean;
  birthDate: Date;
  ci: string;
  di: string;
  phone: string;
}

export interface KgTestRequest extends Request {
  kg: KgTestRequest;
  name: string;
  gender: boolean;
  birthDate: Date;
  ci: string;
  di: string;
  phone: string;
}

export class SavedKgRedisTest {
  name: string;
  gender: boolean;
  birthDate: Date;
  ci: string;
  di: string;
  phone: string;
  // phoneNumber: string;
  // identityVerificationId: string;
}
