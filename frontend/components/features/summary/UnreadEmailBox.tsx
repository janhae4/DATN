"use client"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Avatar,
  AvatarFallback,
  AvatarImage,
} from "@/components/ui/avatar"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Mail,
  Reply,
  Forward,
  PlusCircle,
} from "lucide-react"


const unreadEmails = [
  {
    id: 1,
    sender: "Your Boss",
    fromEmail: "boss@company.com",
    toEmail: "you@company.com",
    cc: ["team-lead@company.com"],
    initials: "YB",
    subject: "URGENT UPDATE: Project Y",
    snippet: "We need to discuss the new timeline immediately...",
    body: "We need to discuss the new timeline immediately. The client has moved up the deadline to next Friday. Please review the attached documents and let's sync up at 11 AM.",
    time: "10m ago",
  },
  {
    id: 2,
    sender: "Figma",
    fromEmail: "notifications@figma.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "FG",
    subject: "New comments on 'Dashboard Design'",
    snippet: "Jane Doe mentioned you in a comment...",
    body: "Jane Doe mentioned you in a comment on 'Dashboard Design': \n\n'@you Can we update the color on this button to be the primary blue? It looks like the secondary one right now.'",
    time: "45m ago",
  },
  {
    id: 3,
    sender: "Slack",
    fromEmail: "no-reply@slack.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "SL",
    subject: "You have 3 new messages",
    snippet: "From Alex in #general: Are you free for a quick call?...",
    body: "From Alex in #general: Are you free for a quick call? \n\nAlso, don't forget the team retro at 4 PM.",
    time: "1h ago",
  },
  {
    id: 4,
    sender: "HR Department",
    fromEmail: "hr@company.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "HR",
    subject: "Reminder: Submit your timesheet",
    snippet: "Please make sure to log your hours before 5 PM...",
    body: "Hi, \n\nThis is a friendly reminder to submit your timesheet for this week before 5 PM today to avoid payroll delays.\n\nThank you!",
    time: "2h ago",
  },
  {
    id: 5,
    sender: "GitHub",
    fromEmail: "noreply@github.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "GH",
    subject: "New pull request in 'frontend-dashboard'",
    snippet: "John opened a pull request: Fix chart rendering bug...",
    body: "John opened a new pull request on 'frontend-dashboard': \n\nTitle: Fix chart rendering bug \n\nCheck it out and review when you have time.",
    time: "3h ago",
  },
  {
    id: 6,
    sender: "Notion",
    fromEmail: "updates@notion.so",
    toEmail: "you@company.com",
    cc: [],
    initials: "NT",
    subject: "Your workspace got an update",
    snippet: "We’ve improved the sidebar navigation and added new templates...",
    body: "Hi there, \n\nWe just rolled out new updates to your Notion workspace! The sidebar is now customizable, and you can try our new 'Team Wiki' template.",
    time: "5h ago",
  },
  {
    id: 7,
    sender: "Client – Aurora Corp",
    fromEmail: "lucas@auroracorp.com",
    toEmail: "you@company.com",
    cc: ["sales@company.com"],
    initials: "AC",
    subject: "Feedback on proposal",
    snippet: "We’ve reviewed your proposal and have some suggestions...",
    body: "Hi, \n\nWe’ve reviewed your proposal and have some feedback regarding the pricing model and timeline. Could we schedule a call tomorrow morning to discuss?",
    time: "8h ago",
  },
  {
    id: 8,
    sender: "Google Calendar",
    fromEmail: "no-reply@google.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "GC",
    subject: "Meeting: Sprint Planning",
    snippet: "Your meeting starts in 30 minutes...",
    body: "Reminder: 'Sprint Planning Meeting' with your team starts at 10:30 AM.\n\nJoin via Meet: https://meet.google.com/xyz-123",
    time: "10h ago",
  },
  {
    id: 9,
    sender: "Finance Department",
    fromEmail: "finance@company.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "FD",
    subject: "Invoice #3245 ready for approval",
    snippet: "Please review the attached invoice before EOD...",
    body: "Hi, \n\nInvoice #3245 for the vendor 'BlueTech' is ready for your approval. Please review the document and confirm by end of the day.",
    time: "12h ago",
  },
  {
    id: 10,
    sender: "Trello",
    fromEmail: "notifications@trello.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "TR",
    subject: "You were added to 'Marketing Q4' board",
    snippet: "You’ve been invited to collaborate on a new Trello board...",
    body: "Hi there, \n\nYou’ve been added to the 'Marketing Q4' board by Jane Smith. Check it out and start planning upcoming campaigns.",
    time: "15h ago",
  },
  {
    id: 11,
    sender: "AWS Notifications",
    fromEmail: "aws-notify@amazon.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "AW",
    subject: "Billing alert: Usage exceeded threshold",
    snippet: "Your EC2 usage exceeded the configured limit...",
    body: "Your AWS account has exceeded the usage threshold for EC2 instances. Please review your billing dashboard for more details.",
    time: "1d ago",
  },
  {
    id: 12,
    sender: "Dribbble",
    fromEmail: "updates@dribbble.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "DB",
    subject: "New likes on your shot 'Minimal Dashboard'",
    snippet: "Your design is getting attention! 15 new likes today...",
    body: "Congrats! Your shot 'Minimal Dashboard' received 15 new likes and 3 comments. Keep up the great work!",
    time: "2d ago",
  },
  {
    id: 13,
    sender: "LinkedIn",
    fromEmail: "updates@linkedin.com",
    toEmail: "you@company.com",
    cc: [],
    initials: "LI",
    subject: "Someone viewed your profile",
    snippet: "3 people viewed your profile this week...",
    body: "Your profile is trending! 3 new people have viewed your profile in the past week. See who they are and connect back.",
    time: "3d ago",
  },
];



