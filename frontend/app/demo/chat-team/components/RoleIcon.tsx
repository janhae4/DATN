import { CrownIcon, UserPlusIcon } from "lucide-react";

export const RoleIcon: React.FC<{ role?: UserRole }> = ({ role }) => {
  if (role === "OWNER")
    return (
      <div className="flex justify-center items-center gap-2">
        <CrownIcon className="w-5 h-5 text-yellow-500" />
        <p className="text-xs text-gray-500">Chủ sở hữu</p>
      </div>
    );
  if (role === "ADMIN")
    return (
      <div className="flex justify-center items-center gap-2">
        <UserPlusIcon className="w-5 h-5 text-green-500" />
        <p className="text-xs text-gray-500">Quản lý</p>
      </div>
    );

  return null;
};
