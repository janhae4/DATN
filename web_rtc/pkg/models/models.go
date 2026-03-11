package models

import (
	"time"

	"github.com/google/uuid"
	"gorm.io/gorm"
)

type CallRole string

const (
	CallRoleHost   CallRole = "HOST"
	CallRoleAdmin  CallRole = "ADMIN"
	CallRoleMember CallRole = "MEMBER"
	CallRoleBanned CallRole = "BANNED"
)

type ParticipantStatus string

const (
	ParticipantStatusJoined   ParticipantStatus = "JOINED"
	ParticipantStatusPending  ParticipantStatus = "PENDING"
	ParticipantStatusRejected ParticipantStatus = "REJECTED"
)

type MemberRole string

const (
	MemberRoleOwner  MemberRole = "OWNER"
	MemberRoleAdmin  MemberRole = "ADMIN"
	MemberRoleMember MemberRole = "MEMBER"
)

type MemberStatus string

const (
	MemberStatusAccepted MemberStatus = "ACCEPTED"
	MemberStatusPending  MemberStatus = "PENDING"
	MemberStatusRejected MemberStatus = "REJECTED"
)

// Matches CachedMemberState in TS
type CachedMemberState struct {
	Role     MemberRole   `json:"role"`
	Status   MemberStatus `json:"status"`
	IsActive bool         `json:"isActive"`
	JoinedAt time.Time    `json:"joinedAt"`
}

type RefType string

const (
	RefTypeProject RefType = "PROJECT"
	RefTypeMeeting RefType = "MEETING"
)

type Call struct {
	ID             uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	RoomCode       string     `gorm:"unique;not null;column:roomCode" json:"roomId"`
	TeamID         string     `gorm:"not null;column:teamId" json:"teamId"`
	CreatedAt      time.Time  `gorm:"autoCreateTime;column:createdAt" json:"createdAt"`
	UpdatedAt      time.Time  `gorm:"autoUpdateTime;column:updatedAt" json:"updatedAt"`
	EndedAt        *time.Time `gorm:"column:endedAt" json:"endedAt"`
	RefID          *string    `gorm:"column:refId" json:"refId"`
	RefType        *RefType   `gorm:"type:varchar(20);column:refType" json:"refType"`
	Password       string     `gorm:"column:password" json:"-"`
	IsLobbyEnabled bool       `gorm:"column:isLobbyEnabled;default:false" json:"isLobbyEnabled"`
	HasPassword    bool       `gorm:"-" json:"hasPassword"`

	Participants      []CallParticipant  `gorm:"foreignKey:CallID" json:"participants"`
	CallTranscripts   []CallTranscript   `gorm:"foreignKey:CallID" json:"callTranscripts"`
	CallSummaryBlocks []CallSummaryBlock `gorm:"foreignKey:CallID" json:"callSummaryBlocks"`
	CallActionItems   []CallActionItem   `gorm:"foreignKey:CallID" json:"callActionItems"`
	Recordings        []CallRecording    `gorm:"foreignKey:CallID" json:"recordings"`
}

type CallParticipant struct {
	ID              uuid.UUID         `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	CallID          uuid.UUID         `gorm:"type:uuid;not null;column:callId" json:"callId"`
	Call            Call              `gorm:"foreignKey:CallID" json:"-"`
	UserID          string            `gorm:"not null;column:userId" json:"userId"`
	JoinedAt        time.Time         `gorm:"autoCreateTime;column:joinedAt" json:"joinedAt"`
	LeftAt          *time.Time        `gorm:"column:leftAt" json:"leftAt"`
	Role            CallRole          `gorm:"type:varchar(20);default:'MEMBER';column:role" json:"role"`
	Status          ParticipantStatus `gorm:"type:varchar(20);default:'JOINED';column:status" json:"status"`
	IsSharingScreen bool              `gorm:"default:false;column:isSharingScreen" json:"isSharingScreen"`
}

func (c *CallParticipant) BeforeCreate(tx *gorm.DB) (err error) {
	if c.ID == uuid.Nil {
		c.ID = uuid.New()
	}
	return
}

type CallTranscript struct {
	ID        uuid.UUID `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	CallID    uuid.UUID `gorm:"type:uuid;not null;column:callId" json:"callId"`
	Call      Call      `gorm:"foreignKey:CallID" json:"-"`
	UserID    string    `gorm:"column:userId" json:"userId"`
	UserName  string    `gorm:"column:userName" json:"userName"`
	Content   string    `gorm:"column:content" json:"content"`
	Timestamp time.Time `gorm:"column:timestamp" json:"timestamp"`
	CreatedAt time.Time `gorm:"autoCreateTime;column:createdAt" json:"createdAt"`
}

