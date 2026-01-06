// Mock Data for Profile Page
import { User } from '@/types/auth';
import { Provider, Role } from '@/types/common/enums';

// Mock Data (Keeping LOCAL provider for demoing password change)
export const mockUser: User = {
    id: "uuid-12345",
    name: "Alex Smith",
    email: "alex.smith@example.com",
    // username: "alex_smith", // User interface doesn't have username
    phone: "0901 234 567",
    provider: Provider.LOCAL,
    avatar: "https://placehold.co/100x100/A0E6FF/000?text=AS",
    role: Role.USER,
    isBan: false,
    isActive: true,
    isVerified: true,
    createdAt: new Date().toISOString()
}
