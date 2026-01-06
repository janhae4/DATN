import { Provider } from "../common/enums";

    
export interface IAccount {
  id: string;
  provider: Provider;
  providerId: string;
  email?: string;
  createdAt: string;
  updatedAt: string;
  userId: string;
}
