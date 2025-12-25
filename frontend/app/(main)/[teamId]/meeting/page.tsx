'use client';

import { useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from "sonner";
import { Loader2, Video, Link, ArrowRight, Keyboard } from 'lucide-react';

// 1. Import Hooks & Services
import { videoChatService } from '@/services/videoChatService';
import apiClient from '@/services/apiClient';
import { useAuth } from '@/contexts/AuthContext';

export default function CreateVideoCallPage() {
  const { user } = useAuth();
  const [roomId, setRoomId] = useState('');
  const [isCreating, setIsCreating] = useState(false);
  const router = useRouter();
  const params = useParams();
  const teamId = params.teamId as string;

  const handleCreateRoom = async () => {
    if (!user) {
      toast.error('Authentication required', { description: 'Please login to create a meeting.' });
      return;
    }

    setIsCreating(true);

    try {
      const teamsResponse = await apiClient.get('/teams');
      const teams = teamsResponse.data;

      if (!teams || teams.length === 0) {
        toast.error('No Team Found', { description: 'You need to be part of a team to start a call.' });
        return;
      }

      // Default to current context or first team
      const defaultTeamId = teamId || teams[0].id;

      const response = await videoChatService.createOrJoinCall({
        teamId: defaultTeamId
      });

      if (response && response.roomId) {
        toast.success('Meeting Created', {
          description: 'Redirecting you to the room...',
        });
        router.push(`/meeting/${response.roomId}`);
      }
    } catch (error: any) {
      console.error('Create room error:', error);
      toast.error('Failed to create room', {
        description: error.response?.data?.message || 'Please try again.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleJoinRoom = async () => {
    if (!roomId.trim()) {
      toast.warning('Input required', { description: 'Please enter a Room ID or Link.' });
      return;
    }

    let finalRoomId = roomId.trim();
    if (finalRoomId.startsWith('http')) {
      try {
        const url = new URL(finalRoomId);
        const extracted = url.pathname.split('/').pop();
        if (extracted) finalRoomId = extracted;
      } catch (e) { /* ignore error */ }
    }

    setIsCreating(true);
    try {
      const history = await videoChatService.getCallInfo(finalRoomId);

      if (history && history.length > 0) {
        toast.info('Joining Room...', {
          description: `Target: ${finalRoomId}`,
        });
        router.push(`/meeting/${finalRoomId}`);
      } else {
        toast.error('Invalid Room', {
          description: 'The meeting ID is invalid or has ended.',
        });
      }
    } catch (error: any) {
      console.error('Join room error:', error);
      toast.error('Connection Error', {
        description: error.response?.data?.message || 'Could not verify room details.',
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex min-h-[80vh] flex-col items-center justify-center bg-background p-4 sm:p-8">
      <div className="w-full max-w-md space-y-8">

        {/* Header Section */}
        <div className="flex flex-col items-center space-y-4 text-center">


          <div className="space-y-1.5">
            <h1 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
              Video Meeting
            </h1>
            <p className="mx-auto max-w-[300px] text-sm text-muted-foreground">
              Start a new collaboration or join your team instantly.
            </p>
          </div>
        </div>

        {/* Actions Container */}
        <div className="grid gap-6 p-2">

          {/* Option A: Create New */}
          <Button
            onClick={handleCreateRoom}
            disabled={isCreating}
            size="lg"
            className="w-full h-12 text-base font-medium transition-all hover:opacity-90"
          >
            {isCreating ? (
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
            ) : (
              <Video className="mr-2 h-5 w-5" />
            )}
            {isCreating ? 'Creating Space...' : 'Start New Meeting'}
          </Button>

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">
                Or join with code
              </span>
            </div>
          </div>

          {/* Option B: Join Existing */}
          <div className="flex flex-col gap-3">
            <div className="relative">
              <Link className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                type="text"
                placeholder="Paste link or enter room code"
                value={roomId}
                onChange={(e) => setRoomId(e.target.value)}
                disabled={isCreating}
                className="h-11 pl-9 pr-12 bg-muted/30"
                onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
              />
            </div>

            <Button
              onClick={handleJoinRoom}
              disabled={isCreating || !roomId.trim()}
              variant="secondary"
              className="w-full h-11"
            >
              {isCreating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <span className="flex items-center">
                  Join Room <ArrowRight className="ml-2 h-4 w-4" />
                </span>
              )}
            </Button>
          </div>

        </div>
      </div>
    </div>
  );
}