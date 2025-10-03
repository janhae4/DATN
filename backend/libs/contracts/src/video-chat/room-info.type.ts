export type RoomInfo = {
  id: string;
  maxSize: number;
  members: Set<string>;      
  pending: Set<string>;        
  owner: string; //userId
  isPrivate: boolean;            
  password?: string;              
  waitingRoom?: boolean;         
  createdAt: Date;
};
