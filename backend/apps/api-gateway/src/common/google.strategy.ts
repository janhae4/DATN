import { Provider } from '@app/contracts/user/user.dto';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptionsWithRequest } from 'passport-google-oauth20';
import { GoogleProfile } from '../dto/google-profile.dto';
import { VerifiedCallback } from 'passport-jwt';
import { Request } from 'express';
import { GoogleAccountDto } from '@app/contracts/auth/account-google.dto';
interface StatePayload {
  type?: 'link' | 'login';
  jwt?: string;
}

@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
  constructor() {
    super({
      clientID: process.env.GOOGLE_CLIENT_ID,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET,
      callbackURL: process.env.GOOGLE_CALLBACK_URL,
      passReqToCallback: true,
      scope: [
        'email',
        'profile',
        'https://www.googleapis.com/auth/calendar',
        'https://www.googleapis.com/auth/calendar.events',
        'https://www.googleapis.com/auth/gmail.readonly',
        'https://www.googleapis.com/auth/gmail.send',
      ],
    } as StrategyOptionsWithRequest);
  }

  validate(
    req: Request,
    accessToken: string,
    refreshToken: string,
    profile: GoogleProfile,
    done: VerifiedCallback,
  ) {
    const { id, name, emails, photos } = profile;

    const rawState = req.query.state as string | undefined;

    let state: StatePayload = {};
    if (rawState) {
      try {
        state = JSON.parse(rawState) as StatePayload;
      } catch {
        state = {};
      }
    }

    const isLinking = state.type === 'link';
    const linkedUser = (state.jwt as string) || undefined;

    const user: GoogleAccountDto = {
      provider: Provider.GOOGLE,
      providerId: id || emails?.[0]?.value || '',
      email: emails?.[0]?.value || '',
      name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
      avatar: photos?.[0]?.value || '',
      accessToken,
      refreshToken,
      isLinking,
      linkedUser,
    };

    done(null, user);
  }
}
