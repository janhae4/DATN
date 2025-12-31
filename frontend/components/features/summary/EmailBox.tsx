"use client"
import React, { useState, useEffect } from "react";
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
} from "@/components/ui/avatar"

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  Mail,
  Reply,
  Forward,
  PlusCircle,
  Loader2,
  Send,
  X,
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"

import { useGmail } from "@/hooks/useGmail";
import { GmailMessage } from "@/services/gmailService";

// Helpers
const truncateText = (text: string, maxLength: number) => {
  if (!text) return '';
  return text.length > maxLength ? text.substring(0, maxLength) + '...' : text;
};

const getSenderName = (from: string) => {
  if (!from) return 'Unknown';
  const match = from.match(/^"?(.*?)"? <.*>$/);
  return match ? match[1] : from.split('<')[0].trim() || from;
};

const getSenderEmail = (from: string) => {
  if (!from) return '';
  const match = from.match(/<(.*)>/);
  return match ? match[1] : from;
};

const getInitials = (name: string) => {
  return name
    .split(' ')
    .map(n => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
};


const EmailDetail = ({
  message,
  fetchDetail
}: {
  message: GmailMessage,
  fetchDetail: (id: string) => Promise<GmailMessage>
}) => {
  const [detail, setDetail] = useState<GmailMessage | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    fetchDetail(message.id).then(data => {
      if (mounted) {
        setDetail(data);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });
    return () => { mounted = false; };
  }, [message.id]);

  if (loading) return <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>;
  if (!detail) return <div className="text-red-500">Failed to load email content</div>;

  const senderName = getSenderName(detail.from);
  const senderEmail = getSenderEmail(detail.from);

  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
      <div className="text-sm text-muted-foreground space-y-1 mb-4 flex-shrink-0">
        <p>
          <span className="font-medium text-foreground w-16 inline-block">From:</span>
          {senderName} &lt;{senderEmail}&gt;
        </p>
        <p>
          <span className="font-medium text-foreground w-16 inline-block">To:</span>
          {detail.to}
        </p>
      </div>
      <Separator className="mb-4 flex-shrink-0" />
      <div className="flex-1 overflow-y-auto pr-2 min-h-0">
        <div
          className="text-sm leading-relaxed whitespace-pre-wrap break-words [&_img]:max-w-full [&_iframe]:max-w-full overflow-hidden"
          dangerouslySetInnerHTML={{ __html: detail.body || detail.snippet || '' }}
        />
      </div>
    </div>
  );
};

interface ComposeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  type: 'reply' | 'forward' | 'compose';
  initialData?: {
    to?: string;
    subject?: string;
    content?: string;
    messageId?: string;
    threadId?: string;
  };
  onSend: (data: any) => Promise<void>;
}

