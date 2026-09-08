import React from "react";
import SingleCompanyAdmin from "../lib/supabaseClient";

export default function AraianHondaAdmin({ currentUser, onLogout, companyId }) {
  return (
    <SingleCompanyAdmin
      companyId={companyId}
      companyName="Araian Honda Centre"
      currentUser={currentUser}
      onLogout={onLogout}
    />
  );
}
