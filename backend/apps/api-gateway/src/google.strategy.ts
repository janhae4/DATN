import { CreateAuthOAuthDto } from '@app/contracts/auth/create-auth-oauth';
import { Provider } from '@app/contracts/user/user.dto';
import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, StrategyOptions } from 'passport-google-oauth20';
@Injectable()
export class GoogleStrategy extends PassportStrategy(Strategy, 'google') {
    constructor() {
        super({
            clientID: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            callbackURL: process.env.GOOGLE_CALLBACK_URL,
            scope: [
                'email',
                'profile',
                'https://www.googleapis.com/auth/calendar',
                'https://www.googleapis.com/auth/calendar.events',
            ],
        } as StrategyOptions);
    }

    authorizationParams(): any {
        return {
            access_type: 'offline',
            prompt: 'consent',
        }
    }

    validate(
        accessToken: string,
        refreshToken: string,
        profile: any,
        done: Function,
    ) {
        const { id, name, emails, photos } = profile;

        const user: CreateAuthOAuthDto = {
            provider: Provider.GOOGLE,
            providerId: id || emails?.[0]?.value,
            email: emails?.[0]?.value,
            name: `${name?.givenName || ''} ${name?.familyName || ''}`.trim(),
            avatar: photos?.[0]?.value,
            accessToken,
            refreshToken,
        };

        done(null, user);
    }

}