const ComposeMailDialog = ({ open, onOpenChange, type, initialData, onSend }: ComposeDialogProps) => {
  const [to, setTo] = useState(initialData?.to || '');
  const [subject, setSubject] = useState(initialData?.subject || '');
  const [content, setContent] = useState(initialData?.content || '');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (open) {
      setTo(initialData?.to || '');
      setSubject(initialData?.subject || '');
      setContent(initialData?.content || '');
    }
  }, [open, initialData]);

  const handleSend = async () => {
    if (!to || !subject || !content) {
      toast.error("Please fill in all fields");
      return;
    }

    setSending(true);
    try {
      await onSend({
        to,
        subject,
        content,
        messageId: initialData?.messageId,
        threadId: initialData?.threadId,
        type
      });
      toast.success("Email sent successfully");
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to send email");
    } finally {
      setSending(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] z-[99999]">
        <DialogHeader>
          <DialogTitle>{type === 'reply' ? 'Reply Message' : type === 'forward' ? 'Forward Message' : 'New Message'}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="to">To</Label>
            <Input id="to" value={to} onChange={(e) => setTo(e.target.value)} placeholder="recipient@example.com" disabled={type === 'reply'} />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="subject">Subject</Label>
            <Input id="subject" value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="content">Message</Label>
            <Textarea
              id="content"
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Type your message here..."
              className="min-h-[200px]"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSend} disabled={sending}>
            {sending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Send className="mr-2 h-4 w-4" />}
            Send
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export function EmailBox() {
  const { emails, loading, loadingMore, error, getMailDetail, sendMail, replyMail, loadMore } = useGmail(20);
  const [composeOpen, setComposeOpen] = useState(false);
  const [composeData, setComposeData] = useState<any>(null);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const { scrollTop, clientHeight, scrollHeight } = e.currentTarget;
    if (scrollHeight - scrollTop <= clientHeight + 50) { // Load more when near bottom
      loadMore();
    }
  };

  const handleCompose = (type: 'reply' | 'forward' | 'compose', email?: GmailMessage) => {
    const isReply = type === 'reply';
    const isForward = type === 'forward';

    if (type === 'compose' || !email) {
      setComposeData({
        type: 'compose',
        to: '',
        subject: '',
        content: '',
      });
      setComposeOpen(true);
      return;
    }

    const senderEmail = getSenderEmail(email.from);

    setComposeData({
      type,
      to: isReply ? senderEmail : '',
      subject: isReply ? `Re: ${email.subject}` : `Fwd: ${email.subject}`,
      content: isReply ? '' : `\n\n---------- Forwarded message ---------\nFrom: ${email.from}\nDate: ${new Date(email.date).toLocaleString()}\nSubject: ${email.subject}\nTo: ${email.to}\n\n${email.snippet}...`,
      messageId: email.id,
      threadId: email.threadId,
    });
    setComposeOpen(true);
  };

  const onSendEmail = async (data: any) => {
    if (data.type === 'reply') {
      await replyMail({
        to: data.to,
        subject: data.subject,
        content: data.content,
        messageId: data.messageId,
        threadId: data.threadId
      });
    } else {
      await sendMail({
        to: data.to,
        subject: data.subject,
        content: data.content,
      });
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mail className="h-5 w-5 text-muted-foreground" />
              Inbox (Last 20)
            </div>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => handleCompose('compose', {} as GmailMessage)}>
                    <PlusCircle className="h-5 w-5 text-muted-foreground hover:text-foreground" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Compose new email</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </CardTitle>
          <CardDescription>
            Your most recent emails.
          </CardDescription>
        </CardHeader>

        <CardContent>
          {loading ? (
            <div className="flex justify-center p-4"><Loader2 className="animate-spin" /></div>
          ) : error ? (
            <div className="text-red-500 text-sm">{error}</div>
          ) : (
            <div className="h-[250px] overflow-y-auto pr-4" onScroll={handleScroll}>
              <div className="flex flex-col gap-1">
                {emails.map((email) => {
                  const rawSenderName = getSenderName(email.from);
                  const senderName = truncateText(rawSenderName, 25);
                  const initials = getInitials(rawSenderName);
                  const timeDisplay = new Date(email.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

                  const displaySubject = truncateText(email.subject || '(No Subject)', 40);
                  const displaySnippet = truncateText(email.snippet, 60);

                  return (
                    <Dialog key={email.id}>
                      <DialogTrigger asChild>
                        <div className="flex items-start gap-3 p-2 rounded-lg hover:bg-muted cursor-pointer">
                          <Avatar className="h-9 w-9 border">
                            <AvatarFallback>{initials}</AvatarFallback>
                          </Avatar>
                          <div className="flex-1 overflow-hidden">
                            <div className="flex justify-between items-baseline">
                              <p className="text-sm font-medium leading-none truncate pr-2">
                                {senderName}
                              </p>
                              <p className="text-xs text-muted-foreground whitespace-nowrap">
                                {timeDisplay}
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground font-medium truncate">
                              {displaySubject}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {displaySnippet}
                            </p>
                          </div>
                        </div>
                      </DialogTrigger>

                      <DialogContent className="sm:max-w-[750px] max-h-[90vh] flex flex-col z-[9999]">
                        <DialogHeader>
                          <DialogTitle>{email.subject || '(No Subject)'}</DialogTitle>
                          <DialogDescription>
                            Received: {new Date(email.date).toLocaleString()}
                          </DialogDescription>
                        </DialogHeader>

                        <div className="flex-1 min-h-0 overflow-hidden py-4 flex flex-col">
                          <EmailDetail message={email} fetchDetail={getMailDetail} />
                        </div>

                        <Separator />

                        <DialogFooter className="flex-col-reverse sm:flex-row sm:justify-between sm:space-x-2">
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button variant="default" className="w-full sm:w-auto">
                                  <PlusCircle className="h-4 w-4 mr-2" />
                                  Convert to Task
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent>
                                <p>Create a task from this email</p>
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                          <div className="flex gap-2">
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => handleCompose('reply', email)}>
                                    <Reply className="h-4 w-4 mr-2" />
                                    Reply
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Reply to sender</p>
                                </TooltipContent>
                              </Tooltip>

                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <Button variant="outline" size="sm" onClick={() => handleCompose('forward', email)}>
                                    <Forward className="h-4 w-4 mr-2" />
                                    Forward
                                  </Button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p>Forward this email</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  )
                })}
                {loadingMore && <div className="flex justify-center py-2"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>}
                {emails.length === 0 && !loading && <p className="text-center text-muted-foreground text-sm py-4">No emails found.</p>}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {composeData && (
        <ComposeMailDialog
          open={composeOpen}
          onOpenChange={setComposeOpen}
          type={composeData.type}
          initialData={composeData}
          onSend={onSendEmail}
        />
      )}
    </>
  )
}