export function UnreadEmailBox() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Mail className="h-5 w-5 text-muted-foreground" />
          Unread Emails
        </CardTitle>
        <CardDescription>
          Your most recent important emails.
        </CardDescription>
      </CardHeader>

      <CardContent>
        <ScrollArea className="h-[250px] pr-4">
          <div className="flex flex-col gap-1">
            {unreadEmails.map((email) => (
              <Dialog key={email.id}>
                <DialogTrigger asChild>
                  <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                    <Avatar className="h-9 w-9 border">
                      <AvatarFallback>{email.initials}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1 overflow-hidden">
                      <div className="flex justify-between items-baseline">
                        <p className="text-sm font-medium leading-none">
                          {email.sender}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {email.time}
                        </p>
                      </div>
                      <p className="text-sm text-muted-foreground font-medium truncate">
                        {email.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {email.snippet}
                      </p>
                    </div>
                  </div>
                </DialogTrigger>

                <DialogContent className="sm:max-w-[750px]">
                  <DialogHeader>
                    <DialogTitle>{email.subject}</DialogTitle>
                    <DialogDescription>
                      Received: {email.time}
                    </DialogDescription>
                  </DialogHeader>

                  {/* Thông tin chi tiết From, To, CC */}
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>
                      <span className="font-medium text-foreground w-16 inline-block">
                        From:
                      </span>
                      {email.sender} &lt;{email.fromEmail}&gt;
                    </p>
                    <p>
                      <span className="font-medium text-foreground w-16 inline-block">
                        To:
                      </span>
                      {email.toEmail}
                    </p>
                    {email.cc && email.cc.length > 0 && (
                      <p>
                        <span className="font-medium text-foreground w-16 inline-block">
                          CC:
                        </span>
                        {email.cc.join(", ")}
                      </p>
                    )}
                  </div>

                  <Separator />

                  {/* Nội dung email bên trong thanh cuộn */}
                  <ScrollArea className="max-h-[400px] pr-4">
                    <p className="text-sm leading-relaxed whitespace-pre-wrap">
                      {email.body}
                    </p>
                  </ScrollArea>

                  <Separator />

                  <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                    {/* Nút chính: Chuyển sang Task */}
                    <Button
                      variant="default"
                      className="w-full sm:w-auto"
                      onClick={() => {
                        console.log(
                          "Convert to task:",
                          email.subject
                        )
                      }}
                    >
                      <PlusCircle className="h-4 w-4 mr-2" />
                      Convert to Task
                    </Button>
                    
                    {/* Các nút phụ */}
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm">
                        <Reply className="h-4 w-4 mr-2" />
                        Reply
                      </Button>
                      <Button variant="outline" size="sm">
                        <Forward className="h-4 w-4 mr-2" />
                        Forward
                      </Button>
                    </div>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  )
}