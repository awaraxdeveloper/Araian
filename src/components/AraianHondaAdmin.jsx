import React from "react";
import SingleCompanyAdmin from "./SingleCompanyAdmin";

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
