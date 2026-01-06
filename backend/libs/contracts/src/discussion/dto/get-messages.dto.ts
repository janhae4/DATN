export class GetMessageDiscussionDto {
  discussionId: string;
  userId: string;
  page = 1;
  limit = 20;
}
