export class RemoveTeam {
  userId: string;
  teamId: string;
}

export interface RemoveTeamEventPayload {
  requesterId: string;
  requesterName: string;
  teamId: string;
  teamName: string;
  memberIdsToNotify: string[]

}