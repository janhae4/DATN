export enum Provider {
    LOCAL = 'LOCAL',
    GOOGLE = 'GOOGLE',
}

export interface User {
    id: string
    name: string
    email: string
    username: string
    phone?: string
    provider: Provider
    avatar?: string
}

export interface SettingsSectionProps {
    user: User
}
