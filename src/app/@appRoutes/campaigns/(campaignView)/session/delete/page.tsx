import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import query from "@/lib/database";
import { deleteSession } from "@/lib/actions/sessions";

/**
 * Props type for DeleteSessionPage component
 * @typedef {Object} DeleteSessionPageProps
 * @property {Promise<{ sessionId?: string; campaignId?: string }>} searchParams - URL search parameters.
 */
type DeleteSessionPageProps = {
    searchParams: Promise<{ sessionId?: string; campaignId?: string }>;
};

/**
 * Handles session deletion logic for a campaign
 * Redirects users based on authentication and authorization checks
 *
 * @param {DeleteSessionPageProps} props - Component props
 * @returns {Promise<void>} - This function does not return JSX, as it only handles redirection.
 */
export default async function DeleteSessionPage({ searchParams }: DeleteSessionPageProps) {
    const sessionData = await auth();
    const { sessionId, campaignId } = await searchParams;
    if (!sessionId || !campaignId) {
        redirect("/campaigns");
    }

    const sId = Number(sessionId);
    const cId = Number(campaignId);
    if (isNaN(sId) || isNaN(cId)) {
        redirect("/campaigns");
    }

    // Verify that the current user is the DM of the campaign.
    const campaigns = await query<{ dungeon_master_id: number }[]>(`
    SELECT dungeon_master_id
    FROM campaign
    WHERE id = ?
  `, [cId]);

    if (!campaigns.length) {
        redirect("/campaigns");
    }
    const campaign = campaigns[0];
    if (!sessionData?.user || campaign.dungeon_master_id.toString() !== sessionData.user.id) {
        redirect("/campaigns");
    }

    // Call deleteSession function.
    const result = await deleteSession(sId, cId);
    if (result.ok) {
        redirect(result.redirect!);
    } else {
        // Optionally handle error (for now, just redirect back)
        redirect(`/campaigns/view?campaignId=${cId}`);
    }
}
