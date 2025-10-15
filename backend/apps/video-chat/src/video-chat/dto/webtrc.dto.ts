export class OfferDto {
  sdp: RTCSessionDescriptionInit;
  targetId: string;
}

export class AnswerDto {
  sdp: RTCSessionDescriptionInit;
  targetId: string;
}

export class IceCandidateDto {
  candidate: RTCIceCandidateInit;
  targetId: string;
}