type CallSummaryBlock struct {
	ID        uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	CallID    uuid.UUID  `gorm:"type:uuid;not null;column:callId" json:"callId"`
	Call      Call       `gorm:"foreignKey:CallID" json:"-"`
	Content   string     `gorm:"type:text;column:content" json:"content"`
	StartTime *time.Time `gorm:"column:startTime" json:"startTime"`
	EndTime   *time.Time `gorm:"column:endTime" json:"endTime"`
	CreatedAt time.Time  `gorm:"autoCreateTime;column:createdAt" json:"createdAt"`
}

type CallActionItem struct {
	ID         uuid.UUID  `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	CallID     uuid.UUID  `gorm:"type:uuid;not null;column:callId" json:"callId"`
	Call       Call       `gorm:"foreignKey:CallID" json:"-"`
	Content    string     `gorm:"type:text;column:content" json:"content"`
	Status     string     `gorm:"default:'PENDING';column:status" json:"status"`
	AssigneeID   *string    `gorm:"column:assigneeId" json:"assigneeId"`
	AssigneeName *string    `gorm:"column:assigneeName" json:"assigneeName"`
	StartDate    *time.Time `gorm:"column:startDate" json:"startDate"`
	EndDate    *time.Time `gorm:"column:endDate" json:"endDate"`
	CreatedAt  time.Time  `gorm:"autoCreateTime;column:createdAt" json:"createdAt"`
}

func (Call) TableName() string {
	return "call"
}

func (CallParticipant) TableName() string {
	return "call_participant"
}

func (CallTranscript) TableName() string {
	return "call_transcript"
}

func (CallSummaryBlock) TableName() string {
	return "call_summary_block"
}

func (CallActionItem) TableName() string {
	return "call_action_item"
}

type RecordingStatus string

const (
	RecordingStatusRecording RecordingStatus = "RECORDING"
	RecordingStatusStopped   RecordingStatus = "STOPPED"
	RecordingStatusCompleted RecordingStatus = "COMPLETED"
	RecordingStatusFailed    RecordingStatus = "FAILED"
)

type CallRecording struct {
	ID          uuid.UUID       `gorm:"type:uuid;default:gen_random_uuid();primaryKey;column:id" json:"id"`
	CallID      uuid.UUID       `gorm:"type:uuid;not null;column:callId" json:"callId"`
	Call        Call            `gorm:"foreignKey:CallID" json:"-"`
	RequestedBy string          `gorm:"not null;column:requestedBy" json:"requestedBy"`
	ApprovedBy  *string         `gorm:"column:approvedBy" json:"approvedBy"`
	StartedAt   time.Time       `gorm:"autoCreateTime;column:startedAt" json:"startedAt"`
	EndedAt     *time.Time      `gorm:"column:endedAt" json:"endedAt"`
	Status      RecordingStatus `gorm:"type:varchar(20);default:'RECORDING';column:status" json:"status"`
	EgressID    *string         `gorm:"column:egressId" json:"egressId"`
	FileURL     *string         `gorm:"column:fileUrl" json:"fileUrl"`
	FileSizeKB  *int64          `gorm:"column:fileSizeKB" json:"fileSizeKB"`
	MimeType    string          `gorm:"default:'video/webm';column:mimeType" json:"mimeType"`
}

func (CallRecording) TableName() string {
	return "call_recording"
}
