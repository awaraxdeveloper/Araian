import React from "react";
import SingleCompanyAdmin from "./SingleCompanyAdmin";

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
