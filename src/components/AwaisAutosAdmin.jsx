import React from "react";
import SingleCompanyAdmin from "../lib/supabaseClient";

export default function AwaisAutosAdmin({ currentUser, onLogout, companyId }) {
  return (
    <SingleCompanyAdmin
      companyId={companyId}
      companyName="Awais Autos"
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
}
