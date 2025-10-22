import { CreateAuthOAuthDto } from '@app/contracts';

export interface GoogleProfile {
  id: string;
  name?: {
    givenName?: string;
    familyName?: string;
  };
  emails?: { value: string }[];
  photos?: { value: string }[];
}

export type VerifyCallback = (err: any, user?: CreateAuthOAuthDto) => void;
