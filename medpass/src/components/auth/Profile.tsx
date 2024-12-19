import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { UserCircle } from "lucide-react";
import { Button } from "@/components/ui/button";

const Profile = () => {
  const { user } = useAuth0();

  return (
    <Button
      variant="ghost"
      className="w-full h-12 p-0 hover:bg-gray-800/40 rounded-lg"
      title={user?.name || 'Profile'}
    >
      {user?.picture ? (
        <img 
          src={user.picture}
          alt={user.name || 'Profile'}
          className="w-5 h-5 rounded-full"
        />
      ) : (
        <UserCircle className="w-5 h-5 text-gray-400 hover:text-white" />
      )}
    </Button>
  );
};

export default Profile;