import VideoAccess from "@/components/meeting/VideoAccess";

export default async function MeetingPage() {

    return (
        <>
            <h1 className="text-2xl font-semibold">Meeting</h1>
            <div className="mt-4">
                <VideoAccess />
            </div>
        </>
    );
}
