// Mock Data for Profile Page
import { User, Provider } from '../../../lib/types/profile.type'

// Mock Data (Keeping LOCAL provider for demoing password change)
export const mockUser: User = {
    id: "uuid-12345",
    name: "Alex Smith",
    email: "alex.smith@example.com",
    username: "alex_smith",
    phone: "0901 234 567",
    provider: Provider.LOCAL,
    avatar: "https://placehold.co/100x100/A0E6FF/000?text=AS",
}
