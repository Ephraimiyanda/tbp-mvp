import { GroupDetail } from "@/components/GroupsClient";

export default async function ProGroupDetail({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <GroupDetail groupId={id} basePath="/pro" />;
}
