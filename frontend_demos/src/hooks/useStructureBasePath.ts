import { useLocation } from "react-router";

export function useStructureBasePath() {
  const location = useLocation();
  const isSuperAdmin = location.pathname.startsWith("/superadmin");
  const isManager = location.pathname.startsWith("/manager");
  const isPoPreview = location.pathname.startsWith("/admin-po/preview");

  if (isSuperAdmin) {
    return {
      home: "/superadmin",
      blocks: "/superadmin/structure",
      locations: "/superadmin/structure/locations",
      block: (id: string) => `/superadmin/structure/blocks/${id}`,
      location: (id: string) => `/superadmin/structure/locations/${id}`,
      employee: (id: string) => `/admin-personnel/manage/${id}`,
      isPoPreview,
    };
  }

  if (isManager) {
    return {
      home: "/manager",
      blocks: "/manager",
      locations: "/manager/locations",
      block: (_id: string) => `/manager`,
      location: (id: string) => `/manager/locations/${id}`,
      employee: (id: string) => `/manager/employees/${id}`,
      isPoPreview,
    };
  }

  return {
    home: isPoPreview ? "/admin-po" : "/admin-personnel",
    blocks: "/admin-personnel/blocks",
    locations: "/admin-personnel/locations",
    block: (id: string) => `/admin-personnel/blocks/${id}`,
    location: (id: string) => `/admin-personnel/locations/${id}`,
    employee: (id: string) => `/admin-personnel/manage/${id}`,
    isPoPreview,
  };
}
