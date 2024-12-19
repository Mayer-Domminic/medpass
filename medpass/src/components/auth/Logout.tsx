import React from "react";
import { useAuth0 } from "@auth0/auth0-react";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

const LogoutButton = () => {
  const { logout } = useAuth0();

  return (
    <Button
      variant="ghost"
      className="w-full h-12 p-0 hover:bg-gray-800/40 rounded-lg"
      onClick={() => logout({ logoutParams: { returnTo: window.location.origin } })}
      title="Logout"
    >
      <LogOut className="w-5 h-5 text-gray-400 hover:text-white" />
    </Button>
  );
};

export default LogoutButton;